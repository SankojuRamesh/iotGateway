from django.db import models

from apps.common.models import OrgScopedModel


class Site(OrgScopedModel):
    name = models.CharField(max_length=200)
    address = models.CharField(max_length=300, blank=True)
    timezone = models.CharField(max_length=64, default="UTC")
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(
                fields=["organization", "name"], name="unique_site_name_per_org"
            )
        ]

    def __str__(self):
        return self.name
