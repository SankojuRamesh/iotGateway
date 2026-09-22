from django.db import models

from apps.common.models import OrgScopedModel


class Report(OrgScopedModel):
    class Format(models.TextChoices):
        CSV = "csv", "CSV"
        PDF = "pdf", "PDF"
        JSON = "json", "JSON"

    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    # {"devices": [...], "metric_keys": [...], "aggregation": "average",
    #  "time_range_minutes": 1440, "group_by": "device"}
    config = models.JSONField(default=dict)
    format = models.CharField(max_length=10, choices=Format.choices, default=Format.CSV)
    created_by = models.ForeignKey(
        "accounts.User", null=True, blank=True, on_delete=models.SET_NULL, related_name="+"
    )

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class ReportSchedule(OrgScopedModel):
    report = models.ForeignKey(Report, on_delete=models.CASCADE, related_name="schedules")
    cron_expression = models.CharField(
        max_length=100, help_text="Standard 5-field cron, e.g. '0 8 * * MON'"
    )
    recipients = models.JSONField(default=list, help_text="List of email addresses")
    is_active = models.BooleanField(default=True)
    last_run_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.report.name} ({self.cron_expression})"

    def save(self, *args, **kwargs):
        self.organization_id = self.report.organization_id
        super().save(*args, **kwargs)
