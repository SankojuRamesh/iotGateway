from rest_framework import serializers

from apps.telemetry.models import TelemetryReading, TelemetryRollup


class TelemetryReadingSerializer(serializers.ModelSerializer):
    value = serializers.SerializerMethodField()

    class Meta:
        model = TelemetryReading
        fields = ["id", "device", "metric_key", "value", "recorded_at"]

    def get_value(self, obj):
        return obj.value


class TelemetryRollupSerializer(serializers.ModelSerializer):
    class Meta:
        model = TelemetryRollup
        fields = [
            "device",
            "metric_key",
            "bucket_start",
            "avg_value",
            "min_value",
            "max_value",
            "sum_value",
            "sample_count",
        ]


class TestIngestSerializer(serializers.Serializer):
    """Manual telemetry ingest for testing without an MQTT broker.
    Requires MANAGER+ role, scoped to devices in the caller's org."""

    device = serializers.UUIDField()
    payload = serializers.DictField()
