import json

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer


class TelemetryConsumer(AsyncJsonWebsocketConsumer):
    """
    WebSocket endpoint: ws://.../ws/telemetry/<device_id>/?token=<jwt>
    Streams live telemetry.reading events for one device to authorized,
    org-member clients. <device_id> is the Device UUID pk.
    """

    async def connect(self):
        self.device_id = self.scope["url_route"]["kwargs"]["device_id"]
        user = self.scope.get("user")

        if user is None or not user.is_authenticated:
            await self.close(code=4401)
            return

        allowed = await self._user_can_view_device(user, self.device_id)
        if not allowed:
            await self.close(code=4403)
            return

        self.group_name = f"device_{self.device_id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def telemetry_reading(self, event):
        await self.send(text_data=json.dumps(event))

    @database_sync_to_async
    def _user_can_view_device(self, user, device_id):
        from apps.devices.models import Device

        if user.is_superuser:
            return Device.objects.filter(pk=device_id).exists()
        org_ids = user.memberships.values_list("organization_id", flat=True)
        return Device.objects.filter(pk=device_id, organization_id__in=org_ids).exists()
