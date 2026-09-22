from rest_framework import serializers

from apps.events.models import Event


class EventSerializer(serializers.ModelSerializer):
    actor_email = serializers.EmailField(source="actor.email", read_only=True, default=None)

    class Meta:
        model = Event
        fields = [
            "id",
            "organization",
            "event_type",
            "actor",
            "actor_email",
            "target_type",
            "target_id",
            "description",
            "metadata",
            "created_at",
        ]
        read_only_fields = fields
