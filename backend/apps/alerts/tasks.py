import operator
from datetime import timedelta

from celery import shared_task
from django.utils import timezone

CONDITION_OPS = {
    "gt": operator.gt,
    "gte": operator.ge,
    "lt": operator.lt,
    "lte": operator.le,
    "eq": operator.eq,
    "neq": operator.ne,
}


def _devices_for_rule(rule):
    from apps.devices.models import Device

    if rule.device_id:
        return Device.objects.filter(pk=rule.device_id)
    return Device.objects.filter(device_type_id=rule.device_type_id)


@shared_task
def evaluate_alert_rules():
    """For every active AlertRule, check the latest reading for its metric on
    each applicable device; create an AlertEvent when the condition holds and
    the rule isn't in cooldown for that device."""
    from apps.alerts.models import AlertEvent, AlertRule
    from apps.telemetry.models import TelemetryReading

    created = 0
    now = timezone.now()

    for rule in AlertRule.objects.filter(is_active=True).select_related(
        "device", "device_type"
    ):
        op = CONDITION_OPS[rule.condition]
        for device in _devices_for_rule(rule):
            latest = (
                TelemetryReading.objects.filter(
                    device=device, metric_key=rule.metric_key, value_numeric__isnull=False
                )
                .order_by("-recorded_at")
                .first()
            )
            if latest is None or not op(latest.value_numeric, rule.threshold):
                continue

            cooldown_cutoff = now - timedelta(seconds=rule.cooldown_seconds)
            recently_triggered = AlertEvent.objects.filter(
                rule=rule, device=device, triggered_at__gte=cooldown_cutoff
            ).exists()
            if recently_triggered:
                continue

            AlertEvent.objects.create(
                rule=rule,
                device=device,
                value=latest.value_numeric,
                triggered_at=now,
            )
            created += 1

    return {"alert_events_created": created}
