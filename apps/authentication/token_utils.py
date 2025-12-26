"""
Token management utilities for cleanup and maintenance operations.
"""
from datetime import timedelta
from typing import Dict, List
from django.utils import timezone
from django.db.models import Q
from django.core.management.base import BaseCommand
from .models import User
from .tokens import (
    email_verification_token_generator,
    password_reset_token_generator
)


class TokenCleanupService:
    """
    Service class for managing token cleanup operations.
    """
    
    def cleanup_expired_email_verification_tokens(self) -> Dict[str, int]:
        """
        Clean up expired email verification tokens from user records.
        
        Returns:
            Dict[str, int]: Statistics about cleanup operation
        """
        stats = {
            'total_checked': 0,
            'expired_found': 0,
            'cleaned_up': 0,
            'errors': 0
        }
        
        # Find users with email verification tokens
        users_with_tokens = User.objects.filter(
            email_verification_token__isnull=False
        ).exclude(email_verification_token='')
        
        stats['total_checked'] = users_with_tokens.count()
        
        for user in users_with_tokens:
            try:
                token = user.email_verification_token
                
                # Check if token is expired
                if email_verification_token_generator.is_token_expired(token):
                    stats['expired_found'] += 1
                    
                    # Clear the expired token
                    user.email_verification_token = ''
                    user.save(update_fields=['email_verification_token'])
                    
                    stats['cleaned_up'] += 1
                    
            except Exception as e:
                stats['errors'] += 1
                # Log error in production
                print(f"Error cleaning email verification token for user {user.id}: {e}")
        
        return stats
    
    def cleanup_expired_password_reset_tokens(self) -> Dict[str, int]:
        """
        Clean up expired password reset tokens from user records.
        
        Returns:
            Dict[str, int]: Statistics about cleanup operation
        """
        stats = {
            'total_checked': 0,
            'expired_found': 0,
            'cleaned_up': 0,
            'errors': 0
        }
        
        # Find users with password reset tokens
        users_with_tokens = User.objects.filter(
            Q(password_reset_token__isnull=False) &
            ~Q(password_reset_token='')
        )
        
        stats['total_checked'] = users_with_tokens.count()
        
        for user in users_with_tokens:
            try:
                token = user.password_reset_token
                expiry_time = user.password_reset_expires
                
                # Check if token is expired by expiry time or token validation
                is_expired = False
                
                if expiry_time and timezone.now() > expiry_time:
                    is_expired = True
                elif password_reset_token_generator.is_token_expired(token):
                    is_expired = True
                
                if is_expired:
                    stats['expired_found'] += 1
                    
                    # Clear the expired token and expiry time
                    user.password_reset_token = ''
                    user.password_reset_expires = None
                    user.save(update_fields=['password_reset_token', 'password_reset_expires'])
                    
                    stats['cleaned_up'] += 1
                    
            except Exception as e:
                stats['errors'] += 1
                # Log error in production
                print(f"Error cleaning password reset token for user {user.id}: {e}")
        
        return stats
    
    def cleanup_locked_accounts(self) -> Dict[str, int]:
        """
        Clean up accounts that are no longer locked (unlock expired locks).
        
        Returns:
            Dict[str, int]: Statistics about cleanup operation
        """
        stats = {
            'total_checked': 0,
            'unlocked': 0,
            'errors': 0
        }
        
        # Find users with account lock expiry times
        locked_users = User.objects.filter(
            account_locked_until__isnull=False,
            account_locked_until__lt=timezone.now()
        )
        
        stats['total_checked'] = locked_users.count()
        
        try:
            # Unlock accounts where lock time has expired
            updated_count = locked_users.update(
                account_locked_until=None,
                failed_login_attempts=0
            )
            stats['unlocked'] = updated_count
            
        except Exception as e:
            stats['errors'] += 1
            print(f"Error unlocking expired accounts: {e}")
        
        return stats
    
    def cleanup_all_expired_tokens(self) -> Dict[str, Dict[str, int]]:
        """
        Run all token cleanup operations.
        
        Returns:
            Dict[str, Dict[str, int]]: Combined statistics from all cleanup operations
        """
        results = {
            'email_verification': self.cleanup_expired_email_verification_tokens(),
            'password_reset': self.cleanup_expired_password_reset_tokens(),
            'account_locks': self.cleanup_locked_accounts()
        }
        
        return results


class TokenValidationService:
    """
    Service class for token validation operations.
    """
    
    def validate_email_verification_token(self, user: User, token: str) -> Dict[str, any]:
        """
        Validate an email verification token for a user.
        
        Args:
            user: User instance to validate token for
            token: Token string to validate
            
        Returns:
            Dict[str, any]: Validation result with status and details
        """
        result = {
            'valid': False,
            'expired': False,
            'error': None
        }
        
        try:
            # Check if token matches user's stored token
            if user.email_verification_token != token:
                result['error'] = 'Token does not match user record'
                return result
            
            # Check if token is expired
            if email_verification_token_generator.is_token_expired(token):
                result['expired'] = True
                result['error'] = 'Token has expired'
                return result
            
            # Validate token authenticity
            if email_verification_token_generator.validate_token(user, token):
                result['valid'] = True
            else:
                result['error'] = 'Token is invalid or corrupted'
                
        except Exception as e:
            result['error'] = f'Validation error: {str(e)}'
        
        return result
    
    def validate_password_reset_token(self, user: User, token: str) -> Dict[str, any]:
        """
        Validate a password reset token for a user.
        
        Args:
            user: User instance to validate token for
            token: Token string to validate
            
        Returns:
            Dict[str, any]: Validation result with status and details
        """
        result = {
            'valid': False,
            'expired': False,
            'error': None
        }
        
        try:
            # Check if token matches user's stored token
            if user.password_reset_token != token:
                result['error'] = 'Token does not match user record'
                return result
            
            # Check expiry time if set
            if user.password_reset_expires and timezone.now() > user.password_reset_expires:
                result['expired'] = True
                result['error'] = 'Token has expired'
                return result
            
            # Validate token authenticity
            if password_reset_token_generator.validate_token_with_expiry(user, token):
                result['valid'] = True
            else:
                result['error'] = 'Token is invalid or corrupted'
                
        except Exception as e:
            result['error'] = f'Validation error: {str(e)}'
        
        return result


# Global service instances
token_cleanup_service = TokenCleanupService()
token_validation_service = TokenValidationService()


def cleanup_expired_tokens() -> Dict[str, Dict[str, int]]:
    """
    Convenience function to run all token cleanup operations.
    
    Returns:
        Dict[str, Dict[str, int]]: Combined cleanup statistics
    """
    return token_cleanup_service.cleanup_all_expired_tokens()


def validate_user_email_token(user: User, token: str) -> bool:
    """
    Convenience function to validate email verification token.
    
    Args:
        user: User instance
        token: Token to validate
        
    Returns:
        bool: True if token is valid
    """
    result = token_validation_service.validate_email_verification_token(user, token)
    return result['valid']


def validate_user_password_reset_token(user: User, token: str) -> bool:
    """
    Convenience function to validate password reset token.
    
    Args:
        user: User instance
        token: Token to validate
        
    Returns:
        bool: True if token is valid
    """
    result = token_validation_service.validate_password_reset_token(user, token)
    return result['valid']