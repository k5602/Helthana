from django.db import models, transaction
from django.conf import settings
from django.utils import timezone

class EmergencyContactManager(models.Manager):
    
    def set_primary(self, user, contact_id):
        # transaction ensures that either all operations succeed, or none do.
        with transaction.atomic():
            self._demote_other_primaries(user, contact_id)
            contact = self.get(user=user, id=contact_id)
            if not contact.is_primary:
                contact.is_primary = True
                contact.save(update_fields=['is_primary'])
            return contact
    # leading underscore means that it is an internal helper
    def _demote_other_primaries(self, user, contact_id):
        '''
        Demote all primary contacts for this user except the specified one.
        Use row locking to prevent concurrent update issues
        '''
        queryset = self.select_for_update().filter(
            user=user,
            is_active=True,
        )
        queryset.filter(is_primary=True).exclude(id=contact_id).update(is_primary=False)


class EmergencyContact(models.Model):
    """Emergency contact information"""
    RELATIONSHIP_CHOICES = [
        ('family', 'Family Member'),
        ('friend', 'Friend'),
        ('doctor', 'Doctor'),
        ('caregiver', 'Caregiver'),
        ('neighbor', 'Neighbor'),
        ('other', 'Other'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    phone_number = models.CharField(max_length=15)
    email = models.EmailField(blank=True, null=True)
    relationship = models.CharField(max_length=50, choices=RELATIONSHIP_CHOICES, default='other')
    is_primary = models.BooleanField(default=False)
    can_receive_sms = models.BooleanField(default=True)
    can_receive_calls = models.BooleanField(default=True)
    notes = models.TextField(blank=True, help_text="Additional notes about this contact")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    objects = EmergencyContactManager()

    class Meta:
        ordering = ['-is_primary', 'name']
        indexes = [
            models.Index(fields=['user', 'is_active']),
            models.Index(fields=['user', 'is_primary']),
        ]

    def __str__(self):
        return f"{self.name} - {self.user.username}"
    
    def soft_delete(self):
        self.is_active = False
        self.save()


class EmergencyAlert(models.Model):
    """Emergency SOS alerts"""
    ALERT_TYPE_CHOICES = [
        ('general', 'General Emergency'),
        ('medical', 'Medical Emergency'),
        ('fall', 'Fall Detection'),
        ('panic', 'Panic Button'),
        ('medication', 'Medication Emergency'),
        ('test', 'Test Alert'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('resolved', 'Resolved'),
        ('cancelled', 'Cancelled'),
        ('test', 'Test'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    alert_type = models.CharField(max_length=20, choices=ALERT_TYPE_CHOICES, default='general')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    location_lat = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    location_lng = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    location_accuracy = models.FloatField(null=True, blank=True, help_text="Location accuracy in meters")
    message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    
    # Tracking fields
    notifications_sent = models.IntegerField(default=0)
    notifications_failed = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['user', 'status']),
            models.Index(fields=['alert_type']),
        ]

    def __str__(self):
        return f"Emergency Alert - {self.user.username} - {self.get_alert_type_display()} - {self.created_at}"
    # Generally, regular methods imply actions need to be performed on object. 
    # Properties on the other hand are features/characteristics of objects. 
    @property
    def is_resolved(self):
        """Backward compatibility property"""
        return self.status in ['resolved', 'cancelled']

    def resolve(self):
        """Mark alert as resolved"""
        self.status = 'resolved'
        self.resolved_at = timezone.now()
        self.save()

    def cancel(self):
        """Mark alert as cancelled"""
        self.status = 'cancelled'
        self.resolved_at = timezone.now()
        self.save()

    @property
    def duration_minutes(self):
        """Get alert duration in minutes"""
        if self.resolved_at:
            return int((self.resolved_at - self.created_at).total_seconds() / 60)
        return int((timezone.now() - self.created_at).total_seconds() / 60)

    @property
    def location_url(self):
        """Get Google Maps URL for location"""
        if self.location_lat and self.location_lng:
            return f"https://maps.google.com/maps?q={self.location_lat},{self.location_lng}"
        return None


class EmergencyNotification(models.Model):
    """Track emergency notifications sent to contacts"""
    NOTIFICATION_TYPE_CHOICES = [
        ('sms', 'SMS'),
        ('call', 'Phone Call'),
        ('email', 'Email'),
        ('push', 'Push Notification'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('sent', 'Sent'),
        ('delivered', 'Delivered'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]
    
    alert = models.ForeignKey(EmergencyAlert, on_delete=models.CASCADE, related_name='notifications')
    contact = models.ForeignKey(EmergencyContact, on_delete=models.CASCADE)
    notification_type = models.CharField(max_length=10, choices=NOTIFICATION_TYPE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    message = models.TextField()
    sent_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    error_message = models.TextField(blank=True)
    external_id = models.CharField(max_length=100, blank=True, help_text="External service message ID")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['alert', 'status']),
            models.Index(fields=['contact', '-created_at']),
        ]

    def __str__(self):
        return f"{self.get_notification_type_display()} to {self.contact.name} - {self.status}"

    def mark_sent(self, external_id=None):
        """Mark notification as sent"""
        self.status = 'sent'
        self.sent_at = timezone.now()
        if external_id:
            self.external_id = external_id
        self.save()

    def mark_delivered(self):
        """Mark notification as delivered"""
        self.status = 'delivered'
        self.delivered_at = timezone.now()
        self.save()

    def mark_failed(self, error_message):
        """Mark notification as failed"""
        self.status = 'failed'
        self.error_message = error_message
        self.save()