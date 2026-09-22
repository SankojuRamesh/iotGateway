from django.contrib import admin

from apps.events.models import Event


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ["event_type", "organization", "actor", "target_type", "created_at"]
    list_filter = ["organization", "event_type"]
    date_hierarchy = "created_at"
