from rest_framework import serializers

from apps.alerts.models import AlertEvent, AlertRule


class AlertRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = AlertRule
        fields = [
            "id",
            "organization",
            "name",
            "device",
            "device_type",
            "metric_key",
            "condition",
            "threshold",
            "severity",
            "is_active",
            "cooldown_seconds",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]
        extra_kwargs = {"organization": {"required": False}}

    def validate(self, attrs):
        device = attrs.get("device")
        device_type = attrs.get("device_type")
        if not device and not device_type:
            raise serializers.ValidationError(
                "Either device or device_type must be set."
            )
        return attrs


class AlertEventSerializer(serializers.ModelSerializer):
    rule_name = serializers.CharField(source="rule.name", read_only=True)
    device_name = serializers.CharField(source="device.name", read_only=True)
    severity = serializers.CharField(source="rule.severity", read_only=True)

    class Meta:
        model = AlertEvent
        fields = [
            "id",
            "organization",
            "rule",
            "rule_name",
            "device",
            "device_name",
            "severity",
            "value",
            "triggered_at",
            "resolved_at",
            "acknowledged_by",
            "acknowledged_at",
        ]
        read_only_fields = fields
