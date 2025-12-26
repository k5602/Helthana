from django.db.models import Q
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from apps.shared.views import FilterByDateMixin, SoftDeleteViewMixin

from .models import Medication, Prescription
from .serializers import (
    MedicationSerializer,
    OCRResultSerializer,
    PrescriptionCreateSerializer,
    PrescriptionSerializer,
)
from .services import PrescriptionService


class PrescriptionViewSet(ModelViewSet, FilterByDateMixin, SoftDeleteViewMixin):
    """Complete CRUD operations for prescriptions"""
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    date_filter_start_field = "prescription_date__gte"
    date_filter_end_field = "prescription_date__lte"
    url_start_date_variable = 'date_from'
    url_end_date_variable = 'date_to'

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Prescription.objects.none()
        queryset = Prescription.objects.filter(user=self.request.user, is_active=True)
        doctor_name = self.request.query_params.get('doctor_name')

        if doctor_name:
            queryset = queryset.filter(doctor_name__icontains=doctor_name)

        clinic_name = self.request.query_params.get('clinic_name')
        if clinic_name:
            queryset = queryset.filter(clinic_name__icontains=clinic_name)

        queryset = self._filter_by_date_range(queryset)

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
        request.data.get('notes', '')

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

    @action(detail=True, methods=['post'])
    def upload_image(self, request, pk=None):
        """Upload or replace prescription image with progress tracking"""
        prescription = self.get_object()

        if 'image' not in request.FILES:
            return Response(
                {'error': 'No image file provided'},
                status=status.HTTP_400_BAD_REQUEST
            )

        uploaded_file = request.FILES['image']

        try:
            # Process and save image with comprehensive validation
            result = PrescriptionService.process_and_save_image(request.user.id, uploaded_file)

            if not result['success']:
                return Response({
                    'error': 'Image upload failed',
                    'details': result.get('errors', [result.get('error', 'Unknown error')]),
                    'warnings': result.get('warnings', [])
                }, status=status.HTTP_400_BAD_REQUEST)

            # Delete old image if exists
            if prescription.image:
                PrescriptionService.delete_prescription_image(prescription)

            # Update prescription with new image
            prescription.image = result['file_path']
            prescription.processing_status = 'pending'  # Reset processing status
            prescription.is_processed = False
            prescription.ocr_text = ''
            prescription.ai_confidence_score = 0.0
            prescription.manual_verification_required = False
            prescription.save()

            return Response({
                'success': True,
                'message': 'Image uploaded successfully',
                'prescription_id': prescription.id,
                'file_info': {
                    'file_url': result['file_url'],
                    'file_size': result['file_size'],
                    'content_type': result['content_type'],
                    'compression_ratio': result.get('compression_ratio', 0)
                },
                'warnings': result.get('warnings', [])
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                'error': f'Image upload failed: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['delete'])
    def delete_image(self, request, pk=None):
        """Delete prescription image"""
        prescription = self.get_object()

        result = PrescriptionService.delete_prescription_image(prescription)

        if result['success']:
            return Response({
                'success': True,
                'message': 'Image deleted successfully'
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'error': result['error']
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def storage_usage(self, request):
        """Get user's storage usage statistics"""
        usage = PrescriptionService.get_user_storage_usage(request.user.id)

        if usage['success']:
            return Response({
                'storage_usage': {
                    'total_size_bytes': usage['total_size_bytes'],
                    'total_size_formatted': usage['total_size_formatted'],
                    'file_count': usage['file_count']
                }
            })
        else:
            return Response({
                'error': usage['error']
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'])
    def cleanup_files(self, request):
        """Clean up old prescription files"""
        days_old = request.data.get('days_old', 30)

        if not isinstance(days_old, int) or days_old < 1:
            return Response({
                'error': 'days_old must be a positive integer'
            }, status=status.HTTP_400_BAD_REQUEST)

        result = PrescriptionService.cleanup_user_files(request.user.id, days_old)

        if result['success']:
            return Response({
                'success': True,
                'message': f'Cleanup completed. Deleted {result["deleted_count"]} files.',
                'deleted_files': result['deleted_files'],
                'errors': result.get('errors', [])
            })
        else:
            return Response({
                'error': result['error']
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'])
    def validate_upload(self, request):
        """Validate file before upload (pre-upload validation)"""
        if 'image' not in request.FILES:
            return Response({
                'error': 'No image file provided'
            }, status=status.HTTP_400_BAD_REQUEST)

        uploaded_file = request.FILES['image']
        validation_result = PrescriptionService.validate_image_upload(uploaded_file)

        return Response({
            'valid': validation_result['valid'],
            'errors': validation_result.get('errors', []),
            'warnings': validation_result.get('warnings', []),
            'file_info': {
                'filename': validation_result.get('safe_filename', uploaded_file.name),
                'size': validation_result.get('file_size', uploaded_file.size),
                'content_type': validation_result.get('content_type', uploaded_file.content_type)
            }
        })


class MedicationViewSet(ModelViewSet, SoftDeleteViewMixin):
    """CRUD operations for medications"""
    serializer_class = MedicationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Medication.objects.none()
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
