from rest_framework import serializers

from apps.reports.models import Report, ReportSchedule


class ReportScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReportSchedule
        fields = [
            "id",
            "report",
            "cron_expression",
            "recipients",
            "is_active",
            "last_run_at",
        ]
        read_only_fields = ["id", "last_run_at"]
        extra_kwargs = {"report": {"required": False}}


class ReportSerializer(serializers.ModelSerializer):
    schedules = ReportScheduleSerializer(many=True, read_only=True)

    class Meta:
        model = Report
        fields = [
            "id",
            "organization",
            "name",
            "description",
            "config",
            "format",
            "created_by",
            "schedules",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_by", "created_at", "updated_at"]
        extra_kwargs = {"organization": {"required": False}}
