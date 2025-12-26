from django.contrib import admin
from .models import Prescription, Medication


@admin.register(Prescription)
class PrescriptionAdmin(admin.ModelAdmin):
    list_display = ('user', 'doctor_name', 'prescription_date', 'is_processed', 'created_at')
    list_filter = ('is_processed', 'prescription_date', 'created_at')
    search_fields = ('user__username', 'doctor_name', 'clinic_name')


@admin.register(Medication)
class MedicationAdmin(admin.ModelAdmin):
    list_display = ('name', 'dosage', 'frequency', 'prescription')
    list_filter = ('prescription__prescription_date',)
    search_fields = ('name', 'prescription__doctor_name')