from datetime import timedelta

from celery import shared_task
from django.conf import settings
from django.utils import timezone


@shared_task
def detect_offline_devices():
    """Devices that have sent telemetry before but gone quiet flip to OFFLINE.
    Devices that have never sent anything stay UNKNOWN (not a regression)."""
    from apps.devices.models import Device

    threshold = timezone.now() - timedelta(
        seconds=settings.DEVICE_OFFLINE_THRESHOLD_SECONDS
    )
    stale = Device.objects.filter(last_seen__lt=threshold).exclude(
        status=Device.Status.OFFLINE
    )
    updated = stale.update(status=Device.Status.OFFLINE)
    return {"marked_offline": updated}
