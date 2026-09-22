from rest_framework import serializers

from apps.dashboards.models import Dashboard, Widget


class WidgetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Widget
        fields = [
            "id",
            "dashboard",
            "type",
            "title",
            "data_source",
            "grid_position",
            "options",
            "order",
        ]
        read_only_fields = ["id"]
        extra_kwargs = {"dashboard": {"required": False}}


class DashboardSerializer(serializers.ModelSerializer):
    widgets = WidgetSerializer(many=True, read_only=True)

    class Meta:
        model = Dashboard
        fields = [
            "id",
            "organization",
            "name",
            "description",
            "is_default",
            "created_by",
            "widgets",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_by", "created_at", "updated_at"]
        extra_kwargs = {"organization": {"required": False}}
