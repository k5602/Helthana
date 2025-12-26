from django.utils import timezone
from datetime import timedelta
from typing import Dict, List, Any, Optional
from .models import VitalReading


class VitalAnalyticsService:
    """Service class for vital signs analytics and data processing"""

    @staticmethod
    def get_vital_trends(user, vital_type: str, days: int = 30) -> Dict[str, Any]:
        """Get trend data for a specific vital type over a period"""
        end_date = timezone.now()
        start_date = end_date - timedelta(days=days)
        
        # Get readings for the period
        readings = VitalReading.objects.filter(
            user=user,
            vital_type=vital_type,
            recorded_at__gte=start_date,
            is_active=True
        ).order_by('recorded_at')
        
        if not readings.exists():
            return {
                'vital_type': vital_type,
                'period_days': days,
                'data_points': [],
                'average': None,
                'trend_direction': 'stable',
                'change_percentage': None,
                'latest_reading': None
            }
        
        # Convert readings to data points for charts
        data_points = []
        numeric_values = []
        
        for reading in readings:
            # Try to extract numeric value for trend analysis
            numeric_value = VitalAnalyticsService._extract_numeric_value(reading.value, vital_type)
            
            data_point = {
                'date': reading.recorded_at.strftime('%Y-%m-%d'),
                'time': reading.recorded_at.strftime('%H:%M'),
                'value': reading.value,
                'unit': reading.unit,
                'numeric_value': numeric_value,
                'notes': reading.notes
            }
            data_points.append(data_point)
            
            if numeric_value is not None:
                numeric_values.append(numeric_value)
        
        # Calculate trend metrics
        average = sum(numeric_values) / len(numeric_values) if numeric_values else None
        trend_direction, change_percentage = VitalAnalyticsService._calculate_trend(numeric_values)
        
        # Get latest reading
        latest_reading = {
            'value': readings.last().value,
            'unit': readings.last().unit,
            'recorded_at': readings.last().recorded_at.isoformat(),
            'notes': readings.last().notes
        }
        
        return {
            'vital_type': vital_type,
            'period_days': days,
            'data_points': data_points,
            'average': average,
            'trend_direction': trend_direction,
            'change_percentage': change_percentage,
            'latest_reading': latest_reading
        }

    @staticmethod
    def get_dashboard_summary(user) -> Dict[str, Any]:
        """Get vital signs summary for dashboard display"""
        now = timezone.now()
        week_ago = now - timedelta(days=7)
        month_ago = now - timedelta(days=30)
        
        # Get basic counts
        total_readings = VitalReading.objects.filter(user=user, is_active=True).count()
        readings_this_week = VitalReading.objects.filter(
            user=user, 
            is_active=True,
            recorded_at__gte=week_ago
        ).count()
        readings_this_month = VitalReading.objects.filter(
            user=user, 
            is_active=True,
            recorded_at__gte=month_ago
        ).count()
        
        # Get vital types count
        vital_types_count = VitalReading.objects.filter(
            user=user, 
            is_active=True
        ).values('vital_type').distinct().count()
        
        # Get latest readings (one per type)
        latest_readings = []
        for vital_type, _ in VitalReading.VITAL_TYPES:
            latest = VitalReading.objects.filter(
                user=user,
                vital_type=vital_type,
                is_active=True
            ).first()
            if latest:
                latest_readings.append(latest)
        
        # Generate health alerts based on readings
        alerts = VitalAnalyticsService._generate_health_alerts(user, latest_readings)
        
        return {
            'total_readings': total_readings,
            'readings_this_week': readings_this_week,
            'readings_this_month': readings_this_month,
            'vital_types_count': vital_types_count,
            'latest_readings': latest_readings,
            'alerts': alerts
        }

    @staticmethod
    def get_vital_statistics(user, vital_type: Optional[str] = None, days: int = 30) -> Dict[str, Any]:
        """Get detailed statistics for vital signs"""
        end_date = timezone.now()
        start_date = end_date - timedelta(days=days)
        
        queryset = VitalReading.objects.filter(
            user=user,
            recorded_at__gte=start_date,
            is_active=True
        )
        
        if vital_type:
            queryset = queryset.filter(vital_type=vital_type)
            return VitalAnalyticsService._get_single_vital_stats(queryset, vital_type)
        else:
            # Get stats for all vital types
            stats = {}
            for vtype, _ in VitalReading.VITAL_TYPES:
                type_queryset = queryset.filter(vital_type=vtype)
                if type_queryset.exists():
                    stats[vtype] = VitalAnalyticsService._get_single_vital_stats(type_queryset, vtype)
            return stats

    @staticmethod
    def get_vital_types_summary(user) -> List[Dict[str, Any]]:
        """Get summary of all vital types with counts and latest readings"""
        vital_types_data = []
        
        for vital_type, display_name in VitalReading.VITAL_TYPES:
            readings_count = VitalReading.objects.filter(
                user=user,
                vital_type=vital_type,
                is_active=True
            ).count()
            
            latest_reading = VitalReading.objects.filter(
                user=user,
                vital_type=vital_type,
                is_active=True
            ).first()
            
            vital_types_data.append({
                'type': vital_type,
                'display_name': display_name,
                'readings_count': readings_count,
                'latest_reading': {
                    'value': latest_reading.value if latest_reading else None,
                    'unit': latest_reading.unit if latest_reading else None,
                    'recorded_at': latest_reading.recorded_at.isoformat() if latest_reading else None
                } if latest_reading else None
            })
        
        return vital_types_data

    @staticmethod
    def _extract_numeric_value(value: str, vital_type: str) -> Optional[float]:
        """Extract numeric value from vital reading for trend analysis"""
        try:
            # Handle different vital types
            if vital_type == 'blood_pressure':
                # Extract systolic pressure (first number)
                if '/' in value:
                    return float(value.split('/')[0])
                return float(value)
            elif vital_type in ['glucose', 'weight', 'heart_rate', 'temperature']:
                # Extract first number found
                import re
                numbers = re.findall(r'\d+\.?\d*', value)
                if numbers:
                    return float(numbers[0])
            return None
        except (ValueError, IndexError):
            return None

    @staticmethod
    def _calculate_trend(values: List[float]) -> tuple[str, Optional[float]]:
        """Calculate trend direction and percentage change"""
        if len(values) < 2:
            return 'stable', None
        
        # Compare first and last quarters of the data
        quarter_size = max(1, len(values) // 4)
        first_quarter = values[:quarter_size]
        last_quarter = values[-quarter_size:]
        
        first_avg = sum(first_quarter) / len(first_quarter)
        last_avg = sum(last_quarter) / len(last_quarter)
        
        change_percentage = ((last_avg - first_avg) / first_avg) * 100 if first_avg != 0 else 0
        
        if abs(change_percentage) < 5:  # Less than 5% change is considered stable
            return 'stable', change_percentage
        elif change_percentage > 0:
            return 'up', change_percentage
        else:
            return 'down', change_percentage

    @staticmethod
    def _get_single_vital_stats(queryset, vital_type: str) -> Dict[str, Any]:
        """Get statistics for a single vital type"""
        readings = list(queryset.values_list('value', 'recorded_at'))
        
        if not readings:
            return {
                'vital_type': vital_type,
                'total_readings': 0,
                'average_value': None,
                'min_value': None,
                'max_value': None,
                'readings_by_month': {},
                'frequency_analysis': {}
            }
        
        # Extract numeric values
        numeric_values = []
        for value, _ in readings:
            numeric_val = VitalAnalyticsService._extract_numeric_value(value, vital_type)
            if numeric_val is not None:
                numeric_values.append(numeric_val)
        
        # Calculate statistics
        stats = {
            'vital_type': vital_type,
            'total_readings': len(readings),
            'average_value': sum(numeric_values) / len(numeric_values) if numeric_values else None,
            'min_value': min(numeric_values) if numeric_values else None,
            'max_value': max(numeric_values) if numeric_values else None,
        }
        
        # Readings by month
        readings_by_month = {}
        for _, recorded_at in readings:
            month_key = recorded_at.strftime('%Y-%m')
            readings_by_month[month_key] = readings_by_month.get(month_key, 0) + 1
        
        stats['readings_by_month'] = readings_by_month
        
        # Frequency analysis (how often readings are taken)
        if len(readings) > 1:
            dates = [recorded_at.date() for _, recorded_at in readings]
            dates.sort()
            gaps = [(dates[i] - dates[i-1]).days for i in range(1, len(dates))]
            avg_gap = sum(gaps) / len(gaps) if gaps else 0
            
            stats['frequency_analysis'] = {
                'average_days_between_readings': round(avg_gap, 1),
                'most_frequent_gap': max(set(gaps), key=gaps.count) if gaps else 0,
                'consistency_score': VitalAnalyticsService._calculate_consistency_score(gaps)
            }
        else:
            stats['frequency_analysis'] = {
                'average_days_between_readings': 0,
                'most_frequent_gap': 0,
                'consistency_score': 0
            }
        
        return stats

    @staticmethod
    def _generate_health_alerts(user, latest_readings: List[VitalReading]) -> List[Dict[str, Any]]:
        """Generate health alerts based on latest readings"""
        alerts = []
        
        for reading in latest_readings:
            # Check for potential health concerns based on vital type
            alert = VitalAnalyticsService._check_vital_alert(reading)
            if alert:
                alerts.append(alert)
        
        # Check for missing readings
        now = timezone.now()
        week_ago = now - timedelta(days=7)
        
        for vital_type, display_name in VitalReading.VITAL_TYPES:
            recent_reading = VitalReading.objects.filter(
                user=user,
                vital_type=vital_type,
                recorded_at__gte=week_ago,
                is_active=True
            ).exists()
            
            if not recent_reading:
                alerts.append({
                    'type': 'missing_reading',
                    'vital_type': vital_type,
                    'message': f'No {display_name.lower()} readings in the past week',
                    'severity': 'info',
                    'action': f'Consider logging your {display_name.lower()}'
                })
        
        return alerts

    @staticmethod
    def _check_vital_alert(reading: VitalReading) -> Optional[Dict[str, Any]]:
        """Check if a vital reading requires an alert"""
        numeric_value = VitalAnalyticsService._extract_numeric_value(reading.value, reading.vital_type)
        
        if numeric_value is None:
            return None
        
        # Basic health thresholds (these should be configurable per user)
        thresholds = {
            'blood_pressure': {'high': 140, 'low': 90},
            'glucose': {'high': 180, 'low': 70},
            'heart_rate': {'high': 100, 'low': 60},
            'temperature': {'high': 38.0, 'low': 36.0},
            'weight': {'change_threshold': 5}  # 5% change
        }
        
        if reading.vital_type in thresholds:
            threshold = thresholds[reading.vital_type]
            
            if 'high' in threshold and numeric_value > threshold['high']:
                return {
                    'type': 'high_reading',
                    'vital_type': reading.vital_type,
                    'value': reading.value,
                    'message': f'High {reading.get_vital_type_display()}: {reading.value} {reading.unit}',
                    'severity': 'warning',
                    'action': 'Consider consulting with your healthcare provider'
                }
            elif 'low' in threshold and numeric_value < threshold['low']:
                return {
                    'type': 'low_reading',
                    'vital_type': reading.vital_type,
                    'value': reading.value,
                    'message': f'Low {reading.get_vital_type_display()}: {reading.value} {reading.unit}',
                    'severity': 'warning',
                    'action': 'Consider consulting with your healthcare provider'
                }
        
        return None

    @staticmethod
    def _calculate_consistency_score(gaps: List[int]) -> float:
        """Calculate how consistent the user is with logging vitals"""
        if not gaps:
            return 0.0
        
        # Lower variance in gaps = higher consistency
        avg_gap = sum(gaps) / len(gaps)
        variance = sum((gap - avg_gap) ** 2 for gap in gaps) / len(gaps)
        
        # Convert to 0-100 score (lower variance = higher score)
        consistency_score = max(0, 100 - (variance / avg_gap * 100)) if avg_gap > 0 else 0
        return round(consistency_score, 1)