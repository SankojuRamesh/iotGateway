from rest_framework.permissions import BasePermission, SAFE_METHODS


def _user_role_for_org(user, organization_id):
    if not user or not user.is_authenticated:
        return None
    if user.is_superuser:
        return "SUPER_ADMIN"
    membership = user.memberships.filter(organization_id=organization_id).first()
    return membership.role if membership else None


class IsOrgMember(BasePermission):
    """Grants access only if the requesting user belongs to the object's organization."""

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        organization_id = getattr(obj, "organization_id", None)
        if organization_id is None:
            return False
        return _user_role_for_org(request.user, organization_id) is not None


class HasOrgRole(BasePermission):
    """
    Restricts write access to users whose Membership.role is at least `min_role`
    (see apps.accounts.models.Membership.ROLE_RANK for ordering) for the
    organization the object/request belongs to. Read (SAFE_METHODS) only
    requires org membership.

    Usage: `permission_classes = [HasOrgRole.with_min_role("MANAGER")]`
    """

    min_role = "VIEWER"

    @classmethod
    def with_min_role(cls, min_role):
        return type(f"HasOrgRole_{min_role}", (cls,), {"min_role": min_role})

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.method in SAFE_METHODS:
            return True
        organization_id = (
            request.data.get("organization")
            if hasattr(request, "data")
            else None
        ) or getattr(request.user, "active_organization_id", None)
        if organization_id is None:
            return True
        return self._role_meets_minimum(request.user, organization_id)

    def has_object_permission(self, request, view, obj):
        organization_id = getattr(obj, "organization_id", None)
        if organization_id is None:
            return False
        if request.method in SAFE_METHODS:
            return _user_role_for_org(request.user, organization_id) is not None
        return self._role_meets_minimum(request.user, organization_id)

    def _role_meets_minimum(self, user, organization_id):
        from apps.accounts.models import Membership

        role = _user_role_for_org(user, organization_id)
        if role is None:
            return False
        return Membership.ROLE_RANK.get(role, -1) >= Membership.ROLE_RANK.get(
            self.min_role, 0
        )
