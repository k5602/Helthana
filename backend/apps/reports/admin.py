from django.contrib import admin
from .models import HealthReport


@admin.register(HealthReport)
class HealthReportAdmin(admin.ModelAdmin):
    list_display = ('user', 'title', 'report_type', 'date_from', 'date_to', 'created_at')
    list_filter = ('report_type', 'created_at')
    search_fields = ('user__username', 'title')