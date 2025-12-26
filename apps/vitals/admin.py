from django.contrib import admin
from .models import VitalReading


@admin.register(VitalReading)
class VitalReadingAdmin(admin.ModelAdmin):
    list_display = ('user', 'vital_type', 'value', 'unit', 'recorded_at')
    list_filter = ('vital_type', 'recorded_at')
    search_fields = ('user__username', 'vital_type')