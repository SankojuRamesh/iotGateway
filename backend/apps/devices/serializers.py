from rest_framework import serializers

from apps.devices.models import Device, DeviceType, MetricDefinition


class MetricDefinitionSerializer(serializers.ModelSerializer):
    class Meta:
        model = MetricDefinition
        fields = [
            "id",
            "device_type",
            "key",
            "display_name",
            "data_type",
            "unit",
            "min_value",
            "max_value",
            "decimal_precision",
            "description",
            "aggregation",
            "order",
        ]
        read_only_fields = ["id"]
        extra_kwargs = {"device_type": {"required": False}}


class DeviceTypeSerializer(serializers.ModelSerializer):
    metrics = MetricDefinitionSerializer(many=True, read_only=True)

    class Meta:
        model = DeviceType
        fields = [
            "id",
            "organization",
            "name",
            "description",
            "icon",
            "metrics",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
        extra_kwargs = {"organization": {"required": False}}


class DeviceTypeMetricsBulkSerializer(serializers.Serializer):
    """Replace all MetricDefinitions for a DeviceType in one call, keeping the
    UI's metric editor simple (submit the whole metric list at once)."""

    metrics = MetricDefinitionSerializer(many=True)

    def save(self, device_type):
        incoming = self.validated_data["metrics"]
        keys_seen = set()
        result = []
        for metric_data in incoming:
            metric_data.pop("device_type", None)
            key = metric_data["key"]
            if key in keys_seen:
                raise serializers.ValidationError(f"Duplicate metric key '{key}'.")
            keys_seen.add(key)
            metric, _ = MetricDefinition.objects.update_or_create(
                device_type=device_type,
                key=key,
                defaults={**metric_data, "organization_id": device_type.organization_id},
            )
            result.append(metric)
        device_type.metrics.exclude(key__in=keys_seen).delete()
        return result


class DeviceSerializer(serializers.ModelSerializer):
    device_type_detail = DeviceTypeSerializer(source="device_type", read_only=True)
    site_name = serializers.CharField(source="site.name", read_only=True, default=None)

    class Meta:
        model = Device
        fields = [
            "id",
            "organization",
            "device_id",
            "name",
            "device_type",
            "device_type_detail",
            "site",
            "site_name",
            "location",
            "mqtt_topic",
            "serial_number",
            "firmware_version",
            "status",
            "last_seen",
            "latitude",
            "longitude",
            "metadata",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "status", "last_seen", "created_at", "updated_at"]
        extra_kwargs = {"organization": {"required": False}}

    def validate(self, attrs):
        device_type = attrs.get("device_type") or getattr(self.instance, "device_type", None)
        organization = attrs.get("organization") or getattr(
            self.instance, "organization", None
        )
        if device_type and organization and device_type.organization_id != organization.id:
            raise serializers.ValidationError(
                "Device type must belong to the same organization as the device."
            )
        return attrs


class DeviceImportRowSerializer(serializers.Serializer):
    device_id = serializers.CharField()
    name = serializers.CharField()
    device_type = serializers.CharField(help_text="DeviceType name")
    site = serializers.CharField(required=False, allow_blank=True)
    location = serializers.CharField(required=False, allow_blank=True)
    mqtt_topic = serializers.CharField()
    serial_number = serializers.CharField(required=False, allow_blank=True)
    firmware_version = serializers.CharField(required=False, allow_blank=True)
    latitude = serializers.FloatField(required=False, allow_null=True)
    longitude = serializers.FloatField(required=False, allow_null=True)
