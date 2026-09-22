from django.apps import AppConfig


class MqttIngestConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.mqtt_ingest"
    label = "mqtt_ingest"
