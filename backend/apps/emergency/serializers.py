from rest_framework import serializers
from django.core.validators import RegexValidator
from .models import EmergencyContact, EmergencyAlert


class EmergencyContactSerializer(serializers.ModelSerializer):
    phone_number = serializers.CharField(
        validators=[
            RegexValidator(
                regex=r'^\+?1?\d{9,15}$',
                message="Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed."
            )
        ]
    )
    
    class Meta:
        model = EmergencyContact
        fields = '__all__'
        read_only_fields = ('user', 'created_at')

    def validate_name(self, value):
        """Validate contact name"""
        if not value or not value.strip():
            raise serializers.ValidationError("Name cannot be empty")
        return value.strip()

    def validate_relationship(self, value):
        """Validate relationship"""
        if not value or not value.strip():
            raise serializers.ValidationError("Relationship cannot be empty")
        return value.strip()


class EmergencyAlertSerializer(serializers.ModelSerializer):
    location_display = serializers.SerializerMethodField()
    time_since_created = serializers.SerializerMethodField()
    
    class Meta:
        model = EmergencyAlert
        fields = '__all__'
        read_only_fields = ('user', 'created_at')

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

    def get_location_display(self, obj):
        """Get formatted location display"""
        if obj.location_lat and obj.location_lng:
            return f"{obj.location_lat}, {obj.location_lng}"
        return None

    def get_time_since_created(self, obj):
        """Get human-readable time since alert was created"""
        from django.utils import timezone
        
        now = timezone.now()
        diff = now - obj.created_at
        
        if diff.days > 0:
            return f"{diff.days} day{'s' if diff.days > 1 else ''} ago"
        elif diff.seconds > 3600:
            hours = diff.seconds // 3600
            return f"{hours} hour{'s' if hours > 1 else ''} ago"
        elif diff.seconds > 60:
            minutes = diff.seconds // 60
            return f"{minutes} minute{'s' if minutes > 1 else ''} ago"
        else:
            return "Just now"


class EmergencyAlertCreateSerializer(serializers.Serializer):
    """Serializer for creating emergency alerts"""
    location_lat = serializers.DecimalField(
        max_digits=9, 
        decimal_places=6, 
        required=False,
        allow_null=True
    )
    location_lng = serializers.DecimalField(
        max_digits=9, 
        decimal_places=6, 
        required=False,
        allow_null=True
    )
    message = serializers.CharField(
        max_length=500, 
        required=False,
        default="Emergency alert from Your Health Guide app"
    )
    include_location = serializers.BooleanField(default=True)
    alert_type = serializers.ChoiceField(
        choices=[
            ('general', 'General Emergency'),
            ('medical', 'Medical Emergency'),
            ('fall', 'Fall Detection'),
            ('panic', 'Panic Button'),
            ('medication', 'Medication Emergency')
        ],
        default='general'
    )
    send_sms = serializers.BooleanField(default=True)
    make_call = serializers.BooleanField(default=False)

    def validate(self, data):
        """Validate alert creation data"""
        # If location is included, both lat and lng should be provided
        if data.get('include_location', True):
            if data.get('location_lat') is not None and data.get('location_lng') is None:
                raise serializers.ValidationError("Both latitude and longitude must be provided")
            if data.get('location_lng') is not None and data.get('location_lat') is None:
                raise serializers.ValidationError("Both latitude and longitude must be provided")
        
        # Validate coordinates range
        if data.get('location_lat') is not None:
            if not (-90 <= float(data['location_lat']) <= 90):
                raise serializers.ValidationError("Latitude must be between -90 and 90")
        
        if data.get('location_lng') is not None:
            if not (-180 <= float(data['location_lng']) <= 180):
                raise serializers.ValidationError("Longitude must be between -180 and 180")
        
        return data


class EmergencyStatusSerializer(serializers.Serializer):
    """Serializer for emergency status summary"""
    total_contacts = serializers.IntegerField()
    primary_contact = EmergencyContactSerializer(allow_null=True)
    active_alerts = serializers.IntegerField()
    total_alerts = serializers.IntegerField()
    last_alert = EmergencyAlertSerializer(allow_null=True)
    emergency_ready = serializers.BooleanField()
    setup_status = serializers.DictField()


class EmergencyHistorySerializer(serializers.Serializer):
    """Serializer for emergency alert history"""
    period_days = serializers.IntegerField()
    total_alerts = serializers.IntegerField()
    resolved_alerts = serializers.IntegerField()
    active_alerts = serializers.IntegerField()
    alerts_by_type = serializers.DictField()
    alerts_by_month = serializers.DictField()
    recent_alerts = serializers.ListField(
        child=EmergencyAlertSerializer()
    )
    response_times = serializers.DictField()


class EmergencyNotificationSerializer(serializers.Serializer):
    """Serializer for emergency notification results"""
    contact_id = serializers.IntegerField()
    contact_name = serializers.CharField()
    phone_number = serializers.CharField()
    notification_type = serializers.ChoiceField(
        choices=[('sms', 'SMS'), ('call', 'Call'), ('email', 'Email')]
    )
    status = serializers.ChoiceField(
        choices=[('sent', 'Sent'), ('failed', 'Failed'), ('pending', 'Pending')]
    )
    message = serializers.CharField(allow_null=True)
    sent_at = serializers.DateTimeField(allow_null=True)
    error_message = serializers.CharField(allow_null=True)