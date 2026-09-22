from django.utils import timezone
from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.accounts.models import Membership
from apps.common.mixins import OrgScopedViewSetMixin
from apps.common.permissions import HasOrgRole
from apps.alerts.models import AlertEvent, AlertRule
from apps.alerts.serializers import AlertEventSerializer, AlertRuleSerializer


class AlertRuleViewSet(OrgScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = AlertRule.objects.select_related("device", "device_type").all()
    serializer_class = AlertRuleSerializer
    permission_classes = [HasOrgRole.with_min_role(Membership.Role.MANAGER)]
    filterset_fields = ["device", "device_type", "severity", "is_active"]
    search_fields = ["name", "metric_key"]


class AlertEventViewSet(
    OrgScopedViewSetMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    queryset = AlertEvent.objects.select_related("rule", "device").all()
    serializer_class = AlertEventSerializer
    permission_classes = [HasOrgRole.with_min_role(Membership.Role.OPERATOR)]
    filterset_fields = ["device", "rule", "resolved_at"]
    ordering_fields = ["triggered_at"]

    @action(detail=True, methods=["post"])
    def acknowledge(self, request, pk=None):
        event = self.get_object()
        event.acknowledged_by = request.user
        event.acknowledged_at = timezone.now()
        event.save(update_fields=["acknowledged_by", "acknowledged_at"])
        return Response(AlertEventSerializer(event).data)

    @action(detail=True, methods=["post"])
    def resolve(self, request, pk=None):
        event = self.get_object()
        event.resolved_at = timezone.now()
        event.save(update_fields=["resolved_at"])
        return Response(AlertEventSerializer(event).data)
