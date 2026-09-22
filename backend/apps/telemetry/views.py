from django.db.models import Avg, Count, Max, Min, Sum
from django.db.models.functions import (
    TruncDay,
    TruncHour,
    TruncMinute,
)
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import Membership
from apps.common.pagination import StandardResultsPagination
from apps.common.permissions import HasOrgRole
from apps.devices.models import Device
from apps.telemetry.models import TelemetryReading
from apps.telemetry.serializers import TelemetryReadingSerializer, TestIngestSerializer
from apps.telemetry.services import ingest_payload

TRUNC_FUNCS = {
    "minute": TruncMinute,
    "hour": TruncHour,
    "day": TruncDay,
}
AGG_FUNCS = {
    "average": Avg("value_numeric"),
    "sum": Sum("value_numeric"),
    "min": Min("value_numeric"),
    "max": Max("value_numeric"),
    "count": Count("id"),
}


def _user_devices_queryset(user):
    if user.is_superuser:
        return Device.objects.all()
    org_ids = user.memberships.values_list("organization_id", flat=True)
    return Device.objects.filter(organization_id__in=org_ids)


class TelemetryHistoryView(APIView):
    """
    GET /api/telemetry/history/?device=<uuid>&metric_key=<key>&start=&end=
        &aggregation=raw|average|sum|min|max|count&interval=minute|hour|day
    Raw mode returns paginated readings; aggregated mode returns time buckets.
    """

    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsPagination

    def get(self, request):
        device_id = request.query_params.get("device")
        metric_key = request.query_params.get("metric_key")
        if not device_id or not metric_key:
            return Response(
                {"detail": "device and metric_key are required query params."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        device = get_object_or_404(_user_devices_queryset(request.user), pk=device_id)

        queryset = TelemetryReading.objects.filter(device=device, metric_key=metric_key)
        start = request.query_params.get("start")
        end = request.query_params.get("end")
        if start:
            queryset = queryset.filter(recorded_at__gte=start)
        if end:
            queryset = queryset.filter(recorded_at__lte=end)

        aggregation = request.query_params.get("aggregation", "raw")
        if aggregation == "raw":
            paginator = self.pagination_class()
            page = paginator.paginate_queryset(queryset, request, view=self)
            serializer = TelemetryReadingSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        interval = request.query_params.get("interval", "hour")
        trunc = TRUNC_FUNCS.get(interval)
        agg = AGG_FUNCS.get(aggregation)
        if trunc is None or agg is None:
            return Response(
                {"detail": "Invalid aggregation or interval."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        buckets = (
            queryset.annotate(bucket=trunc("recorded_at"))
            .values("bucket")
            .annotate(value=agg)
            .order_by("bucket")
        )
        return Response(list(buckets))


class TestIngestView(APIView):
    """Manual ingest endpoint for testing the pipeline without a live MQTT
    broker: POST {"device": "<uuid>", "payload": {"metric_key": value, ...}}."""

    permission_classes = [HasOrgRole.with_min_role(Membership.Role.MANAGER)]

    def post(self, request):
        serializer = TestIngestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        device = get_object_or_404(
            _user_devices_queryset(request.user), pk=serializer.validated_data["device"]
        )
        if not request.user.is_superuser and not request.user.memberships.filter(
            organization_id=device.organization_id
        ).exists():
            raise PermissionDenied("You are not a member of this device's organization.")

        accepted, rejected = ingest_payload(device, serializer.validated_data["payload"])
        return Response(
            {
                "accepted": TelemetryReadingSerializer(accepted, many=True).data,
                "rejected_keys": rejected,
            },
            status=status.HTTP_201_CREATED,
        )
