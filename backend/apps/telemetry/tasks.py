from datetime import timedelta

from celery import shared_task
from django.db.models import Avg, Max, Min, Sum, Count
from django.db.models.functions import TruncMinute
from django.utils import timezone


@shared_task
def rollup_recent_readings():
    """Aggregate the last 10 minutes of numeric readings into 5-minute
    TelemetryRollup buckets. Runs every 5 minutes via Celery beat; the
    2x lookback window lets late-arriving readings still get rolled up."""
    from apps.telemetry.models import TelemetryReading, TelemetryRollup

    window_start = timezone.now() - timedelta(minutes=10)

    buckets = (
        TelemetryReading.objects.filter(
            recorded_at__gte=window_start, value_numeric__isnull=False
        )
        .annotate(bucket=TruncMinute("recorded_at"))
        .values("organization_id", "device_id", "metric_key", "bucket")
        .annotate(
            avg_value=Avg("value_numeric"),
            min_value=Min("value_numeric"),
            max_value=Max("value_numeric"),
            sum_value=Sum("value_numeric"),
            sample_count=Count("id"),
        )
    )

    upserted = 0
    for row in buckets:
        # snap to the 5-minute bucket start
        minute = row["bucket"]
        bucket_start = minute.replace(minute=(minute.minute // 5) * 5, second=0, microsecond=0)
        TelemetryRollup.objects.update_or_create(
            device_id=row["device_id"],
            metric_key=row["metric_key"],
            bucket_start=bucket_start,
            defaults={
                "organization_id": row["organization_id"],
                "avg_value": row["avg_value"],
                "min_value": row["min_value"],
                "max_value": row["max_value"],
                "sum_value": row["sum_value"],
                "sample_count": row["sample_count"],
            },
        )
        upserted += 1

    return {"buckets_upserted": upserted}
