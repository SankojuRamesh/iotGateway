from django.core.validators import RegexValidator, MinLengthValidator
from django.db import models

from apps.common.models import OrgScopedModel

metric_key_validator = RegexValidator(
    regex=r"^[a-z][a-z0-9_]*$",
    message="Metric key must be lowercase snake_case, e.g. 'flow_rate'.",
)


class DeviceType(OrgScopedModel):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, blank=True, default="cpu")

    class Meta:
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(
                fields=["organization", "name"], name="unique_device_type_name_per_org"
            )
        ]

    def __str__(self):
        return self.name


class MetricDefinition(OrgScopedModel):
    class DataType(models.TextChoices):
        INTEGER = "integer", "Integer"
        FLOAT = "float", "Float"
        BOOLEAN = "boolean", "Boolean"
        STRING = "string", "String"
        DATETIME = "datetime", "Datetime"

    class Aggregation(models.TextChoices):
        RAW = "raw", "Raw"
        MIN = "min", "Minimum"
        MAX = "max", "Maximum"
        AVERAGE = "average", "Average"
        SUM = "sum", "Sum"
        COUNT = "count", "Count"
        LAST = "last", "Last"
        FIRST = "first", "First"

    device_type = models.ForeignKey(
        DeviceType, on_delete=models.CASCADE, related_name="metrics"
    )
    key = models.CharField(
        max_length=64, validators=[metric_key_validator, MinLengthValidator(1)]
    )
    display_name = models.CharField(max_length=150)
    data_type = models.CharField(
        max_length=20, choices=DataType.choices, default=DataType.FLOAT
    )
    unit = models.CharField(max_length=32, blank=True)
    min_value = models.FloatField(null=True, blank=True)
    max_value = models.FloatField(null=True, blank=True)
    decimal_precision = models.PositiveSmallIntegerField(default=2)
    description = models.TextField(blank=True)
    aggregation = models.CharField(
        max_length=20, choices=Aggregation.choices, default=Aggregation.LAST
    )
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["device_type", "order", "key"]
        constraints = [
            models.UniqueConstraint(
                fields=["device_type", "key"], name="unique_metric_key_per_device_type"
            )
        ]

    def __str__(self):
        return f"{self.device_type.name}.{self.key}"

    def save(self, *args, **kwargs):
        self.organization_id = self.device_type.organization_id
        super().save(*args, **kwargs)


class Device(OrgScopedModel):
    class Status(models.TextChoices):
        ONLINE = "ONLINE", "Online"
        OFFLINE = "OFFLINE", "Offline"
        UNKNOWN = "UNKNOWN", "Unknown"

    device_id = models.CharField(max_length=100)
    name = models.CharField(max_length=200)
    device_type = models.ForeignKey(
        DeviceType, on_delete=models.PROTECT, related_name="devices"
    )
    site = models.ForeignKey(
        "sites_app.Site",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="devices",
    )
    location = models.CharField(max_length=200, blank=True)
    mqtt_topic = models.CharField(max_length=255, unique=True)
    serial_number = models.CharField(max_length=100, blank=True)
    firmware_version = models.CharField(max_length=50, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.UNKNOWN)
    last_seen = models.DateTimeField(null=True, blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(
                fields=["organization", "device_id"], name="unique_device_id_per_org"
            )
        ]
        indexes = [
            models.Index(fields=["mqtt_topic"]),
            models.Index(fields=["organization", "status"]),
        ]

    def __str__(self):
        return f"{self.device_id} ({self.name})"
