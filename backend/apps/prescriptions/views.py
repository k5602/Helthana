from rest_framework import status
from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from django.db.models import Q
from django.utils.dateparse import parse_date
from .models import Prescription, Medication
from .serializers import (
    PrescriptionSerializer, 
    PrescriptionCreateSerializer,
    MedicationSerializer, 
    OCRResultSerializer
)
from .services import PrescriptionService


class PrescriptionViewSet(ModelViewSet):
    """Complete CRUD operations for prescriptions"""
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def get_queryset(self):
        queryset = Prescription.objects.filter(user=self.request.user, is_active=True)
        
        # Add filtering capabilities
        doctor_name = self.request.query_params.get('doctor_name')
        if doctor_name:
            queryset = queryset.filter(doctor_name__icontains=doctor_name)
        
        clinic_name = self.request.query_params.get('clinic_name')
        if clinic_name:
            queryset = queryset.filter(clinic_name__icontains=clinic_name)
        
        date_from = self.request.query_params.get('date_from')
        if date_from:
            date_from = parse_date(date_from)
            if date_from:
                queryset = queryset.filter(prescription_date__gte=date_from)
        
        date_to = self.request.query_params.get('date_to')
        if date_to:
            date_to = parse_date(date_to)
            if date_to:
                queryset = queryset.filter(prescription_date__lte=date_to)
        
        processing_status = self.request.query_params.get('processing_status')
        if processing_status:
            queryset = queryset.filter(processing_status=processing_status)
        
        # Search functionality
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(doctor_name__icontains=search) |
                Q(clinic_name__icontains=search) |
                Q(ocr_text__icontains=search) |
                Q(medications__name__icontains=search)
            ).distinct()
        
        return queryset.select_related('user').prefetch_related('medications')
    
    def get_serializer_class(self):
        if self.action == 'create':
            return PrescriptionCreateSerializer
        return PrescriptionSerializer
    
    def create(self, request, *args, **kwargs):
        """Create a new prescription"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Create prescription using service
        prescription = PrescriptionService.create_prescription(
            user=request.user,
            validated_data=serializer.validated_data
        )
        
        # Return full prescription data
        response_serializer = PrescriptionSerializer(prescription)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
    
    def destroy(self, request, *args, **kwargs):
        """Soft delete prescription"""
        instance = self.get_object()
        instance.is_active = False
        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    @action(detail=True, methods=['post'])
    def process_ocr(self, request, pk=None):
        """Process OCR for uploaded prescription"""
        prescription = self.get_object()
        
        if not prescription.image:
            return Response(
                {'error': 'No image found for this prescription'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if prescription.processing_status == 'processing':
            return Response(
                {'error': 'OCR processing already in progress'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Process OCR using service
        result = PrescriptionService.process_prescription_ocr(prescription)
        
        serializer = OCRResultSerializer(data=result)
        serializer.is_valid(raise_exception=True)
        
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        """Advanced search for prescriptions"""
        queryset = self.get_queryset()
        
        # Apply pagination
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def recent(self, request):
        """Get recent prescriptions (last 30 days)"""
        from datetime import datetime, timedelta
        
        thirty_days_ago = datetime.now().date() - timedelta(days=30)
        queryset = self.get_queryset().filter(created_at__date__gte=thirty_days_ago)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get prescription statistics"""
        queryset = self.get_queryset()
        
        stats = {
            'total_prescriptions': queryset.count(),
            'processed_prescriptions': queryset.filter(is_processed=True).count(),
            'pending_prescriptions': queryset.filter(processing_status='pending').count(),
            'failed_prescriptions': queryset.filter(processing_status='failed').count(),
            'manual_review_required': queryset.filter(manual_verification_required=True).count(),
            'total_medications': Medication.objects.filter(
                prescription__in=queryset,
                is_active=True
            ).count()
        }
        
        return Response(stats)
    
    @action(detail=True, methods=['get'])
    def ocr_status(self, request, pk=None):
        """Get OCR processing status for a prescription"""
        from .services import OCRService
        
        prescription = self.get_object()
        
        # Get current status
        status_data = {
            'prescription_id': prescription.id,
            'processing_status': prescription.processing_status,
            'is_processed': prescription.is_processed,
            'confidence_score': prescription.ai_confidence_score,
            'manual_verification_required': prescription.manual_verification_required,
            'has_ocr_text': bool(prescription.ocr_text),
            'medication_count': prescription.medications.filter(is_active=True).count()
        }
        
        # Add real-time status updates if processing
        if prescription.processing_status == 'processing':
            status_update = OCRService.get_processing_status_update(prescription.id)
            status_data.update(status_update)
        
        return Response(status_data)
    
    @action(detail=True, methods=['post'])
    def retry_ocr(self, request, pk=None):
        """Retry OCR processing for failed prescriptions"""
        prescription = self.get_object()
        
        if prescription.processing_status not in ['failed', 'manual_review']:
            return Response(
                {'error': 'OCR retry is only available for failed or manual review prescriptions'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Reset status and retry
        prescription.processing_status = 'pending'
        prescription.save()
        
        # Process OCR using service
        result = PrescriptionService.process_prescription_ocr(prescription)
        
        serializer = OCRResultSerializer(data=result)
        serializer.is_valid(raise_exception=True)
        
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'])
    def validate_ocr(self, request, pk=None):
        """Manually validate OCR results"""
        prescription = self.get_object()
        
        if not prescription.ocr_text:
            return Response(
                {'error': 'No OCR text available for validation'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get validation data from request
        is_valid = request.data.get('is_valid', True)
        corrections = request.data.get('corrections', {})
        notes = request.data.get('notes', '')
        
        # Update prescription based on validation
        if is_valid:
            prescription.manual_verification_required = False
            prescription.processing_status = 'completed'
        else:
            # Apply corrections if provided
            if corrections:
                if 'doctor_name' in corrections:
                    prescription.doctor_name = corrections['doctor_name']
                if 'clinic_name' in corrections:
                    prescription.clinic_name = corrections['clinic_name']
                # Add more correction fields as needed
        
        prescription.save()
        
        return Response({
            'success': True,
            'message': 'OCR validation completed',
            'prescription_id': prescription.id,
            'status': prescription.processing_status,
            'manual_verification_required': prescription.manual_verification_required
        })


class MedicationViewSet(ModelViewSet):
    """CRUD operations for medications"""
    serializer_class = MedicationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = Medication.objects.filter(
            prescription__user=self.request.user,
            is_active=True
        ).select_related('prescription')
        
        # Filter by prescription
        prescription_id = self.request.query_params.get('prescription_id')
        if prescription_id:
            queryset = queryset.filter(prescription_id=prescription_id)
        
        # Search by medication name
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(name__icontains=search)
        
        return queryset
    
    def destroy(self, request, *args, **kwargs):
        """Soft delete medication"""
        instance = self.get_object()
        instance.is_active = False
        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)