from rest_framework.exceptions import PermissionDenied


class OrgScopedViewSetMixin:
    """
    Mixin for DRF ViewSets on models with an `organization` FK.
    Filters the queryset to organizations the requesting user belongs to,
    and validates that writes target an organization the user is a member of.

    On create, if the client didn't supply `organization`, it's defaulted to
    the user's active_organization *before* the serializer validates - not
    just at save time. This matters because any model with a UniqueConstraint
    that includes `organization` (e.g. Device.device_id, DeviceType.name)
    makes DRF auto-generate a UniqueTogetherValidator that treats those
    fields as required during is_valid(), overriding a serializer's
    `extra_kwargs = {"organization": {"required": False}}`.
    """

    def get_queryset(self):
        queryset = super().get_queryset()
        return queryset.for_user(self.request.user)

    def get_serializer(self, *args, **kwargs):
        if self.action == "create" and "data" in kwargs:
            kwargs["data"] = self._with_default_organization(kwargs["data"])
        return super().get_serializer(*args, **kwargs)

    def _with_default_organization(self, data):
        if not isinstance(data, dict) or data.get("organization"):
            return data
        organization = getattr(self.request.user, "active_organization", None)
        if organization is None:
            return data
        data = dict(data)
        data["organization"] = organization.id
        return data

    def perform_create(self, serializer):
        organization = serializer.validated_data.get("organization")
        user = self.request.user
        if organization is None:
            raise PermissionDenied("No organization specified.")
        if not user.is_superuser and not user.memberships.filter(
            organization_id=organization.id
        ).exists():
            raise PermissionDenied("You are not a member of this organization.")
        serializer.save()
