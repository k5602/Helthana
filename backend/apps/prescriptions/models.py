from django.db import models
from django.conf import settings


class Prescription(models.Model):
    """Scanned prescription records"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    doctor_name = models.CharField(max_length=100)
    clinic_name = models.CharField(max_length=100, blank=True)
    prescription_date = models.DateField()
    image = models.ImageField(upload_to='prescriptions/')
    ocr_text = models.TextField(blank=True)
    is_processed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Prescription by {self.doctor_name} - {self.prescription_date}"


class Medication(models.Model):
    """Individual medications from prescriptions"""
    prescription = models.ForeignKey(Prescription, on_delete=models.CASCADE, related_name='medications')
    name = models.CharField(max_length=200)
    dosage = models.CharField(max_length=100)
    frequency = models.CharField(max_length=100)
    duration = models.CharField(max_length=100, blank=True)
    instructions = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} - {self.dosage}"