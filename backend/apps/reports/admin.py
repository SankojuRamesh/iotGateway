from django.contrib import admin

from apps.reports.models import Report, ReportSchedule


class ReportScheduleInline(admin.TabularInline):
    model = ReportSchedule
    extra = 0


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ["name", "organization", "format", "created_at"]
    list_filter = ["organization", "format"]
    inlines = [ReportScheduleInline]
