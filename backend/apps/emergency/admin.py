from django.contrib import admin
from .models import EmergencyContact, EmergencyAlert


@admin.register(EmergencyContact)
class EmergencyContactAdmin(admin.ModelAdmin):
    list_display = ('name', 'phone_number', 'relationship', 'user', 'is_primary')
    list_filter = ('is_primary', 'relationship')
    search_fields = ('name', 'user__username')


@admin.register(EmergencyAlert)
class EmergencyAlertAdmin(admin.ModelAdmin):
    list_display = ('user', 'is_resolved', 'created_at')
    list_filter = ('is_resolved', 'created_at')
    search_fields = ('user__username',)