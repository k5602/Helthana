from rest_framework import serializers


class DateValidationMixin:
    def _validate_date_order(self, data):
        if data['date_from'] > data['date_to']:
            raise serializers.ValidationError("date_from must be before date_to")
    
    def _validate_date_range_limit(self, data):
        if (data['date_to'] - data['date_from']).days > 365:
            raise serializers.ValidationError("Date range cannot exceed 1 year")