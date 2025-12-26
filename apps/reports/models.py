from django.conf import settings
from django.db import models

from apps.shared.models import SoftDeleteMixin


class HealthReport(SoftDeleteMixin):
    """Generated PDF reports"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    report_type = models.CharField(max_length=50, choices=[
        ('vitals', 'Vitals Summary'),
        ('prescriptions', 'Prescription History'),
        ('comprehensive', 'Comprehensive Report'),
    ])
    date_from = models.DateField()
    date_to = models.DateField()
    pdf_file = models.FileField(upload_to='reports/', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.title}"
