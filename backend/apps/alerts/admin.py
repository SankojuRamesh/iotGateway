from django.contrib import admin

from apps.alerts.models import AlertEvent, AlertRule


@admin.register(AlertRule)
class AlertRuleAdmin(admin.ModelAdmin):
    list_display = ["name", "organization", "metric_key", "condition", "threshold", "is_active"]
    list_filter = ["organization", "severity", "is_active"]


@admin.register(AlertEvent)
class AlertEventAdmin(admin.ModelAdmin):
    list_display = ["rule", "device", "value", "triggered_at", "resolved_at"]
    list_filter = ["organization"]
    date_hierarchy = "triggered_at"
