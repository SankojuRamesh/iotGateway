from rest_framework import mixins, viewsets

from apps.common.mixins import OrgScopedViewSetMixin
from apps.common.permissions import IsOrgMember
from apps.events.models import Event
from apps.events.serializers import EventSerializer


class EventViewSet(
    OrgScopedViewSetMixin, mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet
):
    queryset = Event.objects.select_related("actor").all()
    serializer_class = EventSerializer
    permission_classes = [IsOrgMember]
    filterset_fields = ["event_type", "target_type", "actor"]
    ordering_fields = ["created_at"]
