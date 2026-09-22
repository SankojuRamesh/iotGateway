import csv
import io

from django.http import HttpResponse
from rest_framework import parsers, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.accounts.models import Membership
from apps.common.mixins import OrgScopedViewSetMixin
from apps.common.permissions import HasOrgRole
from apps.devices.models import Device, DeviceType, MetricDefinition
from apps.devices.serializers import (
    DeviceImportRowSerializer,
    DeviceSerializer,
    DeviceTypeMetricsBulkSerializer,
    DeviceTypeSerializer,
    MetricDefinitionSerializer,
)

DEVICE_EXPORT_FIELDS = [
    "device_id",
    "name",
    "device_type",
    "site",
    "location",
    "mqtt_topic",
    "serial_number",
    "firmware_version",
    "status",
    "latitude",
    "longitude",
]


class DeviceTypeViewSet(OrgScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = DeviceType.objects.prefetch_related("metrics").all()
    serializer_class = DeviceTypeSerializer
    permission_classes = [HasOrgRole.with_min_role(Membership.Role.MANAGER)]
    filterset_fields = ["organization"]
    search_fields = ["name", "description"]
    ordering_fields = ["name", "created_at"]

    @action(detail=True, methods=["put"], url_path="metrics")
    def set_metrics(self, request, pk=None):
        device_type = self.get_object()
        # MetricDefinition's (device_type, key) UniqueConstraint makes DRF
        # treat `device_type` as required during validation regardless of
        # extra_kwargs, so it must be injected before is_valid() runs - the
        # client only sends the metric list, not the parent id per-row.
        payload = {
            "metrics": [
                {**row, "device_type": str(device_type.id)}
                for row in request.data.get("metrics", [])
            ]
        }
        serializer = DeviceTypeMetricsBulkSerializer(data=payload)
        serializer.is_valid(raise_exception=True)
        metrics = serializer.save(device_type=device_type)
        return Response(MetricDefinitionSerializer(metrics, many=True).data)


class MetricDefinitionViewSet(OrgScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = MetricDefinition.objects.select_related("device_type").all()
    serializer_class = MetricDefinitionSerializer
    permission_classes = [HasOrgRole.with_min_role(Membership.Role.MANAGER)]
    filterset_fields = ["device_type"]
    search_fields = ["key", "display_name"]

    def perform_create(self, serializer):
        device_type = serializer.validated_data["device_type"]
        serializer.save(organization=device_type.organization)


class DeviceViewSet(OrgScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = Device.objects.select_related("device_type", "site").all()
    serializer_class = DeviceSerializer
    permission_classes = [HasOrgRole.with_min_role(Membership.Role.OPERATOR)]
    filterset_fields = ["device_type", "site", "status"]
    search_fields = ["device_id", "name", "location", "serial_number"]
    ordering_fields = ["name", "device_id", "last_seen", "created_at"]

    @action(detail=False, methods=["get"], url_path="export")
    def export_csv(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        buffer = io.StringIO()
        writer = csv.writer(buffer)
        writer.writerow(DEVICE_EXPORT_FIELDS)
        for device in queryset:
            writer.writerow(
                [
                    device.device_id,
                    device.name,
                    device.device_type.name,
                    device.site.name if device.site else "",
                    device.location,
                    device.mqtt_topic,
                    device.serial_number,
                    device.firmware_version,
                    device.status,
                    device.latitude if device.latitude is not None else "",
                    device.longitude if device.longitude is not None else "",
                ]
            )
        response = HttpResponse(buffer.getvalue(), content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="devices.csv"'
        return response

    @action(
        detail=False,
        methods=["post"],
        url_path="import",
        parser_classes=[parsers.MultiPartParser],
    )
    def import_csv(self, request):
        file_obj = request.FILES.get("file")
        if not file_obj:
            return Response(
                {"detail": "A CSV file is required under the 'file' field."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        organization = getattr(request.user, "active_organization", None)
        if organization is None:
            return Response(
                {"detail": "No active organization selected."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        text = io.TextIOWrapper(file_obj.file, encoding="utf-8")
        reader = csv.DictReader(text)
        created, errors = [], []
        device_types = {
            dt.name: dt for dt in DeviceType.objects.filter(organization=organization)
        }

        from apps.sites.models import Site

        sites = {s.name: s for s in Site.objects.filter(organization=organization)}

        for i, row in enumerate(reader, start=2):
            row_serializer = DeviceImportRowSerializer(data=row)
            if not row_serializer.is_valid():
                errors.append({"row": i, "errors": row_serializer.errors})
                continue
            data = row_serializer.validated_data
            device_type = device_types.get(data["device_type"])
            if device_type is None:
                errors.append(
                    {"row": i, "errors": f"Unknown device type '{data['device_type']}'."}
                )
                continue
            device, _ = Device.objects.update_or_create(
                organization=organization,
                device_id=data["device_id"],
                defaults={
                    "name": data["name"],
                    "device_type": device_type,
                    "site": sites.get(data.get("site")),
                    "location": data.get("location", ""),
                    "mqtt_topic": data["mqtt_topic"],
                    "serial_number": data.get("serial_number", ""),
                    "firmware_version": data.get("firmware_version", ""),
                    "latitude": data.get("latitude"),
                    "longitude": data.get("longitude"),
                },
            )
            created.append(device.device_id)

        return Response(
            {"created": created, "errors": errors},
            status=status.HTTP_201_CREATED if not errors else status.HTTP_207_MULTI_STATUS,
        )
