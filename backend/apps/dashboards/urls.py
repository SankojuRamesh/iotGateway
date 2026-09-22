from rest_framework.routers import DefaultRouter

from apps.dashboards.views import DashboardViewSet, WidgetViewSet

router = DefaultRouter()
router.register("dashboards", DashboardViewSet, basename="dashboard")
router.register("widgets", WidgetViewSet, basename="widget")

urlpatterns = router.urls
