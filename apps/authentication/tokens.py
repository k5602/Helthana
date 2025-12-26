"""
Custom token generators for email verification and password reset functionality.
"""
import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Tuple
from django.conf import settings
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils import timezone
from django.utils.http import base36_to_int, int_to_base36
from .models import User


class EmailVerificationTokenGenerator:
    """
    Custom token generator for email verification.
    Generates secure tokens with expiration handling.
    """
    
    def __init__(self):
        self.token_lifetime = timedelta(hours=24)  # 24 hours expiration
    
    def generate_token(self, user: User) -> str:
        """
        Generate a secure token for email verification.
        
        Args:
            user: User instance for whom to generate the token
            
        Returns:
            str: Secure token string
        """
        # Generate a random token
        token = secrets.token_urlsafe(32)
        
        # Create a hash that includes user info and timestamp
        timestamp = int(timezone.now().timestamp())
        user_data = f"{user.id}:{user.email}:{timestamp}"
        
        # Create HMAC-like signature
        secret_key = getattr(settings, 'SECRET_KEY', 'default-secret')
        signature = hashlib.sha256(
            f"{token}:{user_data}:{secret_key}".encode()
        ).hexdigest()[:16]
        
        # Combine token with timestamp and signature
        full_token = f"{token}:{int_to_base36(timestamp)}:{signature}"
        
        return full_token
    
    def validate_token(self, user: User, token: str) -> bool:
        """
        Validate an email verification token.
        
        Args:
            user: User instance to validate token for
            token: Token string to validate
            
        Returns:
            bool: True if token is valid and not expired
        """
        try:
            # Parse token components
            parts = token.split(':')
            if len(parts) != 3:
                return False
            
            token_part, timestamp_b36, signature = parts
            
            # Decode timestamp
            timestamp = base36_to_int(timestamp_b36)
            token_time = timezone.make_aware(datetime.fromtimestamp(timestamp))
            
            # Check if token has expired
            if timezone.now() - token_time > self.token_lifetime:
                return False
            
            # Recreate signature to verify authenticity
            user_data = f"{user.id}:{user.email}:{timestamp}"
            secret_key = getattr(settings, 'SECRET_KEY', 'default-secret')
            expected_signature = hashlib.sha256(
                f"{token_part}:{user_data}:{secret_key}".encode()
            ).hexdigest()[:16]
            
            # Compare signatures
            return signature == expected_signature
            
        except (ValueError, TypeError, OverflowError):
            return False
    
    def is_token_expired(self, token: str) -> bool:
        """
        Check if a token has expired without validating user.
        
        Args:
            token: Token string to check
            
        Returns:
            bool: True if token is expired
        """
        try:
            parts = token.split(':')
            if len(parts) != 3:
                return True
            
            timestamp_b36 = parts[1]
            timestamp = base36_to_int(timestamp_b36)
            token_time = timezone.make_aware(datetime.fromtimestamp(timestamp))
            
            return timezone.now() - token_time > self.token_lifetime
            
        except (ValueError, TypeError, OverflowError):
            return True


class PasswordResetTokenGenerator(PasswordResetTokenGenerator):
    """
    Enhanced password reset token generator with custom expiration and validation.
    Extends Django's built-in PasswordResetTokenGenerator.
    """
    
    def __init__(self):
        super().__init__()
        self.token_lifetime = timedelta(hours=1)  # 1 hour expiration
    
    def generate_token_with_expiry(self, user: User) -> Tuple[str, datetime]:
        """
        Generate a password reset token with explicit expiry time.
        
        Args:
            user: User instance for whom to generate the token
            
        Returns:
            Tuple[str, datetime]: Token string and expiry datetime
        """
        # Generate base token using Django's generator
        base_token = self.make_token(user)
        
        # Add timestamp for expiration tracking
        timestamp = int(timezone.now().timestamp())
        
        # Create enhanced token with timestamp
        enhanced_token = f"{base_token}:{int_to_base36(timestamp)}"
        
        # Calculate expiry time
        expiry_time = timezone.now() + self.token_lifetime
        
        return enhanced_token, expiry_time
    
    def validate_token_with_expiry(self, user: User, token: str) -> bool:
        """
        Validate a password reset token including expiration check.
        
        Args:
            user: User instance to validate token for
            token: Enhanced token string to validate
            
        Returns:
            bool: True if token is valid and not expired
        """
        try:
            # Parse enhanced token
            if ':' not in token:
                # Fallback to standard validation for simple tokens
                return self.check_token(user, token)
            
            parts = token.split(':')
            if len(parts) < 2:
                return False
            
            # Extract base token and timestamp
            base_token = ':'.join(parts[:-1])
            timestamp_b36 = parts[-1]
            
            # Decode timestamp
            timestamp = base36_to_int(timestamp_b36)
            token_time = timezone.make_aware(datetime.fromtimestamp(timestamp))
            
            # Check if token has expired
            if timezone.now() - token_time > self.token_lifetime:
                return False
            
            # Validate base token using Django's method
            return self.check_token(user, base_token)
            
        except (ValueError, TypeError, OverflowError):
            return False
    
    def is_token_expired(self, token: str) -> bool:
        """
        Check if a password reset token has expired.
        
        Args:
            token: Enhanced token string to check
            
        Returns:
            bool: True if token is expired
        """
        try:
            if ':' not in token:
                # For simple tokens without timestamp, consider them malformed/expired
                # unless they look like valid Django tokens
                if len(token) < 10:  # Too short to be a valid token
                    return True
                return False  # Assume valid Django token
            
            parts = token.split(':')
            if len(parts) < 2:
                return True
            
            timestamp_b36 = parts[-1]
            timestamp = base36_to_int(timestamp_b36)
            token_time = timezone.make_aware(datetime.fromtimestamp(timestamp))
            
            return timezone.now() - token_time > self.token_lifetime
            
        except (ValueError, TypeError, OverflowError):
            return True


# Global instances for easy import
email_verification_token_generator = EmailVerificationTokenGenerator()
password_reset_token_generator = PasswordResetTokenGenerator()