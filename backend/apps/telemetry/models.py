from django.db import models


class TelemetryReading(models.Model):
    """One normalized metric sample. High-volume table: BigAutoField PK,
    no UUID/timestamp-pair overhead, denormalized organization for fast
    tenant-scoped range queries without a join."""

    organization = models.ForeignKey(
        "accounts.Organization", on_delete=models.CASCADE, related_name="telemetry_readings"
    )
    device = models.ForeignKey(
        "devices.Device", on_delete=models.CASCADE, related_name="readings"
    )
    metric_key = models.CharField(max_length=64)
    recorded_at = models.DateTimeField(db_index=True)

    value_numeric = models.FloatField(null=True, blank=True)
    value_boolean = models.BooleanField(null=True, blank=True)
    value_text = models.CharField(max_length=255, null=True, blank=True)
    value_datetime = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-recorded_at"]
        indexes = [
            models.Index(fields=["device", "metric_key", "-recorded_at"]),
            models.Index(fields=["organization", "-recorded_at"]),
        ]

    def __str__(self):
        return f"{self.device_id}:{self.metric_key}@{self.recorded_at.isoformat()}"

    @property
    def value(self):
        for field in ("value_numeric", "value_boolean", "value_text", "value_datetime"):
            v = getattr(self, field)
            if v is not None:
                return v
        return None


class TelemetryRollup(models.Model):
    """Pre-aggregated 5-minute buckets of numeric readings, built by
    apps.telemetry.tasks.rollup_recent_readings so dashboards/reports over
    long time ranges don't have to scan raw readings."""

    organization = models.ForeignKey(
        "accounts.Organization", on_delete=models.CASCADE, related_name="telemetry_rollups"
    )
    device = models.ForeignKey(
        "devices.Device", on_delete=models.CASCADE, related_name="rollups"
    )
    metric_key = models.CharField(max_length=64)
    bucket_start = models.DateTimeField()
    avg_value = models.FloatField(null=True, blank=True)
    min_value = models.FloatField(null=True, blank=True)
    max_value = models.FloatField(null=True, blank=True)
    sum_value = models.FloatField(null=True, blank=True)
    sample_count = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["-bucket_start"]
        constraints = [
            models.UniqueConstraint(
                fields=["device", "metric_key", "bucket_start"],
                name="unique_rollup_bucket",
            )
        ]
        indexes = [models.Index(fields=["organization", "-bucket_start"])]
