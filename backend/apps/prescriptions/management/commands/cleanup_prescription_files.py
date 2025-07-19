"""
Django management command to clean up orphaned prescription files
"""
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone
from health_guide.utils.file_upload import FileCleanupManager


class Command(BaseCommand):
    help = 'Clean up orphaned prescription files and manage storage'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days-old',
            type=int,
            default=7,
            help='Delete files older than this many days (default: 7)'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be deleted without actually deleting'
        )
        parser.add_argument(
            '--show-usage',
            action='store_true',
            help='Show storage usage statistics'
        )

    def handle(self, *args, **options):
        days_old = options['days_old']
        dry_run = options['dry_run']
        show_usage = options['show_usage']

        self.stdout.write(
            self.style.SUCCESS(f'Starting file cleanup process...')
        )

        if show_usage:
            self.show_storage_usage()

        if not dry_run:
            # Perform actual cleanup
            result = FileCleanupManager.cleanup_orphaned_files(days_old)
            
            if result['success']:
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Cleanup completed successfully!'
                    )
                )
                self.stdout.write(f'Files deleted: {result["deleted_count"]}')
                
                if result['deleted_files']:
                    self.stdout.write('Deleted files:')
                    for file_path in result['deleted_files']:
                        self.stdout.write(f'  - {file_path}')
                
                if result.get('errors'):
                    self.stdout.write(
                        self.style.WARNING('Errors encountered:')
                    )
                    for error in result['errors']:
                        self.stdout.write(f'  - {error}')
            else:
                self.stdout.write(
                    self.style.ERROR(f'Cleanup failed: {result["error"]}')
                )
        else:
            self.stdout.write(
                self.style.WARNING(
                    f'DRY RUN: Would delete files older than {days_old} days'
                )
            )

    def show_storage_usage(self):
        """Show storage usage statistics"""
        usage = FileCleanupManager.get_storage_usage()
        
        if usage['success']:
            self.stdout.write(
                self.style.SUCCESS('Storage Usage Statistics:')
            )
            self.stdout.write(f'Total files: {usage["file_count"]}')
            self.stdout.write(f'Total size: {usage["total_size_formatted"]}')
            self.stdout.write(f'Total size (bytes): {usage["total_size_bytes"]}')
        else:
            self.stdout.write(
                self.style.ERROR(f'Failed to get storage usage: {usage["error"]}')
            )