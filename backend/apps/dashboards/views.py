from rest_framework import viewsets

from apps.accounts.models import Membership
from apps.common.mixins import OrgScopedViewSetMixin
from apps.common.permissions import HasOrgRole
from apps.dashboards.models import Dashboard, Widget
from apps.dashboards.serializers import DashboardSerializer, WidgetSerializer


class DashboardViewSet(OrgScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = Dashboard.objects.prefetch_related("widgets").all()
    serializer_class = DashboardSerializer
    permission_classes = [HasOrgRole.with_min_role(Membership.Role.OPERATOR)]
    filterset_fields = ["organization", "is_default"]
    search_fields = ["name", "description"]

    def perform_create(self, serializer):
        super().perform_create(serializer)
        serializer.instance.created_by = self.request.user
        serializer.instance.save(update_fields=["created_by"])


class WidgetViewSet(OrgScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = Widget.objects.select_related("dashboard").all()
    serializer_class = WidgetSerializer
    permission_classes = [HasOrgRole.with_min_role(Membership.Role.OPERATOR)]
    filterset_fields = ["dashboard", "type"]

    def perform_create(self, serializer):
        dashboard = serializer.validated_data["dashboard"]
        serializer.save(organization=dashboard.organization)
