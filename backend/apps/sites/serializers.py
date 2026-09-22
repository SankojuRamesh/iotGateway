from rest_framework import serializers

from apps.sites.models import Site


class SiteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Site
        fields = [
            "id",
            "organization",
            "name",
            "address",
            "timezone",
            "latitude",
            "longitude",
            "metadata",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
        extra_kwargs = {"organization": {"required": False}}
