from rest_framework import serializers
from .models import Prescription, Medication


class MedicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Medication
        fields = '__all__'


class PrescriptionSerializer(serializers.ModelSerializer):
    medications = MedicationSerializer(many=True, read_only=True)

    class Meta:
        model = Prescription
        fields = '__all__'
        read_only_fields = ('user', 'ocr_text', 'is_processed')

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)