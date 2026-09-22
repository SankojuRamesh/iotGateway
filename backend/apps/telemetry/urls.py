from django.urls import path

from apps.telemetry.views import TelemetryHistoryView, TestIngestView

urlpatterns = [
    path("telemetry/history/", TelemetryHistoryView.as_view(), name="telemetry-history"),
    path("telemetry/test-ingest/", TestIngestView.as_view(), name="telemetry-test-ingest"),
]
