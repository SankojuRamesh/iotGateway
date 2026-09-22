import pytest
from django.urls import reverse
from rest_framework import status

from apps.telemetry.models import TelemetryReading
from apps.telemetry.services import ingest_payload, ingest_reading

pytestmark = pytest.mark.django_db


def test_ingest_reading_accepts_valid_metric(pump_device):
    reading = ingest_reading(pump_device, "current", 4.2)
    assert reading is not None
    assert reading.value_numeric == 4.2
    pump_device.refresh_from_db()
    assert pump_device.status == "ONLINE"
    assert pump_device.last_seen is not None


def test_ingest_reading_rejects_unknown_metric(pump_device):
    reading = ingest_reading(pump_device, "not_a_real_metric", 1)
    assert reading is None
    assert TelemetryReading.objects.count() == 0


def test_ingest_reading_rejects_out_of_bounds(pump_device):
    # 'current' metric has max_value=100
    reading = ingest_reading(pump_device, "current", 999)
    assert reading is None


def test_ingest_reading_coerces_boolean(pump_device):
    reading = ingest_reading(pump_device, "status", "true")
    assert reading is not None
    assert reading.value_boolean is True


def test_ingest_payload_partial_accept(pump_device):
    accepted, rejected = ingest_payload(
        pump_device, {"current": 3.1, "status": True, "bogus": "x"}
    )
    assert len(accepted) == 2
    assert rejected == ["bogus"]


def test_test_ingest_endpoint_requires_manager_role(api_client, viewer_user, pump_device):
    api_client.force_authenticate(user=viewer_user)
    response = api_client.post(
        reverse("telemetry-test-ingest"),
        {"device": str(pump_device.id), "payload": {"current": 1.0}},
        format="json",
    )
    assert response.status_code == status.HTTP_403_FORBIDDEN


def test_test_ingest_endpoint_creates_readings(authed_client, pump_device):
    response = authed_client.post(
        reverse("telemetry-test-ingest"),
        {"device": str(pump_device.id), "payload": {"current": 2.5}},
        format="json",
    )
    assert response.status_code == status.HTTP_201_CREATED, response.data
    assert len(response.data["accepted"]) == 1
    assert TelemetryReading.objects.filter(device=pump_device, metric_key="current").exists()


def test_telemetry_history_endpoint(authed_client, pump_device):
    ingest_reading(pump_device, "current", 1.0)
    ingest_reading(pump_device, "current", 2.0)
    response = authed_client.get(
        reverse("telemetry-history"),
        {"device": str(pump_device.id), "metric_key": "current"},
    )
    assert response.status_code == status.HTTP_200_OK
    assert response.data["count"] == 2
