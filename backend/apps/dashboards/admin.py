from django.contrib import admin

from apps.dashboards.models import Dashboard, Widget


class WidgetInline(admin.TabularInline):
    model = Widget
    extra = 0


@admin.register(Dashboard)
class DashboardAdmin(admin.ModelAdmin):
    list_display = ["name", "organization", "is_default", "created_at"]
    list_filter = ["organization"]
    inlines = [WidgetInline]
