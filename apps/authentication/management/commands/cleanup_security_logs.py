"""
Management command to clean up old security audit logs and expired tokens
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.conf import settings
from datetime import timedelta

from apps.authentication.models import SecurityAuditLog, User


class Command(BaseCommand):
    help = 'Clean up old security audit logs and expired tokens'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=getattr(settings, 'SECURITY_AUDIT_LOG_RETENTION_DAYS', 90),
            help='Number of days to retain security audit logs (default: 90)'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be deleted without actually deleting'
        )

    def handle(self, *args, **options):
        days = options['days']
        dry_run = options['dry_run']
        
        cutoff_date = timezone.now() - timedelta(days=days)
        
        # Clean up old security audit logs
        old_logs = SecurityAuditLog.objects.filter(timestamp__lt=cutoff_date)
        log_count = old_logs.count()
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING(f'DRY RUN: Would delete {log_count} security audit logs older than {days} days')
            )
        else:
            deleted_logs, _ = old_logs.delete()
            self.stdout.write(
                self.style.SUCCESS(f'Deleted {deleted_logs} security audit logs older than {days} days')
            )
        
        # Clean up expired password reset tokens
        expired_reset_tokens = User.objects.filter(
            password_reset_expires__lt=timezone.now(),
            password_reset_token__isnull=False
        ).exclude(password_reset_token='')
        
        reset_token_count = expired_reset_tokens.count()
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING(f'DRY RUN: Would clear {reset_token_count} expired password reset tokens')
            )
        else:
            expired_reset_tokens.update(
                password_reset_token='',
                password_reset_expires=None
            )
            self.stdout.write(
                self.style.SUCCESS(f'Cleared {reset_token_count} expired password reset tokens')
            )
        
        # Clean up expired account lockouts
        expired_lockouts = User.objects.filter(
            account_locked_until__lt=timezone.now()
        )
        
        lockout_count = expired_lockouts.count()
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING(f'DRY RUN: Would unlock {lockout_count} accounts with expired lockouts')
            )
        else:
            expired_lockouts.update(
                account_locked_until=None,
                failed_login_attempts=0
            )
            self.stdout.write(
                self.style.SUCCESS(f'Unlocked {lockout_count} accounts with expired lockouts')
            )
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING('This was a dry run. Use without --dry-run to actually perform cleanup.')
            )