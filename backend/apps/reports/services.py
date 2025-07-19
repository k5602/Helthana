import os
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from django.conf import settings
from django.core.files.base import ContentFile
from django.template.loader import render_to_string
from django.utils import timezone
from django.db.models import Q
from .models import HealthReport
from .chart_generator import ChartGenerator
from apps.vitals.models import VitalReading
from apps.prescriptions.models import Prescription


class ReportGenerationService:
    """Service class for generating PDF health reports"""

    @staticmethod
    def generate_report(
        user,
        report_type: str,
        date_from: datetime.date,
        date_to: datetime.date,
        title: Optional[str] = None,
        include_charts: bool = True,
        include_summary: bool = True,
        language: str = 'en'
    ) -> HealthReport:
        """Generate a PDF health report"""
        
        # Create report record
        if not title:
            report_type_display = dict(HealthReport._meta.get_field('report_type').choices)[report_type]
            title = f"{report_type_display} - {date_from} to {date_to}"
        
        report = HealthReport.objects.create(
            user=user,
            title=title,
            report_type=report_type,
            date_from=date_from,
            date_to=date_to
        )
        
        try:
            # Gather data based on report type
            report_data = ReportGenerationService._gather_report_data(
                user, report_type, date_from, date_to
            )
            
            # Generate HTML content
            html_content = ReportGenerationService._generate_html_content(
                report_data, report_type, include_charts, include_summary, language
            )
            
            # Generate PDF from HTML
            pdf_content = ReportGenerationService._generate_pdf_from_html(html_content)
            
            # Save PDF file
            filename = f"health_report_{report.id}_{timezone.now().strftime('%Y%m%d_%H%M%S')}.pdf"
            report.pdf_file.save(filename, ContentFile(pdf_content))
            report.save()
            
            return report
            
        except Exception as e:
            # Clean up failed report
            report.delete()
            raise Exception(f"Failed to generate report: {str(e)}")

    @staticmethod
    def _gather_report_data(user, report_type: str, date_from: datetime.date, date_to: datetime.date) -> Dict[str, Any]:
        """Gather data for the report based on type"""
        data = {
            'user': user,
            'report_type': report_type,
            'date_from': date_from,
            'date_to': date_to,
            'generated_at': timezone.now()
        }
        
        if report_type in ['vitals', 'comprehensive']:
            # Get vital readings
            vitals = VitalReading.objects.filter(
                user=user,
                recorded_at__date__gte=date_from,
                recorded_at__date__lte=date_to,
                is_active=True
            ).order_by('recorded_at')
            
            data['vitals'] = ReportGenerationService._process_vitals_data(vitals)
        
        if report_type in ['prescriptions', 'comprehensive']:
            # Get prescriptions (assuming Prescription model exists)
            try:
                prescriptions = Prescription.objects.filter(
                    user=user,
                    created_at__date__gte=date_from,
                    created_at__date__lte=date_to,
                    is_active=True
                ).order_by('created_at')
                
                data['prescriptions'] = ReportGenerationService._process_prescriptions_data(prescriptions)
            except:
                # Handle case where Prescription model might not exist yet
                data['prescriptions'] = {'items': [], 'summary': {}}
        
        return data

    @staticmethod
    def _process_vitals_data(vitals) -> Dict[str, Any]:
        """Process vital readings for report"""
        vitals_by_type = {}
        summary = {}
        
        for vital in vitals:
            if vital.vital_type not in vitals_by_type:
                vitals_by_type[vital.vital_type] = []
            
            vitals_by_type[vital.vital_type].append({
                'date': vital.recorded_at.date(),
                'time': vital.recorded_at.time(),
                'value': vital.value,
                'unit': vital.unit,
                'notes': vital.notes
            })
        
        # Generate summary statistics
        for vital_type, readings in vitals_by_type.items():
            summary[vital_type] = {
                'count': len(readings),
                'latest': readings[-1] if readings else None,
                'date_range': {
                    'first': readings[0]['date'] if readings else None,
                    'last': readings[-1]['date'] if readings else None
                }
            }
        
        return {
            'by_type': vitals_by_type,
            'summary': summary,
            'total_readings': sum(len(readings) for readings in vitals_by_type.values())
        }

    @staticmethod
    def _process_prescriptions_data(prescriptions) -> Dict[str, Any]:
        """Process prescriptions for report"""
        prescription_items = []
        
        for prescription in prescriptions:
            # Get medications for this prescription
            medications = []
            if hasattr(prescription, 'medications'):
                for medication in prescription.medications.filter(is_active=True):
                    medications.append({
                        'name': medication.name,
                        'dosage': medication.dosage,
                        'frequency': medication.frequency,
                        'duration': medication.duration,
                        'instructions': medication.instructions
                    })
            
            prescription_items.append({
                'date': prescription.prescription_date if hasattr(prescription, 'prescription_date') else prescription.created_at.date(),
                'medications': medications,
                'doctor_name': prescription.doctor_name,
                'clinic_name': getattr(prescription, 'clinic_name', ''),
                'notes': getattr(prescription, 'ocr_text', ''),
                'confidence_score': getattr(prescription, 'ai_confidence_score', 0.0)
            })
        
        return {
            'items': prescription_items,
            'summary': {
                'total_prescriptions': len(prescription_items),
                'total_medications': sum(len(item['medications']) for item in prescription_items),
                'date_range': {
                    'first': prescription_items[0]['date'] if prescription_items else None,
                    'last': prescription_items[-1]['date'] if prescription_items else None
                }
            }
        }

    @staticmethod
    def _generate_html_content(
        data: Dict[str, Any],
        report_type: str,
        include_charts: bool,
        include_summary: bool,
        language: str
    ) -> str:
        """Generate HTML content for the report"""
        
        template_name = f"reports/{report_type}_report.html"
        
        # Generate charts if requested
        charts = {}
        if include_charts:
            charts = ReportGenerationService._generate_charts(data, language)
        
        # Generate health insights
        insights = []
        if include_summary:
            insights = ChartGenerator.generate_health_insights(
                data.get('vitals', {}),
                data.get('prescriptions', {}),
                language
            )
        
        context = {
            **data,
            'include_charts': include_charts,
            'include_summary': include_summary,
            'language': language,
            'rtl': language == 'ar',
            'charts': charts,
            'health_insights': insights
        }
        
        try:
            return render_to_string(template_name, context)
        except Exception as e:
            print(f"Template rendering error: {e}")
            # Fallback to basic template
            return render_to_string("reports/basic_report.html", context)

    @staticmethod
    def _generate_pdf_from_html(html_content: str) -> bytes:
        """Generate PDF from HTML content using WeasyPrint"""
        try:
            # Try to use WeasyPrint if available
            from weasyprint import HTML, CSS
            from weasyprint.text.fonts import FontConfiguration
            
            # Configure fonts for Arabic support
            font_config = FontConfiguration()
            
            # Enhanced CSS for better PDF styling
            css_content = """
            @page {
                size: A4;
                margin: 2cm;
                @bottom-center {
                    content: "Page " counter(page) " of " counter(pages);
                    font-size: 10px;
                    color: #666;
                }
            }
            body {
                font-family: 'DejaVu Sans', Arial, sans-serif;
                font-size: 12px;
                line-height: 1.4;
                color: #2c3e50;
            }
            .header {
                text-align: center;
                border-bottom: 3px solid #3498db;
                padding-bottom: 15px;
                margin-bottom: 25px;
                background: #f8f9fa;
                padding: 20px;
                border-radius: 8px;
            }
            .section {
                margin-bottom: 25px;
                page-break-inside: avoid;
            }
            .section h2 {
                color: #2c3e50;
                border-bottom: 2px solid #3498db;
                padding-bottom: 8px;
                margin-bottom: 15px;
                page-break-after: avoid;
            }
            .vital-reading, .prescription-item {
                border: 1px solid #e1e8ed;
                padding: 12px;
                margin-bottom: 12px;
                border-radius: 4px;
                page-break-inside: avoid;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 15px;
                page-break-inside: avoid;
            }
            th, td {
                border: 1px solid #ddd;
                padding: 8px;
                text-align: left;
                font-size: 11px;
            }
            th {
                background-color: #3498db;
                color: white;
                font-weight: bold;
            }
            tr:nth-child(even) {
                background-color: #f8f9fa;
            }
            .summary-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
                margin-bottom: 20px;
            }
            .summary-card {
                background: #fff;
                border: 1px solid #e1e8ed;
                border-radius: 6px;
                padding: 15px;
                text-align: center;
                page-break-inside: avoid;
            }
            .chart-placeholder {
                background: #f8f9fa;
                border: 2px dashed #3498db;
                height: 150px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 15px 0;
                color: #3498db;
                font-style: italic;
                border-radius: 6px;
                page-break-inside: avoid;
            }
            .rtl {
                direction: rtl;
                text-align: right;
            }
            .rtl th, .rtl td {
                text-align: right;
            }
            .no-data {
                text-align: center;
                color: #7f8c8d;
                font-style: italic;
                padding: 30px;
                background: #f8f9fa;
                border-radius: 6px;
                border: 2px dashed #dee2e6;
            }
            .footer {
                margin-top: 30px;
                padding-top: 15px;
                border-top: 1px solid #bdc3c7;
                text-align: center;
                color: #7f8c8d;
                font-size: 10px;
            }
            """
            
            css = CSS(string=css_content, font_config=font_config)
            html_doc = HTML(string=html_content)
            
            return html_doc.write_pdf(stylesheets=[css], font_config=font_config)
            
        except ImportError as e:
            print(f"WeasyPrint not available: {e}")
            # Fallback: Generate a simple text-based PDF placeholder
            return ReportGenerationService._generate_fallback_pdf(html_content)
        except Exception as e:
            print(f"PDF generation error: {e}")
            # Fallback on any other error
            return ReportGenerationService._generate_fallback_pdf(html_content)

    @staticmethod
    def _generate_fallback_pdf(html_content: str) -> bytes:
        """Generate a simple PDF fallback when WeasyPrint is not available"""
        try:
            from reportlab.pdfgen import canvas
            from reportlab.lib.pagesizes import A4
            from io import BytesIO
            import html
            
            buffer = BytesIO()
            p = canvas.Canvas(buffer, pagesize=A4)
            
            # Simple text extraction from HTML
            text_content = html.unescape(html_content)
            # Remove HTML tags (basic cleanup)
            import re
            text_content = re.sub('<[^<]+?>', '', text_content)
            
            # Write text to PDF
            y_position = 750
            for line in text_content.split('\n')[:50]:  # Limit to 50 lines
                if line.strip():
                    p.drawString(50, y_position, line.strip()[:80])  # Limit line length
                    y_position -= 15
                    if y_position < 50:
                        break
            
            p.save()
            return buffer.getvalue()
            
        except ImportError:
            # Ultimate fallback: return a simple message as bytes
            message = f"Health Report Generated on {timezone.now().strftime('%Y-%m-%d %H:%M:%S')}\n\nPDF generation libraries not available."
            return message.encode('utf-8')

    @staticmethod
    def create_sharing_link(report: HealthReport, expires_in_hours: int = 24) -> Dict[str, Any]:
        """Create a temporary sharing link for a report"""
        sharing_token = str(uuid.uuid4())
        expires_at = timezone.now() + timedelta(hours=expires_in_hours)
        
        # In a real implementation, you'd store this in a database table
        # For now, we'll return the structure
        sharing_data = {
            'sharing_token': sharing_token,
            'sharing_url': f"/api/v1/reports/shared/{sharing_token}/",
            'expires_at': expires_at,
            'access_count': 0,
            'max_access_count': 10
        }
        
        return sharing_data

    @staticmethod
    def get_available_templates() -> List[Dict[str, Any]]:
        """Get list of available report templates"""
        templates = [
            {
                'template_id': 'vitals_basic',
                'name': 'Basic Vitals Report',
                'description': 'Simple overview of vital signs with charts',
                'report_type': 'vitals',
                'supported_languages': ['en', 'ar'],
                'required_data_types': ['vitals']
            },
            {
                'template_id': 'vitals_detailed',
                'name': 'Detailed Vitals Report',
                'description': 'Comprehensive vitals analysis with trends',
                'report_type': 'vitals',
                'supported_languages': ['en', 'ar'],
                'required_data_types': ['vitals']
            },
            {
                'template_id': 'prescriptions_basic',
                'name': 'Prescription History',
                'description': 'List of prescriptions and medications',
                'report_type': 'prescriptions',
                'supported_languages': ['en', 'ar'],
                'required_data_types': ['prescriptions']
            },
            {
                'template_id': 'comprehensive',
                'name': 'Comprehensive Health Report',
                'description': 'Complete health overview with all data',
                'report_type': 'comprehensive',
                'supported_languages': ['en', 'ar'],
                'required_data_types': ['vitals', 'prescriptions']
            }
        ]
        
        return templates

    @staticmethod
    def schedule_report(user, schedule_config: Dict[str, Any]) -> Dict[str, Any]:
        """Schedule automatic report generation"""
        schedule_id = str(uuid.uuid4())
        
        # In a real implementation, this would integrate with Celery or similar
        # For now, return the schedule configuration
        schedule_data = {
            'schedule_id': schedule_id,
            'user_id': user.id,
            'created_at': timezone.now(),
            'next_run': ReportGenerationService._calculate_next_run(schedule_config),
            **schedule_config
        }
        
        return schedule_data

    @staticmethod
    def _calculate_next_run(schedule_config: Dict[str, Any]) -> datetime:
        """Calculate next scheduled run time"""
        now = timezone.now()
        frequency = schedule_config.get('frequency', 'monthly')
        time_of_day = schedule_config.get('time_of_day', '09:00:00')
        
        # Parse time
        hour, minute, second = map(int, time_of_day.split(':'))
        
        if frequency == 'daily':
            next_run = now.replace(hour=hour, minute=minute, second=second, microsecond=0)
            if next_run <= now:
                next_run += timedelta(days=1)
        elif frequency == 'weekly':
            day_of_week = schedule_config.get('day_of_week', 1)  # Monday
            days_ahead = day_of_week - now.weekday()
            if days_ahead <= 0:
                days_ahead += 7
            next_run = now + timedelta(days=days_ahead)
            next_run = next_run.replace(hour=hour, minute=minute, second=second, microsecond=0)
        elif frequency == 'monthly':
            day_of_month = schedule_config.get('day_of_month', 1)
            next_run = now.replace(day=day_of_month, hour=hour, minute=minute, second=second, microsecond=0)
            if next_run <= now:
                # Move to next month
                if next_run.month == 12:
                    next_run = next_run.replace(year=next_run.year + 1, month=1)
                else:
                    next_run = next_run.replace(month=next_run.month + 1)
        else:  # quarterly
            # Move to next quarter
            current_quarter = (now.month - 1) // 3 + 1
            next_quarter = current_quarter + 1 if current_quarter < 4 else 1
            next_year = now.year if next_quarter > current_quarter else now.year + 1
            next_month = (next_quarter - 1) * 3 + 1
            
            next_run = datetime(next_year, next_month, 1, hour, minute, second)
            next_run = timezone.make_aware(next_run)
        
        return next_run

    @staticmethod
    def _generate_charts(data: Dict[str, Any], language: str = 'en') -> Dict[str, str]:
        """Generate charts for the report"""
        charts = {}
        
        # Generate vitals charts
        if data.get('vitals') and data['vitals'].get('by_type'):
            vitals_data = data['vitals']['by_type']
            
            # Generate individual vital type charts
            for vital_type, readings in vitals_data.items():
                if readings:
                    chart_key = f"vitals_{vital_type}"
                    charts[chart_key] = ChartGenerator.generate_vitals_trend_chart(
                        vital_type, readings, language
                    )
            
            # Generate summary chart
            if len(vitals_data) > 1:
                charts['vitals_summary'] = ChartGenerator.generate_vitals_summary_chart(
                    vitals_data, language
                )
        
        # Generate prescription charts
        if data.get('prescriptions') and data['prescriptions'].get('items'):
            prescription_items = data['prescriptions']['items']
            if prescription_items:
                charts['prescriptions_timeline'] = ChartGenerator.generate_prescription_timeline_chart(
                    prescription_items, language
                )
        
        return charts