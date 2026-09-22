from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("apps.accounts.urls")),
    path("api/", include("apps.sites.urls")),
    path("api/", include("apps.devices.urls")),
    path("api/", include("apps.telemetry.urls")),
    path("api/", include("apps.dashboards.urls")),
    path("api/", include("apps.reports.urls")),
    path("api/", include("apps.alerts.urls")),
    path("api/", include("apps.events.urls")),
]
