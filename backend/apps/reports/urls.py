from rest_framework.routers import DefaultRouter

from apps.reports.views import ReportScheduleViewSet, ReportViewSet

router = DefaultRouter()
router.register("reports", ReportViewSet, basename="report")
router.register("report-schedules", ReportScheduleViewSet, basename="report-schedule")

urlpatterns = router.urls
