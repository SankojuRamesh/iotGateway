from rest_framework.routers import DefaultRouter

from apps.devices.views import DeviceTypeViewSet, DeviceViewSet, MetricDefinitionViewSet

router = DefaultRouter()
router.register("device-types", DeviceTypeViewSet, basename="device-type")
router.register("metric-definitions", MetricDefinitionViewSet, basename="metric-definition")
router.register("devices", DeviceViewSet, basename="device")

urlpatterns = router.urls
