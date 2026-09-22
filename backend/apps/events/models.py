from django.db import models

from apps.common.models import OrgScopedModel


class Event(OrgScopedModel):
    """Audit/activity log entry: 'who did what to what'."""

    event_type = models.CharField(max_length=100)
    actor = models.ForeignKey(
        "accounts.User", null=True, blank=True, on_delete=models.SET_NULL, related_name="+"
    )
    target_type = models.CharField(max_length=100, blank=True)
    target_id = models.CharField(max_length=64, blank=True)
    description = models.CharField(max_length=500, blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["organization", "-created_at"])]

    def __str__(self):
        return f"{self.event_type} @ {self.created_at.isoformat()}"
