from rest_framework import status
from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Avg, Count, Q
from django.utils import timezone
from datetime import datetime, timedelta
from .models import VitalReading
from .serializers import VitalReadingSerializer, VitalTrendSerializer, VitalSummarySerializer
from .services import VitalAnalyticsService


class VitalReadingViewSet(ModelViewSet):
    """ViewSet for managing vital readings with CRUD operations and analytics"""
    serializer_class = VitalReadingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Get user's active vital readings with optional filtering"""
        queryset = VitalReading.objects.filter(user=self.request.user, is_active=True)
        
        # Filter by vital type
        vital_type = self.request.query_params.get('type')
        if vital_type:
            queryset = queryset.filter(vital_type=vital_type)
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        
        if start_date:
            try:
                start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
                queryset = queryset.filter(recorded_at__date__gte=start_date)
            except ValueError:
                pass
        
        if end_date:
            try:
                end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
                queryset = queryset.filter(recorded_at__date__lte=end_date)
            except ValueError:
                pass
        
        return queryset.order_by('-recorded_at')

    def perform_destroy(self, instance):
        """Soft delete vital reading"""
        instance.is_active = False
        instance.save()

    @action(detail=False, methods=['get'])
    def trends(self, request):
        """Get vital signs trends for chart data"""
        try:
            vital_type = request.query_params.get('type')
            days = int(request.query_params.get('days', 30))
            
            if not vital_type:
                return Response(
                    {'error': 'vital_type parameter is required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get trend data from service
            trend_data = VitalAnalyticsService.get_vital_trends(
                user=request.user,
                vital_type=vital_type,
                days=days
            )
            
            serializer = VitalTrendSerializer(trend_data)
            return Response(serializer.data)
            
        except ValueError:
            return Response(
                {'error': 'Invalid days parameter'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to get trends: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get vital signs summary for dashboard"""
        try:
            summary_data = VitalAnalyticsService.get_dashboard_summary(request.user)
            serializer = VitalSummarySerializer(summary_data)
            return Response(serializer.data)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to get summary: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get vital signs statistics and analytics"""
        try:
            vital_type = request.query_params.get('type')
            days = int(request.query_params.get('days', 30))
            
            stats_data = VitalAnalyticsService.get_vital_statistics(
                user=request.user,
                vital_type=vital_type,
                days=days
            )
            
            return Response(stats_data)
            
        except ValueError:
            return Response(
                {'error': 'Invalid days parameter'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to get statistics: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def types(self, request):
        """Get available vital types with counts"""
        try:
            vital_types_data = VitalAnalyticsService.get_vital_types_summary(request.user)
            return Response(vital_types_data)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to get vital types: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )