import uuid

from django.db import models


class TimeStampedModel(models.Model):
    """Abstract base adding created/updated timestamps."""

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class UUIDPKModel(models.Model):
    """Abstract base using a UUID primary key (safe to expose in URLs/API)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    class Meta:
        abstract = True


class OrgScopedQuerySet(models.QuerySet):
    def for_user(self, user):
        if user is None or not user.is_authenticated:
            return self.none()
        if user.is_superuser:
            return self
        org_ids = user.memberships.values_list("organization_id", flat=True)
        return self.filter(organization_id__in=org_ids)


class OrgScopedManager(models.Manager.from_queryset(OrgScopedQuerySet)):
    pass


class OrgScopedModel(TimeStampedModel, UUIDPKModel):
    """Abstract base for any model that belongs to exactly one Organization."""

    organization = models.ForeignKey(
        "accounts.Organization",
        on_delete=models.CASCADE,
        related_name="%(class)ss",
    )

    objects = OrgScopedManager()

    class Meta:
        abstract = True
