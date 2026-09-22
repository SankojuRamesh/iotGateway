from rest_framework import viewsets

from apps.accounts.models import Membership
from apps.common.mixins import OrgScopedViewSetMixin
from apps.common.permissions import HasOrgRole
from apps.reports.models import Report, ReportSchedule
from apps.reports.serializers import ReportScheduleSerializer, ReportSerializer


class ReportViewSet(OrgScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = Report.objects.prefetch_related("schedules").all()
    serializer_class = ReportSerializer
    permission_classes = [HasOrgRole.with_min_role(Membership.Role.OPERATOR)]
    filterset_fields = ["organization", "format"]
    search_fields = ["name", "description"]

    def perform_create(self, serializer):
        super().perform_create(serializer)
        serializer.instance.created_by = self.request.user
        serializer.instance.save(update_fields=["created_by"])


class ReportScheduleViewSet(OrgScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = ReportSchedule.objects.select_related("report").all()
    serializer_class = ReportScheduleSerializer
    permission_classes = [HasOrgRole.with_min_role(Membership.Role.MANAGER)]
    filterset_fields = ["report", "is_active"]

    def perform_create(self, serializer):
        report = serializer.validated_data["report"]
        serializer.save(organization=report.organization)
