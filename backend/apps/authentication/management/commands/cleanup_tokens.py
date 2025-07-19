"""
Django management command for cleaning up expired authentication tokens.
"""
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone
from apps.authentication.token_utils import token_cleanup_service


class Command(BaseCommand):
    help = 'Clean up expired authentication tokens and unlock expired account locks'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be cleaned up without making changes',
        )
        parser.add_argument(
            '--email-only',
            action='store_true',
            help='Only clean up email verification tokens',
        )
        parser.add_argument(
            '--password-only',
            action='store_true',
            help='Only clean up password reset tokens',
        )
        parser.add_argument(
            '--accounts-only',
            action='store_true',
            help='Only unlock expired account locks',
        )
        parser.add_argument(
            '--verbose',
            action='store_true',
            help='Show detailed output',
        )
    
    def handle(self, *args, **options):
        start_time = timezone.now()
        
        self.stdout.write(
            self.style.SUCCESS(f'Starting token cleanup at {start_time}')
        )
        
        if options['dry_run']:
            self.stdout.write(
                self.style.WARNING('DRY RUN MODE - No changes will be made')
            )
        
        try:
            # Determine which cleanup operations to run
            run_email = not (options['password_only'] or options['accounts_only'])
            run_password = not (options['email_only'] or options['accounts_only'])
            run_accounts = not (options['email_only'] or options['password_only'])
            
            results = {}
            
            # Clean up email verification tokens
            if run_email:
                if options['verbose']:
                    self.stdout.write('Cleaning up email verification tokens...')
                
                if not options['dry_run']:
                    results['email_verification'] = token_cleanup_service.cleanup_expired_email_verification_tokens()
                else:
                    # For dry run, just count what would be cleaned
                    results['email_verification'] = self._dry_run_email_cleanup()
                
                self._report_email_cleanup(results['email_verification'], options['verbose'])
            
            # Clean up password reset tokens
            if run_password:
                if options['verbose']:
                    self.stdout.write('Cleaning up password reset tokens...')
                
                if not options['dry_run']:
                    results['password_reset'] = token_cleanup_service.cleanup_expired_password_reset_tokens()
                else:
                    # For dry run, just count what would be cleaned
                    results['password_reset'] = self._dry_run_password_cleanup()
                
                self._report_password_cleanup(results['password_reset'], options['verbose'])
            
            # Clean up account locks
            if run_accounts:
                if options['verbose']:
                    self.stdout.write('Unlocking expired account locks...')
                
                if not options['dry_run']:
                    results['account_locks'] = token_cleanup_service.cleanup_locked_accounts()
                else:
                    # For dry run, just count what would be unlocked
                    results['account_locks'] = self._dry_run_account_cleanup()
                
                self._report_account_cleanup(results['account_locks'], options['verbose'])
            
            # Summary
            end_time = timezone.now()
            duration = end_time - start_time
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'Token cleanup completed in {duration.total_seconds():.2f} seconds'
                )
            )
            
            # Overall statistics
            if options['verbose']:
                self._report_summary(results)
                
        except Exception as e:
            raise CommandError(f'Token cleanup failed: {str(e)}')
    
    def _dry_run_email_cleanup(self):
        """Simulate email token cleanup for dry run."""
        from apps.authentication.models import User
        from apps.authentication.tokens import email_verification_token_generator
        
        stats = {'total_checked': 0, 'expired_found': 0, 'cleaned_up': 0, 'errors': 0}
        
        users_with_tokens = User.objects.filter(
            email_verification_token__isnull=False
        ).exclude(email_verification_token='')
        
        stats['total_checked'] = users_with_tokens.count()
        
        for user in users_with_tokens:
            try:
                if email_verification_token_generator.is_token_expired(user.email_verification_token):
                    stats['expired_found'] += 1
                    stats['cleaned_up'] += 1  # Would be cleaned up
            except Exception:
                stats['errors'] += 1
        
        return stats
    
    def _dry_run_password_cleanup(self):
        """Simulate password reset token cleanup for dry run."""
        from apps.authentication.models import User
        from apps.authentication.tokens import password_reset_token_generator
        from django.db.models import Q
        
        stats = {'total_checked': 0, 'expired_found': 0, 'cleaned_up': 0, 'errors': 0}
        
        users_with_tokens = User.objects.filter(
            Q(password_reset_token__isnull=False) &
            ~Q(password_reset_token='')
        )
        
        stats['total_checked'] = users_with_tokens.count()
        
        for user in users_with_tokens:
            try:
                is_expired = False
                if user.password_reset_expires and timezone.now() > user.password_reset_expires:
                    is_expired = True
                elif password_reset_token_generator.is_token_expired(user.password_reset_token):
                    is_expired = True
                
                if is_expired:
                    stats['expired_found'] += 1
                    stats['cleaned_up'] += 1  # Would be cleaned up
            except Exception:
                stats['errors'] += 1
        
        return stats
    
    def _dry_run_account_cleanup(self):
        """Simulate account unlock for dry run."""
        from apps.authentication.models import User
        
        stats = {'total_checked': 0, 'unlocked': 0, 'errors': 0}
        
        locked_users = User.objects.filter(
            account_locked_until__isnull=False,
            account_locked_until__lt=timezone.now()
        )
        
        stats['total_checked'] = locked_users.count()
        stats['unlocked'] = stats['total_checked']  # Would all be unlocked
        
        return stats
    
    def _report_email_cleanup(self, stats, verbose):
        """Report email verification token cleanup results."""
        if verbose:
            self.stdout.write(f"  Email verification tokens checked: {stats['total_checked']}")
            self.stdout.write(f"  Expired tokens found: {stats['expired_found']}")
            self.stdout.write(f"  Tokens cleaned up: {stats['cleaned_up']}")
            if stats['errors'] > 0:
                self.stdout.write(
                    self.style.WARNING(f"  Errors encountered: {stats['errors']}")
                )
        else:
            self.stdout.write(f"Email verification: {stats['cleaned_up']} tokens cleaned up")
    
    def _report_password_cleanup(self, stats, verbose):
        """Report password reset token cleanup results."""
        if verbose:
            self.stdout.write(f"  Password reset tokens checked: {stats['total_checked']}")
            self.stdout.write(f"  Expired tokens found: {stats['expired_found']}")
            self.stdout.write(f"  Tokens cleaned up: {stats['cleaned_up']}")
            if stats['errors'] > 0:
                self.stdout.write(
                    self.style.WARNING(f"  Errors encountered: {stats['errors']}")
                )
        else:
            self.stdout.write(f"Password reset: {stats['cleaned_up']} tokens cleaned up")
    
    def _report_account_cleanup(self, stats, verbose):
        """Report account unlock results."""
        if verbose:
            self.stdout.write(f"  Locked accounts checked: {stats['total_checked']}")
            self.stdout.write(f"  Accounts unlocked: {stats['unlocked']}")
            if stats['errors'] > 0:
                self.stdout.write(
                    self.style.WARNING(f"  Errors encountered: {stats['errors']}")
                )
        else:
            self.stdout.write(f"Account locks: {stats['unlocked']} accounts unlocked")
    
    def _report_summary(self, results):
        """Report overall summary statistics."""
        self.stdout.write('\n' + '='*50)
        self.stdout.write('CLEANUP SUMMARY')
        self.stdout.write('='*50)
        
        total_operations = 0
        total_errors = 0
        
        for operation, stats in results.items():
            if operation == 'email_verification':
                total_operations += stats['cleaned_up']
                total_errors += stats['errors']
            elif operation == 'password_reset':
                total_operations += stats['cleaned_up']
                total_errors += stats['errors']
            elif operation == 'account_locks':
                total_operations += stats['unlocked']
                total_errors += stats['errors']
        
        self.stdout.write(f"Total operations completed: {total_operations}")
        if total_errors > 0:
            self.stdout.write(
                self.style.WARNING(f"Total errors encountered: {total_errors}")
            )
        
        self.stdout.write('='*50)