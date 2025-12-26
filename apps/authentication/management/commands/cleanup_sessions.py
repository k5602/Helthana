"""
Management command to clean up expired sessions and tokens
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.authentication.session_service import SessionManager
from apps.authentication.models import UserSession, SecurityAuditLog


class Command(BaseCommand):
    help = 'Clean up expired sessions and old security logs'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=90,
            help='Number of days to keep security logs (default: 90)'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be cleaned up without actually doing it'
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        log_retention_days = options['days']
        
        self.stdout.write(
            self.style.SUCCESS(f'Starting session and log cleanup (dry_run={dry_run})')
        )
        
        # Clean up expired sessions
        expired_sessions = UserSession.objects.filter(
            expires_at__lt=timezone.now(),
            is_active=True
        )
        
        expired_count = expired_sessions.count()
        self.stdout.write(f'Found {expired_count} expired sessions')
        
        if not dry_run and expired_count > 0:
            for session in expired_sessions:
                SessionManager.terminate_session(session, reason='session_expired')
            self.stdout.write(
                self.style.SUCCESS(f'✓ Cleaned up {expired_count} expired sessions')
            )
        
        # Clean up old security logs
        cutoff_date = timezone.now() - timezone.timedelta(days=log_retention_days)
        old_logs = SecurityAuditLog.objects.filter(timestamp__lt=cutoff_date)
        
        old_logs_count = old_logs.count()
        self.stdout.write(f'Found {old_logs_count} old security logs (older than {log_retention_days} days)')
        
        if not dry_run and old_logs_count > 0:
            old_logs.delete()
            self.stdout.write(
                self.style.SUCCESS(f'✓ Cleaned up {old_logs_count} old security logs')
            )
        
        # Clean up inactive sessions older than 30 days
        inactive_cutoff = timezone.now() - timezone.timedelta(days=30)
        inactive_sessions = UserSession.objects.filter(
            last_activity__lt=inactive_cutoff,
            is_active=False
        )
        
        inactive_count = inactive_sessions.count()
        self.stdout.write(f'Found {inactive_count} old inactive sessions')
        
        if not dry_run and inactive_count > 0:
            inactive_sessions.delete()
            self.stdout.write(
                self.style.SUCCESS(f'✓ Cleaned up {inactive_count} old inactive sessions')
            )
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING('This was a dry run. No actual cleanup was performed.')
            )
        else:
            self.stdout.write(
                self.style.SUCCESS('Session and log cleanup completed successfully!')
            )