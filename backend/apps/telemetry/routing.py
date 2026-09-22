from django.urls import re_path

from apps.telemetry.consumers import TelemetryConsumer

websocket_urlpatterns = [
    re_path(
        r"^ws/telemetry/(?P<device_id>[0-9a-f-]+)/$",
        TelemetryConsumer.as_asgi(),
    ),
]
