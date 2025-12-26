"""
Management command to test PDF report generation
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from datetime import datetime, timedelta
from apps.reports.services import ReportGenerationService

User = get_user_model()


class Command(BaseCommand):
    help = 'Test PDF report generation system'

    def add_arguments(self, parser):
        parser.add_argument(
            '--user-id',
            type=int,
            help='User ID to generate report for (optional)',
        )
        parser.add_argument(
            '--report-type',
            type=str,
            default='comprehensive',
            choices=['vitals', 'prescriptions', 'comprehensive'],
            help='Type of report to generate',
        )

    def handle(self, *args, **options):
        self.stdout.write('Testing PDF report generation system...')
        
        # Get or create a test user
        if options['user_id']:
            try:
                user = User.objects.get(id=options['user_id'])
            except User.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f'User with ID {options["user_id"]} not found')
                )
                return
        else:
            user, created = User.objects.get_or_create(
                username='test_report_user',
                defaults={
                    'email': 'test@example.com',
                    'first_name': 'Test',
                    'last_name': 'User'
                }
            )
            if created:
                self.stdout.write('Created test user for report generation')
        
        # Set date range (last 30 days)
        date_to = datetime.now().date()
        date_from = date_to - timedelta(days=30)
        
        try:
            # Test report generation
            self.stdout.write(f'Generating {options["report_type"]} report for user: {user.username}')
            
            report = ReportGenerationService.generate_report(
                user=user,
                report_type=options['report_type'],
                date_from=date_from,
                date_to=date_to,
                title=f'Test {options["report_type"].title()} Report',
                include_charts=True,
                include_summary=True,
                language='en'
            )
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully generated report: {report.title}'
                )
            )
            self.stdout.write(f'Report ID: {report.id}')
            self.stdout.write(f'PDF file: {report.pdf_file.name if report.pdf_file else "No file"}')
            self.stdout.write(f'Created at: {report.created_at}')
            
            # Test template availability
            templates = ReportGenerationService.get_available_templates()
            self.stdout.write(f'\nAvailable templates: {len(templates)}')
            for template in templates:
                self.stdout.write(f'  - {template["name"]} ({template["template_id"]})')
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Failed to generate report: {str(e)}')
            )
            import traceback
            self.stdout.write(traceback.format_exc())