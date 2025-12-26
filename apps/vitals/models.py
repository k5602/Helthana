from django.db import models
from django.conf import settings


class VitalReading(models.Model):
    """Health metrics tracking"""
    VITAL_TYPES = [
        ('blood_pressure', 'Blood Pressure'),
        ('glucose', 'Blood Glucose'),
        ('weight', 'Weight'),
        ('heart_rate', 'Heart Rate'),
        ('temperature', 'Temperature'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    vital_type = models.CharField(max_length=20, choices=VITAL_TYPES)
    value = models.CharField(max_length=50)  # Flexible for different formats
    unit = models.CharField(max_length=20)
    notes = models.TextField(blank=True)
    recorded_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['-recorded_at']

    def __str__(self):
        return f"{self.user.username} - {self.vital_type}: {self.value} {self.unit}"