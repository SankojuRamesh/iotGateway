import os

from celery import Celery
from celery.schedules import crontab

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.local")

app = Celery("iotgateway")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()

app.conf.beat_schedule = {
    "detect-offline-devices": {
        "task": "apps.devices.tasks.detect_offline_devices",
        "schedule": 60.0,
    },
    "evaluate-alert-rules": {
        "task": "apps.alerts.tasks.evaluate_alert_rules",
        "schedule": 30.0,
    },
    "rollup-telemetry": {
        "task": "apps.telemetry.tasks.rollup_recent_readings",
        "schedule": crontab(minute="*/5"),
    },
}
