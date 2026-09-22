import pytest
from rest_framework.test import APIClient

from apps.accounts.models import Membership, Organization, User
from apps.devices.models import Device, DeviceType, MetricDefinition


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def organization(db):
    return Organization.objects.create(name="Acme Corp", slug="acme-corp")


@pytest.fixture
def other_organization(db):
    return Organization.objects.create(name="Other Inc", slug="other-inc")


def _make_user(organization, role, email):
    user = User.objects.create_user(
        email=email, password="Str0ngPassw0rd!", active_organization=organization
    )
    Membership.objects.create(user=user, organization=organization, role=role)
    return user


@pytest.fixture
def org_admin(organization):
    return _make_user(organization, Membership.Role.ORG_ADMIN, "admin@acme.test")


@pytest.fixture
def operator_user(organization):
    return _make_user(organization, Membership.Role.OPERATOR, "operator@acme.test")


@pytest.fixture
def viewer_user(organization):
    return _make_user(organization, Membership.Role.VIEWER, "viewer@acme.test")


@pytest.fixture
def other_org_admin(other_organization):
    return _make_user(other_organization, Membership.Role.ORG_ADMIN, "admin@other.test")


@pytest.fixture
def authed_client(api_client, org_admin):
    api_client.force_authenticate(user=org_admin)
    return api_client


@pytest.fixture
def pump_device_type(organization):
    device_type = DeviceType.objects.create(organization=organization, name="Pump")
    MetricDefinition.objects.create(
        organization=organization,
        device_type=device_type,
        key="current",
        display_name="Current",
        data_type=MetricDefinition.DataType.FLOAT,
        unit="A",
        min_value=0,
        max_value=100,
        aggregation=MetricDefinition.Aggregation.AVERAGE,
    )
    MetricDefinition.objects.create(
        organization=organization,
        device_type=device_type,
        key="status",
        display_name="Status",
        data_type=MetricDefinition.DataType.BOOLEAN,
        aggregation=MetricDefinition.Aggregation.LAST,
    )
    return device_type


@pytest.fixture
def pump_device(organization, pump_device_type):
    return Device.objects.create(
        organization=organization,
        device_id="PUMP001",
        name="Main Pump",
        device_type=pump_device_type,
        mqtt_topic="factory/pump/PUMP001",
    )
