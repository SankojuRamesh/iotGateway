from django.contrib import admin

from apps.sites.models import Site


@admin.register(Site)
class SiteAdmin(admin.ModelAdmin):
    list_display = ["name", "organization", "timezone", "created_at"]
    list_filter = ["organization"]
    search_fields = ["name", "address"]
