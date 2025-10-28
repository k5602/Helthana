from rest_framework import status
from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.http import HttpResponse, Http404
from django.utils import timezone
from datetime import datetime
from .models import HealthReport
from .serializers import HealthReportSerializer, ReportGenerationSerializer
from .services import ReportGenerationService
from shared.views import SoftDeleteViewMixin, FilterByDateMixin


class HealthReportViewSet(ModelViewSet, SoftDeleteViewMixin, FilterByDateMixin):
    """ViewSet for managing health reports with PDF generation"""
    serializer_class = HealthReportSerializer
    permission_classes = [IsAuthenticated]
    date_filter_start_field = "date_from__gte"
    date_filter_end_field = "date_to__lte"

    def get_queryset(self):
        """Get user's active reports with optional filtering"""
        queryset = HealthReport.objects.filter(user=self.request.user, is_active=True)
        
        # Filter by report type
        report_type = self.request.query_params.get('type')
        if report_type:
            queryset = queryset.filter(report_type=report_type)
        
        # Filter by date range (if provided)
        queryset = self._filter_by_date_range(queryset)
        
        return queryset.order_by('-created_at')
    

    @action(detail=False, methods=['post'])
    def generate(self, request):
        """Generate a new PDF report"""
        try:
            serializer = ReportGenerationSerializer(data=request.data)
            if not serializer.is_valid():
                return Response(
                    {'error': 'Invalid data', 'details': serializer.errors},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Generate the report
            report = ReportGenerationService.generate_report(
                user=request.user,
                report_type=serializer.validated_data['report_type'],
                date_from=serializer.validated_data['date_from'],
                date_to=serializer.validated_data['date_to'],
                title=serializer.validated_data.get('title'),
                include_charts=serializer.validated_data.get('include_charts', True),
                include_summary=serializer.validated_data.get('include_summary', True)
            )
            
            response_serializer = HealthReportSerializer(report)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to generate report: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """Download PDF report"""
        try:
            report = self.get_object()
            
            if not report.pdf_file:
                return Response(
                    {'error': 'PDF file not available'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Serve the PDF file
            response = HttpResponse(
                report.pdf_file.read(),
                content_type='application/pdf'
            )
            response['Content-Disposition'] = f'attachment; filename="{report.title}.pdf"'
            return response
            
        except Exception as e:
            return Response(
                {'error': f'Failed to download report: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['get'])
    def preview(self, request, pk=None):
        """Preview PDF report in browser"""
        try:
            report = self.get_object()
            
            if not report.pdf_file:
                return Response(
                    {'error': 'PDF file not available'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Serve the PDF file for inline viewing
            response = HttpResponse(
                report.pdf_file.read(),
                content_type='application/pdf'
            )
            response['Content-Disposition'] = f'inline; filename="{report.title}.pdf"'
            return response
            
        except Exception as e:
            return Response(
                {'error': f'Failed to preview report: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def share(self, request, pk=None):
        """Generate shareable link for report"""
        try:
            report = self.get_object()
            
            # Generate temporary sharing token
            sharing_data = ReportGenerationService.create_sharing_link(
                report=report,
                expires_in_hours=request.data.get('expires_in_hours', 24)
            )
            
            return Response(sharing_data)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to create sharing link: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def templates(self, request):
        """Get available report templates"""
        try:
            templates = ReportGenerationService.get_available_templates()
            return Response(templates)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to get templates: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'])
    def schedule(self, request):
        """Schedule automatic report generation"""
        try:
            # This would integrate with a task queue like Celery
            schedule_data = ReportGenerationService.schedule_report(
                user=request.user,
                schedule_config=request.data
            )
            
            return Response(schedule_data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to schedule report: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )