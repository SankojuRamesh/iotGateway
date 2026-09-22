from django.contrib import admin

from apps.telemetry.models import TelemetryReading, TelemetryRollup


@admin.register(TelemetryReading)
class TelemetryReadingAdmin(admin.ModelAdmin):
    list_display = ["device", "metric_key", "value", "recorded_at"]
    list_filter = ["metric_key"]
    search_fields = ["device__device_id"]
    date_hierarchy = "recorded_at"


@admin.register(TelemetryRollup)
class TelemetryRollupAdmin(admin.ModelAdmin):
    list_display = ["device", "metric_key", "bucket_start", "avg_value", "sample_count"]
    list_filter = ["metric_key"]
