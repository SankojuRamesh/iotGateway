from django.db import models

from apps.common.models import OrgScopedModel


class Dashboard(OrgScopedModel):
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    is_default = models.BooleanField(default=False)
    created_by = models.ForeignKey(
        "accounts.User", null=True, blank=True, on_delete=models.SET_NULL, related_name="+"
    )

    class Meta:
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(
                fields=["organization", "name"], name="unique_dashboard_name_per_org"
            )
        ]

    def __str__(self):
        return self.name


class Widget(OrgScopedModel):
    class WidgetType(models.TextChoices):
        LINE_CHART = "line_chart", "Line Chart"
        AREA_CHART = "area_chart", "Area Chart"
        BAR_CHART = "bar_chart", "Bar Chart"
        GAUGE = "gauge", "Gauge"
        STAT = "stat", "Stat"
        TABLE = "table", "Table"

    dashboard = models.ForeignKey(Dashboard, on_delete=models.CASCADE, related_name="widgets")
    type = models.CharField(max_length=20, choices=WidgetType.choices)
    title = models.CharField(max_length=200)
    # {"device": "<uuid>", "metric_key": "current", "aggregation": "average", "time_range_minutes": 60}
    data_source = models.JSONField(default=dict)
    # {"x": 0, "y": 0, "w": 4, "h": 3}
    grid_position = models.JSONField(default=dict)
    options = models.JSONField(default=dict, blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["dashboard", "order"]

    def __str__(self):
        return f"{self.dashboard.name} / {self.title}"

    def save(self, *args, **kwargs):
        self.organization_id = self.dashboard.organization_id
        super().save(*args, **kwargs)
