
from django.utils import timezone
from rest_framework import serializers

from apps.shared.serializers import DateValidationMixin

from .models import HealthReport


class HealthReportSerializer(serializers.ModelSerializer, DateValidationMixin):
    pdf_url = serializers.SerializerMethodField()
    file_size = serializers.SerializerMethodField()

    class Meta:
        model = HealthReport
        fields = '__all__'
        read_only_fields = ('user', 'pdf_file', 'created_at')

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

    def get_pdf_url(self, obj):
        """Get PDF file URL if available"""
        if obj.pdf_file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.pdf_file.url)
            return obj.pdf_file.url
        return None

    def get_file_size(self, obj):
        """Get PDF file size in bytes"""
        if obj.pdf_file:
            try:
                return obj.pdf_file.size
            except (OSError, ValueError):
                return None
        return None

    def validate(self, data):
        # Since HealthReportSerializer is a ModelSerializer,
        # this means that it can be used for both creating (POST) and Updating (PATCH) a report. So,
        # if a PATCH request is done to only change the report's title, the date variables won't be provided.
        # This is why we check if they exist or not with get() in the first place before we start validating them.
        if data.get('date_from') and data.get('date_to'):
            self._validate_date_order(data)
            self._validate_date_range_limit(data)
        return data


class ReportGenerationSerializer(serializers.Serializer, DateValidationMixin):
    """Serializer for report generation requests"""
    report_type = serializers.ChoiceField(
        choices=HealthReport._meta.get_field('report_type').choices,
        required=True
    )
    date_from = serializers.DateField(required=True)
    date_to = serializers.DateField(required=True)
    title = serializers.CharField(max_length=200, required=False)
    include_charts = serializers.BooleanField(default=True)
    include_summary = serializers.BooleanField(default=True)
    include_recommendations = serializers.BooleanField(default=False)
    language = serializers.ChoiceField(
        choices=[('en', 'English'), ('ar', 'Arabic')],
        default='en'
    )

    def validate(self, data):
        """Validate report generation data"""
        self._validate_date_order(data)
        self._validate_date_range_limit(data)
        # Check if date_to is not in the future
        if data['date_to'] > timezone.now().date():
            raise serializers.ValidationError("date_to cannot be in the future")

        # Generate default title if not provided
        if not data.get('title'):
            report_type_display = dict(HealthReport._meta.get_field('report_type').choices)[data['report_type']]
            data['title'] = f"{report_type_display} - {data['date_from']} to {data['date_to']}"

        return data


class ReportSharingSerializer(serializers.Serializer):
    """Serializer for report sharing data"""
    sharing_token = serializers.CharField()
    sharing_url = serializers.URLField()
    expires_at = serializers.DateTimeField()
    access_count = serializers.IntegerField(default=0)
    max_access_count = serializers.IntegerField(default=10)


class ReportTemplateSerializer(serializers.Serializer):
    """Serializer for report templates"""
    template_id = serializers.CharField()
    name = serializers.CharField()
    description = serializers.CharField()
    report_type = serializers.CharField()
    preview_image = serializers.URLField(required=False)
    supported_languages = serializers.ListField(
        child=serializers.CharField()
    )
    required_data_types = serializers.ListField(
        child=serializers.CharField()
    )


class ReportScheduleSerializer(serializers.Serializer):
    """Serializer for scheduled reports"""
    schedule_id = serializers.CharField(read_only=True)
    report_type = serializers.ChoiceField(
        choices=HealthReport._meta.get_field('report_type').choices
    )
    frequency = serializers.ChoiceField(
        choices=[
            ('daily', 'Daily'),
            ('weekly', 'Weekly'),
            ('monthly', 'Monthly'),
            ('quarterly', 'Quarterly')
        ]
    )
    day_of_week = serializers.IntegerField(min_value=0, max_value=6, required=False)
    day_of_month = serializers.IntegerField(min_value=1, max_value=31, required=False)
    time_of_day = serializers.TimeField(default='09:00:00')
    is_active = serializers.BooleanField(default=True)
    email_delivery = serializers.BooleanField(default=True)
    include_charts = serializers.BooleanField(default=True)
    include_summary = serializers.BooleanField(default=True)
    date_range_days = serializers.IntegerField(min_value=1, max_value=365, default=30)

    def validate(self, data):
        """Validate schedule configuration"""
        if data['frequency'] == 'weekly' and 'day_of_week' not in data:
            raise serializers.ValidationError("day_of_week is required for weekly frequency")

        if data['frequency'] == 'monthly' and 'day_of_month' not in data:
            raise serializers.ValidationError("day_of_month is required for monthly frequency")

        return data
