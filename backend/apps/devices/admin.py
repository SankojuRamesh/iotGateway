from django.contrib import admin

from apps.devices.models import Device, DeviceType, MetricDefinition


class MetricDefinitionInline(admin.TabularInline):
    model = MetricDefinition
    extra = 0


@admin.register(DeviceType)
class DeviceTypeAdmin(admin.ModelAdmin):
    list_display = ["name", "organization", "created_at"]
    list_filter = ["organization"]
    search_fields = ["name"]
    inlines = [MetricDefinitionInline]


@admin.register(Device)
class DeviceAdmin(admin.ModelAdmin):
    list_display = ["device_id", "name", "device_type", "status", "last_seen"]
    list_filter = ["organization", "status", "device_type"]
    search_fields = ["device_id", "name", "mqtt_topic"]
