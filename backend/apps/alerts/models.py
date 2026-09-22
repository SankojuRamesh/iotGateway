from django.db import models

from apps.common.models import OrgScopedModel


class AlertRule(OrgScopedModel):
    class Condition(models.TextChoices):
        GT = "gt", ">"
        GTE = "gte", ">="
        LT = "lt", "<"
        LTE = "lte", "<="
        EQ = "eq", "=="
        NEQ = "neq", "!="

    class Severity(models.TextChoices):
        INFO = "info", "Info"
        WARNING = "warning", "Warning"
        CRITICAL = "critical", "Critical"

    name = models.CharField(max_length=200)
    device = models.ForeignKey(
        "devices.Device",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="alert_rules",
        help_text="Leave blank to apply to all devices of device_type.",
    )
    device_type = models.ForeignKey(
        "devices.DeviceType",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="alert_rules",
    )
    metric_key = models.CharField(max_length=64)
    condition = models.CharField(max_length=10, choices=Condition.choices)
    threshold = models.FloatField()
    severity = models.CharField(max_length=10, choices=Severity.choices, default=Severity.WARNING)
    is_active = models.BooleanField(default=True)
    cooldown_seconds = models.PositiveIntegerField(
        default=300, help_text="Minimum time between repeat triggers for the same device."
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.name


class AlertEvent(OrgScopedModel):
    rule = models.ForeignKey(AlertRule, on_delete=models.CASCADE, related_name="events")
    device = models.ForeignKey(
        "devices.Device", on_delete=models.CASCADE, related_name="alert_events"
    )
    value = models.FloatField()
    triggered_at = models.DateTimeField()
    resolved_at = models.DateTimeField(null=True, blank=True)
    acknowledged_by = models.ForeignKey(
        "accounts.User", null=True, blank=True, on_delete=models.SET_NULL, related_name="+"
    )
    acknowledged_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-triggered_at"]
        indexes = [models.Index(fields=["organization", "-triggered_at"])]

    def __str__(self):
        return f"{self.rule.name} @ {self.device.device_id} = {self.value}"

    def save(self, *args, **kwargs):
        self.organization_id = self.rule.organization_id
        super().save(*args, **kwargs)
