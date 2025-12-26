from rest_framework import serializers
from .models import VitalReading


class VitalReadingSerializer(serializers.ModelSerializer):
    class Meta:
        model = VitalReading
        fields = '__all__'
        read_only_fields = ('user', 'created_at')

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

    def validate_value(self, value):
        """Validate vital reading value format"""
        if not value or not value.strip():
            raise serializers.ValidationError("Value cannot be empty")
        return value.strip()

    def validate_unit(self, unit):
        """Validate unit format"""
        if not unit or not unit.strip():
            raise serializers.ValidationError("Unit cannot be empty")
        return unit.strip()


class VitalTrendSerializer(serializers.Serializer):
    """Serializer for vital trends data"""
    vital_type = serializers.CharField()
    period_days = serializers.IntegerField()
    data_points = serializers.ListField(
        child=serializers.DictField()
    )
    average = serializers.FloatField(allow_null=True)
    trend_direction = serializers.CharField()  # 'up', 'down', 'stable'
    change_percentage = serializers.FloatField(allow_null=True)
    latest_reading = serializers.DictField(allow_null=True)


class VitalSummarySerializer(serializers.Serializer):
    """Serializer for dashboard vital summary"""
    total_readings = serializers.IntegerField()
    readings_this_week = serializers.IntegerField()
    readings_this_month = serializers.IntegerField()
    vital_types_count = serializers.IntegerField()
    latest_readings = serializers.ListField(
        child=VitalReadingSerializer()
    )
    alerts = serializers.ListField(
        child=serializers.DictField()
    )


class VitalStatisticsSerializer(serializers.Serializer):
    """Serializer for vital statistics"""
    vital_type = serializers.CharField()
    total_readings = serializers.IntegerField()
    average_value = serializers.FloatField(allow_null=True)
    min_value = serializers.FloatField(allow_null=True)
    max_value = serializers.FloatField(allow_null=True)
    readings_by_month = serializers.DictField()
    frequency_analysis = serializers.DictField()