import pytest
from django.urls import reverse
from rest_framework import status

pytestmark = pytest.mark.django_db


def test_register_creates_org_admin(api_client):
    response = api_client.post(
        reverse("auth-register"),
        {
            "email": "founder@newco.test",
            "password": "Str0ngPassw0rd!",
            "organization_name": "NewCo",
        },
        format="json",
    )
    assert response.status_code == status.HTTP_201_CREATED
    assert response.data["user"]["email"] == "founder@newco.test"
    assert response.data["access"]
    membership = response.data["user"]["memberships"][0]
    assert membership["role"] == "ORG_ADMIN"


def test_login_returns_tokens(api_client, org_admin):
    response = api_client.post(
        reverse("auth-login"),
        {"email": org_admin.email, "password": "Str0ngPassw0rd!"},
        format="json",
    )
    assert response.status_code == status.HTTP_200_OK
    assert "access" in response.data and "refresh" in response.data


def test_login_rejects_wrong_password(api_client, org_admin):
    response = api_client.post(
        reverse("auth-login"),
        {"email": org_admin.email, "password": "wrong"},
        format="json",
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_user_cannot_see_other_orgs_devices(
    authed_client, pump_device, other_org_admin, api_client
):
    # org_admin (Acme) can see the Acme pump.
    url = reverse("device-list")
    response = authed_client.get(url)
    assert response.status_code == status.HTTP_200_OK
    assert response.data["count"] == 1

    # A user from a different organization sees none of Acme's devices.
    api_client.force_authenticate(user=other_org_admin)
    response = api_client.get(url)
    assert response.status_code == status.HTTP_200_OK
    assert response.data["count"] == 0


def test_user_cannot_fetch_other_orgs_device_by_id(
    authed_client, pump_device, other_org_admin, api_client
):
    api_client.force_authenticate(user=other_org_admin)
    response = api_client.get(reverse("device-detail", args=[pump_device.id]))
    assert response.status_code == status.HTTP_404_NOT_FOUND
