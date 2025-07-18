from rest_framework import serializers
from .models import HealthReport


class HealthReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = HealthReport
        fields = '__all__'
        read_only_fields = ('user', 'pdf_file')

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)