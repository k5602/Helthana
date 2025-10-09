from rest_framework import status
from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from datetime import datetime, timedelta
from .models import EmergencyContact, EmergencyAlert
from .serializers import (
    EmergencyContactSerializer, 
    EmergencyAlertSerializer,
    EmergencyAlertCreateSerializer,
    EmergencyStatusSerializer
)
from .services import EmergencyService
from django.db import transaction


class EmergencyContactViewSet(ModelViewSet):
    """ViewSet for managing emergency contacts"""
    serializer_class = EmergencyContactSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Get user's active emergency contacts"""
        return EmergencyContact.objects.filter(user=self.request.user, is_active=True)
    
    def _handle_primary_logic(self, serializer):
        save_kwargs = {}
        if self.action == 'create':
            save_kwargs['user'] = self.request.user
        # save_kwargs will be empty if self.action == 'update', 
        # which is correct.
        instance = serializer.save(**save_kwargs)
        
        if serializer.validated_data.get('is_primary', False):
            EmergencyContact.objects.set_primary(user=self.request.user, contact_id=instance.id)

    def perform_destroy(self, instance):
        """Soft delete emergency contact"""
        instance.is_active = False
        instance.save()

    def perform_create(self, serializer):
        self._handle_primary_logic(serializer)
    
    def perform_update(self, serializer):
        self._handle_primary_logic(serializer)
            

    @action(detail=True, methods=['post'])
    def set_primary_contact(self, request, pk=None):
        try:
            contact = EmergencyContact.objects.set_primary(request.user, pk)
            serializer = self.get_serializer(contact)
            return Response(serializer.data)
        
        except EmergencyContact.DoesNotExist:
            return Response(
                {"error": "Contact not found"},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['get'])
    def get_primary(self, request):
        """Get primary emergency contact"""
        try:
            primary_contact = EmergencyContact.objects.filter(
                user=request.user,
                is_primary=True,
                is_active=True
            ).first()
            
            if primary_contact:
                serializer = self.get_serializer(primary_contact)
                return Response(serializer.data)
            else:
                return Response(
                    {'message': 'No primary contact set'},
                    status=status.HTTP_404_NOT_FOUND
                )
                
        except Exception as e:
            return Response(
                {'error': f'Failed to get primary contact: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class EmergencyAlertViewSet(ModelViewSet):
    """ViewSet for managing emergency alerts"""
    serializer_class = EmergencyAlertSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Get user's emergency alerts with optional filtering"""
        queryset = EmergencyAlert.objects.filter(user=self.request.user)
        
        # Filter by resolution status
        is_resolved = self.request.query_params.get('resolved')
        if is_resolved is not None:
            queryset = queryset.filter(is_resolved=is_resolved.lower() == 'true')
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        
        if start_date:
            try:
                start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
                queryset = queryset.filter(created_at__date__gte=start_date)
            except ValueError:
                pass
        
        if end_date:
            try:
                end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
                queryset = queryset.filter(created_at__date__lte=end_date)
            except ValueError:
                pass
        
        return queryset.order_by('-created_at')

    def get_serializer_class(self):
        """Use different serializers for different actions"""
        if self.action == 'create':
            return EmergencyAlertCreateSerializer
        return EmergencyAlertSerializer

    @action(detail=False, methods=['post'])
    def send_alert(self, request):
        """Send emergency alert to contacts"""
        try:
            serializer = EmergencyAlertCreateSerializer(data=request.data)
            if not serializer.is_valid():
                return Response(
                    {'error': 'Invalid data', 'details': serializer.errors},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create the alert
            alert = EmergencyAlert.objects.create(
                user=request.user,
                location_lat=serializer.validated_data.get('location_lat'),
                location_lng=serializer.validated_data.get('location_lng'),
                message=serializer.validated_data.get('message', 'Emergency alert from Your Health Guide app')
            )
            
            # Send notifications to emergency contacts
            result = EmergencyService.send_emergency_alert(
                user=request.user,
                alert=alert,
                include_location=serializer.validated_data.get('include_location', True),
                alert_type=serializer.validated_data.get('alert_type', 'general')
            )
            
            response_serializer = EmergencyAlertSerializer(alert)
            return Response({
                'message': 'Emergency alert sent successfully',
                'alert': response_serializer.data,
                'notifications_sent': result['notifications_sent'],
                'failed_notifications': result['failed_notifications']
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to send emergency alert: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        """Mark emergency alert as resolved"""
        try:
            alert = self.get_object()
            alert.is_resolved = True
            alert.save()
            
            # Notify contacts that alert is resolved
            EmergencyService.send_resolution_notification(
                user=request.user,
                alert=alert
            )
            
            serializer = self.get_serializer(alert)
            return Response({
                'message': 'Emergency alert resolved',
                'alert': serializer.data
            })
            
        except Exception as e:
            return Response(
                {'error': f'Failed to resolve alert: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel emergency alert"""
        try:
            alert = self.get_object()
            
            if alert.is_resolved:
                return Response(
                    {'error': 'Cannot cancel resolved alert'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Mark as resolved and send cancellation notification
            alert.is_resolved = True
            alert.save()
            
            EmergencyService.send_cancellation_notification(
                user=request.user,
                alert=alert
            )
            
            serializer = self.get_serializer(alert)
            return Response({
                'message': 'Emergency alert cancelled',
                'alert': serializer.data
            })
            
        except Exception as e:
            return Response(
                {'error': f'Failed to cancel alert: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def status(self, request):
        """Get emergency status summary"""
        try:
            status_data = EmergencyService.get_emergency_status(request.user)
            serializer = EmergencyStatusSerializer(status_data)
            return Response(serializer.data)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to get emergency status: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def history(self, request):
        """Get emergency alert history with statistics"""
        try:
            days = int(request.query_params.get('days', 30))
            history_data = EmergencyService.get_alert_history(request.user, days)
            return Response(history_data)
            
        except ValueError:
            return Response(
                {'error': 'Invalid days parameter'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to get alert history: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
