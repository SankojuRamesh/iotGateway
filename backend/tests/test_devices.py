import pytest
from django.urls import reverse
from rest_framework import status

from apps.devices.models import Device

pytestmark = pytest.mark.django_db


def test_create_device(authed_client, organization, pump_device_type):
    response = authed_client.post(
        reverse("device-list"),
        {
            "device_id": "PUMP002",
            "name": "Secondary Pump",
            "device_type": str(pump_device_type.id),
            "mqtt_topic": "factory/pump/PUMP002",
        },
        format="json",
    )
    assert response.status_code == status.HTTP_201_CREATED, response.data
    assert Device.objects.filter(device_id="PUMP002", organization=organization).exists()


def test_viewer_cannot_create_device(api_client, viewer_user, pump_device_type):
    api_client.force_authenticate(user=viewer_user)
    response = api_client.post(
        reverse("device-list"),
        {
            "device_id": "PUMP003",
            "name": "Blocked Pump",
            "device_type": str(pump_device_type.id),
            "mqtt_topic": "factory/pump/PUMP003",
        },
        format="json",
    )
    assert response.status_code == status.HTTP_403_FORBIDDEN


def test_operator_can_create_device(api_client, operator_user, pump_device_type):
    api_client.force_authenticate(user=operator_user)
    response = api_client.post(
        reverse("device-list"),
        {
            "device_id": "PUMP004",
            "name": "Operator Pump",
            "device_type": str(pump_device_type.id),
            "mqtt_topic": "factory/pump/PUMP004",
        },
        format="json",
    )
    assert response.status_code == status.HTTP_201_CREATED, response.data


def test_device_type_metrics_bulk_update(authed_client, pump_device_type):
    url = reverse("device-type-set-metrics", args=[pump_device_type.id])
    response = authed_client.put(
        url,
        {
            "metrics": [
                {
                    "key": "flow",
                    "display_name": "Flow Rate",
                    "data_type": "float",
                    "unit": "L/min",
                    "aggregation": "average",
                },
            ]
        },
        format="json",
    )
    assert response.status_code == status.HTTP_200_OK, response.data
    keys = {m["key"] for m in response.data}
    assert keys == {"flow"}
    assert pump_device_type.metrics.count() == 1
