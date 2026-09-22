from rest_framework import viewsets

from apps.accounts.models import Membership
from apps.common.mixins import OrgScopedViewSetMixin
from apps.common.permissions import HasOrgRole
from apps.sites.models import Site
from apps.sites.serializers import SiteSerializer


class SiteViewSet(OrgScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = Site.objects.all()
    serializer_class = SiteSerializer
    permission_classes = [HasOrgRole.with_min_role(Membership.Role.MANAGER)]
    filterset_fields = ["organization"]
    search_fields = ["name", "address"]
    ordering_fields = ["name", "created_at"]
