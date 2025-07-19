from rest_framework import serializers
from .models import Prescription, Medication
from .services import PrescriptionService


class MedicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Medication
        fields = [
            'id', 'name', 'dosage', 'frequency', 'duration', 
            'instructions', 'is_active'
        ]


class PrescriptionSerializer(serializers.ModelSerializer):
    medications = MedicationSerializer(many=True, read_only=True)
    medication_count = serializers.SerializerMethodField()

    class Meta:
        model = Prescription
        fields = [
            'id', 'doctor_name', 'clinic_name', 'prescription_date',
            'image', 'ocr_text', 'is_processed', 'ai_confidence_score',
            'manual_verification_required', 'processing_status',
            'created_at', 'updated_at', 'medications', 'medication_count'
        ]
        read_only_fields = (
            'ocr_text', 'is_processed', 'ai_confidence_score',
            'manual_verification_required', 'processing_status'
        )

    def get_medication_count(self, obj):
        return obj.medications.filter(is_active=True).count()

    def validate_image(self, value):
        """Validate uploaded image"""
        validation_result = PrescriptionService.validate_image_upload(value)
        if not validation_result['valid']:
            raise serializers.ValidationError(validation_result['errors'])
        return value


class PrescriptionCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating prescriptions"""
    
    class Meta:
        model = Prescription
        fields = [
            'doctor_name', 'clinic_name', 'prescription_date', 'image'
        ]

    def validate_image(self, value):
        """Validate uploaded image"""
        validation_result = PrescriptionService.validate_image_upload(value)
        if not validation_result['valid']:
            raise serializers.ValidationError(validation_result['errors'])
        return value


class OCRResultSerializer(serializers.Serializer):
    """Serializer for OCR processing results"""
    success = serializers.BooleanField()
    ocr_result = serializers.DictField(required=False)
    error = serializers.CharField(required=False)
    prescription_id = serializers.IntegerField()


class OCRStatusSerializer(serializers.Serializer):
    """Serializer for OCR processing status"""
    prescription_id = serializers.IntegerField()
    processing_status = serializers.CharField()
    is_processed = serializers.BooleanField()
    confidence_score = serializers.FloatField(allow_null=True)
    manual_verification_required = serializers.BooleanField()
    has_ocr_text = serializers.BooleanField()
    medication_count = serializers.IntegerField()
    # Real-time status fields (optional)
    stage = serializers.CharField(required=False)
    progress = serializers.IntegerField(required=False)
    message = serializers.CharField(required=False)
    estimated_time_remaining = serializers.FloatField(required=False)


class OCRValidationSerializer(serializers.Serializer):
    """Serializer for OCR validation requests"""
    is_valid = serializers.BooleanField(default=True)
    corrections = serializers.DictField(required=False)
    notes = serializers.CharField(required=False, allow_blank=True)