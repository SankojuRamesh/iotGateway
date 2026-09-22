import json
import logging
import threading
import time

import paho.mqtt.client as mqtt
from django.conf import settings
from django.core.management.base import BaseCommand
from django.utils import timezone

logger = logging.getLogger("mqtt_ingest")

TOPIC_REFRESH_INTERVAL_SECONDS = 30


class Command(BaseCommand):
    help = "Long-running MQTT consumer: subscribes to all configured device topics and ingests telemetry."

    def handle(self, *args, **options):
        self.subscribed_topics = set()
        client = mqtt.Client(
            callback_api_version=mqtt.CallbackAPIVersion.VERSION1,
            client_id="iotgateway-consumer",
            protocol=mqtt.MQTTv311,
        )
        if settings.MQTT_USERNAME:
            client.username_pw_set(settings.MQTT_USERNAME, settings.MQTT_PASSWORD)

        client.on_connect = self.on_connect
        client.on_message = self.on_message
        client.on_disconnect = self.on_disconnect

        self.stdout.write(
            f"Connecting to MQTT broker {settings.MQTT_BROKER_HOST}:{settings.MQTT_BROKER_PORT}..."
        )
        client.connect(settings.MQTT_BROKER_HOST, settings.MQTT_BROKER_PORT, keepalive=60)

        refresher = threading.Thread(
            target=self._topic_refresh_loop, args=(client,), daemon=True
        )
        refresher.start()

        client.loop_forever(retry_first_connection=True)

    def on_connect(self, client, userdata, flags, rc):
        if rc != 0:
            logger.error("MQTT connect failed with code %s", rc)
            return
        self.stdout.write(self.style.SUCCESS("MQTT connected."))
        self._resubscribe(client)

    def on_disconnect(self, client, userdata, rc):
        logger.warning("MQTT disconnected (rc=%s); paho will auto-reconnect.", rc)

    def _topic_refresh_loop(self, client):
        while True:
            time.sleep(TOPIC_REFRESH_INTERVAL_SECONDS)
            try:
                self._resubscribe(client)
            except Exception:
                logger.exception("Error refreshing MQTT topic subscriptions")

    def _resubscribe(self, client):
        from apps.devices.models import Device

        current_topics = set(
            Device.objects.exclude(mqtt_topic="").values_list("mqtt_topic", flat=True)
        )
        new_topics = current_topics - self.subscribed_topics
        removed_topics = self.subscribed_topics - current_topics

        for topic in new_topics:
            client.subscribe(topic, qos=1)
            logger.info("Subscribed to %s", topic)
        for topic in removed_topics:
            client.unsubscribe(topic)
            logger.info("Unsubscribed from %s", topic)

        self.subscribed_topics = current_topics

    def on_message(self, client, userdata, msg):
        from apps.devices.models import Device
        from apps.telemetry.services import ingest_payload

        device = Device.objects.filter(mqtt_topic=msg.topic).select_related(
            "device_type", "organization"
        ).first()
        if device is None:
            logger.warning("Received message on unknown topic '%s'", msg.topic)
            return

        try:
            payload = json.loads(msg.payload.decode("utf-8"))
        except (json.JSONDecodeError, UnicodeDecodeError):
            logger.warning("Invalid JSON payload on topic '%s': %r", msg.topic, msg.payload)
            return

        if not isinstance(payload, dict):
            logger.warning("Payload on '%s' is not a JSON object: %r", msg.topic, payload)
            return

        recorded_at = None
        if "timestamp" in payload:
            from django.utils.dateparse import parse_datetime

            recorded_at = parse_datetime(str(payload.pop("timestamp")))
        recorded_at = recorded_at or timezone.now()

        accepted, rejected = ingest_payload(device, payload, recorded_at=recorded_at)
        logger.info(
            "Ingested %d reading(s) for %s (rejected: %s)",
            len(accepted),
            device.device_id,
            rejected,
        )
