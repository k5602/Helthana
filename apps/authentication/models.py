from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
from typing import Tuple


class User(AbstractUser):
    """Extended user model with health profile and enhanced security"""
    # Health profile fields
    phone_number = models.CharField(max_length=15, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    emergency_contact_name = models.CharField(max_length=100, blank=True)
    emergency_contact_phone = models.CharField(max_length=15, blank=True)
    medical_conditions = models.TextField(blank=True)
    
    # Enhanced security fields
    email_verified = models.BooleanField(default=False)
    email_verification_token = models.CharField(max_length=255, blank=True)
    password_reset_token = models.CharField(max_length=255, blank=True)
    password_reset_expires = models.DateTimeField(null=True, blank=True)
    failed_login_attempts = models.IntegerField(default=0)
    account_locked_until = models.DateTimeField(null=True, blank=True)
    last_login_ip = models.GenericIPAddressField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.username
    
    def generate_email_verification_token(self) -> str:
        """
        Generate and store an email verification token for this user.
        
        Returns:
            str: The generated token
        """
        from .tokens import email_verification_token_generator
        
        token = email_verification_token_generator.generate_token(self)
        self.email_verification_token = token
        self.save(update_fields=['email_verification_token'])
        return token
    
    def generate_password_reset_token(self) -> Tuple[str, timezone.datetime]:
        """
        Generate and store a password reset token for this user.
        
        Returns:
            Tuple[str, datetime]: The generated token and its expiry time
        """
        from .tokens import password_reset_token_generator
        
        token, expiry_time = password_reset_token_generator.generate_token_with_expiry(self)
        self.password_reset_token = token
        self.password_reset_expires = expiry_time
        self.save(update_fields=['password_reset_token', 'password_reset_expires'])
        return token, expiry_time
    
    def verify_email_token(self, token: str) -> bool:
        """
        Verify an email verification token for this user.
        
        Args:
            token: The token to verify
            
        Returns:
            bool: True if token is valid
        """
        from .token_utils import validate_user_email_token
        
        if validate_user_email_token(self, token):
            # Mark email as verified and clear token
            self.email_verified = True
            self.email_verification_token = ''
            self.save(update_fields=['email_verified', 'email_verification_token'])
            return True
        return False
    
    def verify_password_reset_token(self, token: str) -> bool:
        """
        Verify a password reset token for this user.
        
        Args:
            token: The token to verify
            
        Returns:
            bool: True if token is valid
        """
        from .token_utils import validate_user_password_reset_token
        
        return validate_user_password_reset_token(self, token)
    
    def clear_password_reset_token(self):
        """Clear the password reset token and expiry time."""
        self.password_reset_token = ''
        self.password_reset_expires = None
        self.save(update_fields=['password_reset_token', 'password_reset_expires'])
    
    def is_account_locked(self) -> bool:
        """
        Check if the account is currently locked.
        
        Returns:
            bool: True if account is locked
        """
        if self.account_locked_until is None:
            return False
        return timezone.now() < self.account_locked_until
    
    def lock_account(self, duration_minutes: int = 15):
        """
        Lock the account for a specified duration.
        
        Args:
            duration_minutes: How long to lock the account (default: 15 minutes)
        """
        self.account_locked_until = timezone.now() + timezone.timedelta(minutes=duration_minutes)
        self.save(update_fields=['account_locked_until'])
    
    def unlock_account(self):
        """Unlock the account and reset failed login attempts."""
        self.account_locked_until = None
        self.failed_login_attempts = 0
        self.save(update_fields=['account_locked_until', 'failed_login_attempts'])
    
    def increment_failed_login_attempts(self, max_attempts: int = 7) -> bool:
        """
        Increment failed login attempts and lock account if threshold is reached.
        
        Args:
            max_attempts: Maximum allowed failed attempts before locking
            
        Returns:
            bool: True if account was locked due to this attempt
        """
        self.failed_login_attempts += 1
        
        if self.failed_login_attempts >= max_attempts:
            self.lock_account()
            self.save(update_fields=['failed_login_attempts'])
            return True
        else:
            self.save(update_fields=['failed_login_attempts'])
            return False
    
    def reset_failed_login_attempts(self):
        """Reset failed login attempts counter."""
        self.failed_login_attempts = 0
        self.save(update_fields=['failed_login_attempts'])


class UserSession(models.Model):
    """Model for tracking user sessions across multiple devices"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sessions')
    session_key = models.CharField(max_length=255, unique=True)
    refresh_token_jti = models.CharField(max_length=255, unique=True)  # JWT ID for refresh token
    device_name = models.CharField(max_length=100, blank=True, default='')
    device_type = models.CharField(max_length=50, blank=True)  # mobile, desktop, tablet
    browser_name = models.CharField(max_length=50, blank=True)
    browser_version = models.CharField(max_length=20, blank=True)
    os_name = models.CharField(max_length=50, blank=True)
    os_version = models.CharField(max_length=20, blank=True)
    ip_address = models.GenericIPAddressField()
    location = models.CharField(max_length=100, blank=True)  # City, Country
    remember_me = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    last_activity = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    
    class Meta:
        ordering = ['-last_activity']
        indexes = [
            models.Index(fields=['user', '-last_activity']),
            models.Index(fields=['refresh_token_jti']),
            models.Index(fields=['session_key']),
            models.Index(fields=['is_active', '-last_activity']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.device_name or 'Unknown Device'} - {self.created_at}"
    
    def is_expired(self):
        """Check if session is expired"""
        return timezone.now() > self.expires_at
    
    def deactivate(self):
        """Deactivate this session"""
        self.is_active = False
        self.save(update_fields=['is_active'])
    
    def get_device_info(self):
        """Get formatted device information"""
        device_info = []
        if self.device_name:
            device_info.append(self.device_name)
        elif self.browser_name:
            browser_info = self.browser_name
            if self.browser_version:
                browser_info += f" {self.browser_version}"
            device_info.append(browser_info)
        
        if self.os_name:
            os_info = self.os_name
            if self.os_version:
                os_info += f" {self.os_version}"
            device_info.append(os_info)
        
        return " • ".join(device_info) if device_info else "Unknown Device"


class SecurityAuditLog(models.Model):
    """Model for tracking authentication and security events"""
    ACTION_CHOICES = [
        ('login', 'Login'),
        ('logout', 'Logout'),
        ('login_failed', 'Login Failed'),
        ('password_reset_request', 'Password Reset Request'),
        ('password_reset_confirm', 'Password Reset Confirm'),
        ('password_change', 'Password Change'),
        ('email_verification', 'Email Verification'),
        ('account_locked', 'Account Locked'),
        ('account_unlocked', 'Account Unlocked'),
        ('hijack_started', 'Hijack Started'),
        ('hijack_ended', 'Hijack Ended'),
        ('session_created', 'Session Created'),
        ('session_terminated', 'Session Terminated'),
        ('token_refreshed', 'Token Refreshed'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='security_logs')
    action = models.CharField(max_length=50, choices=ACTION_CHOICES)
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    success = models.BooleanField()
    details = models.JSONField(default=dict)
    session = models.ForeignKey(UserSession, on_delete=models.SET_NULL, null=True, blank=True)
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['user', '-timestamp']),
            models.Index(fields=['action', '-timestamp']),
            models.Index(fields=['ip_address', '-timestamp']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.action} - {self.timestamp}"