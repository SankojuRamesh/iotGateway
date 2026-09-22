import logging
from datetime import datetime

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.utils import timezone
from django.utils.dateparse import parse_datetime

from apps.devices.models import Device, MetricDefinition
from apps.telemetry.models import TelemetryReading

logger = logging.getLogger("mqtt_ingest")


class MetricValidationError(Exception):
    pass


def _coerce_value(metric: MetricDefinition, raw_value):
    data_type = metric.data_type
    try:
        if data_type == MetricDefinition.DataType.INTEGER:
            return {"value_numeric": float(int(raw_value))}
        if data_type == MetricDefinition.DataType.FLOAT:
            return {"value_numeric": round(float(raw_value), metric.decimal_precision)}
        if data_type == MetricDefinition.DataType.BOOLEAN:
            if isinstance(raw_value, str):
                raw_value = raw_value.strip().lower() in ("1", "true", "yes", "on")
            return {"value_boolean": bool(raw_value)}
        if data_type == MetricDefinition.DataType.DATETIME:
            if isinstance(raw_value, datetime):
                dt = raw_value
            else:
                dt = parse_datetime(str(raw_value))
            if dt is None:
                raise MetricValidationError(f"Invalid datetime value: {raw_value!r}")
            return {"value_datetime": dt}
        # STRING (default/fallback)
        return {"value_text": str(raw_value)[:255]}
    except (TypeError, ValueError) as exc:
        raise MetricValidationError(
            f"Cannot coerce value {raw_value!r} to {data_type} for metric '{metric.key}'"
        ) from exc


def _within_bounds(metric: MetricDefinition, coerced: dict) -> bool:
    numeric = coerced.get("value_numeric")
    if numeric is None:
        return True
    if metric.min_value is not None and numeric < metric.min_value:
        return False
    if metric.max_value is not None and numeric > metric.max_value:
        return False
    return True


def ingest_reading(device: Device, metric_key: str, raw_value, recorded_at=None):
    """Validate a single (metric_key, value) pair against the device's
    DeviceType.metrics and store it. Returns the created TelemetryReading,
    or None if the metric/value was rejected (unknown key, bad type, or
    out of configured min/max bounds) - callers should log and move on
    rather than fail the whole payload for one bad field.
    """
    metric = (
        MetricDefinition.objects.filter(
            device_type_id=device.device_type_id, key=metric_key
        )
        .first()
    )
    if metric is None:
        logger.warning(
            "Dropping unknown metric '%s' for device %s (type=%s)",
            metric_key,
            device.device_id,
            device.device_type.name,
        )
        return None

    try:
        coerced = _coerce_value(metric, raw_value)
    except MetricValidationError as exc:
        logger.warning("Dropping invalid reading: %s", exc)
        return None

    if not _within_bounds(metric, coerced):
        logger.warning(
            "Dropping out-of-bounds reading for %s.%s: %r (min=%s max=%s)",
            device.device_id,
            metric_key,
            raw_value,
            metric.min_value,
            metric.max_value,
        )
        return None

    recorded_at = recorded_at or timezone.now()
    reading = TelemetryReading.objects.create(
        organization_id=device.organization_id,
        device=device,
        metric_key=metric_key,
        recorded_at=recorded_at,
        **coerced,
    )
    Device.objects.filter(pk=device.pk).update(
        last_seen=recorded_at, status=Device.Status.ONLINE
    )
    device.last_seen = recorded_at
    device.status = Device.Status.ONLINE
    return reading


def ingest_payload(device: Device, payload: dict, recorded_at=None):
    """Ingest a full MQTT/REST payload of {metric_key: value, ...}.
    Returns (accepted_readings, rejected_keys)."""
    accepted, rejected = [], []
    for key, value in payload.items():
        reading = ingest_reading(device, key, value, recorded_at=recorded_at)
        if reading is not None:
            accepted.append(reading)
        else:
            rejected.append(key)

    if accepted:
        broadcast_readings(device, accepted)

    return accepted, rejected


def broadcast_readings(device: Device, readings):
    """Push newly ingested readings to any WebSocket clients subscribed to
    this device's telemetry group (see apps.telemetry.consumers)."""
    channel_layer = get_channel_layer()
    if channel_layer is None:
        return
    payload = {
        "type": "telemetry.reading",
        "device_id": str(device.id),
        "device_code": device.device_id,
        "status": device.status,
        "readings": [
            {
                "metric_key": r.metric_key,
                "value": r.value,
                "recorded_at": r.recorded_at.isoformat(),
            }
            for r in readings
        ],
    }
    async_to_sync(channel_layer.group_send)(f"device_{device.id}", payload)
