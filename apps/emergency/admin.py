from django.contrib import admin
from .models import EmergencyContact, EmergencyAlert


@admin.register(EmergencyContact)
class EmergencyContactAdmin(admin.ModelAdmin):
    list_display = ('name', 'phone_number', 'relationship', 'user', 'is_primary')
    list_filter = ('is_primary', 'relationship')
    search_fields = ('name', 'user__username')


@admin.register(EmergencyAlert)
class EmergencyAlertAdmin(admin.ModelAdmin):
    list_display = ('user', 'alert_type', 'status', 'created_at')
    list_filter = ('status', 'alert_type', 'created_at')
    search_fields = ('user__username',)
    readonly_fields = ('is_resolved', 'duration_minutes', 'location_url')
    
    def get_readonly_fields(self, request, obj=None):
        if obj:  # editing an existing object
            return self.readonly_fields + ('user', 'created_at')
        return self.readonly_fields