from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, SecurityAuditLog


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'email_verified', 'is_active', 'created_at')
    list_filter = ('is_active', 'is_staff', 'email_verified', 'created_at')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    readonly_fields = ('created_at', 'updated_at', 'last_login_ip', 'failed_login_attempts')
    
    fieldsets = UserAdmin.fieldsets + (
        ('Health Profile', {
            'fields': ('phone_number', 'date_of_birth', 'emergency_contact_name', 
                      'emergency_contact_phone', 'medical_conditions')
        }),
        ('Security Information', {
            'fields': ('email_verified', 'email_verification_token', 'password_reset_token',
                      'password_reset_expires', 'failed_login_attempts', 'account_locked_until',
                      'last_login_ip')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )


@admin.register(SecurityAuditLog)
class SecurityAuditLogAdmin(admin.ModelAdmin):
    list_display = ('user', 'action', 'success', 'ip_address', 'timestamp')
    list_filter = ('action', 'success', 'timestamp')
    search_fields = ('user__username', 'user__email', 'ip_address', 'action')
    readonly_fields = ('user', 'action', 'ip_address', 'user_agent', 'timestamp', 'success', 'details')
    ordering = ('-timestamp',)
    
    def has_add_permission(self, request):
        # Security audit logs should not be manually created
        return False
    
    def has_change_permission(self, request, obj=None):
        # Security audit logs should not be modified
        return False