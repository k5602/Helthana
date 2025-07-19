"""
Standardized Error Handling for Authentication System
Provides consistent error response formats and handling utilities
"""

from rest_framework import status
from rest_framework.response import Response
from django.utils import timezone
from django.core.exceptions import ValidationError
from rest_framework.serializers import ValidationError as DRFValidationError
import logging

logger = logging.getLogger(__name__)


class AuthErrorCodes:
    """Standardized error codes for authentication system"""
    
    # Authentication errors
    LOGIN_FAILED = 'LOGIN_FAILED'
    INVALID_CREDENTIALS = 'INVALID_CREDENTIALS'
    ACCOUNT_LOCKED = 'ACCOUNT_LOCKED'
    ACCOUNT_INACTIVE = 'ACCOUNT_INACTIVE'
    EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED'
    
    # Registration errors
    REGISTRATION_FAILED = 'REGISTRATION_FAILED'
    USERNAME_EXISTS = 'USERNAME_EXISTS'
    EMAIL_EXISTS = 'EMAIL_EXISTS'
    WEAK_PASSWORD = 'WEAK_PASSWORD'
    
    # Token errors
    INVALID_TOKEN = 'INVALID_TOKEN'
    EXPIRED_TOKEN = 'EXPIRED_TOKEN'
    TOKEN_REFRESH_FAILED = 'TOKEN_REFRESH_FAILED'
    REFRESH_TOKEN_REQUIRED = 'REFRESH_TOKEN_REQUIRED'
    INVALID_REFRESH_TOKEN = 'INVALID_REFRESH_TOKEN'
    
    # Password reset errors
    PASSWORD_RESET_FAILED = 'PASSWORD_RESET_FAILED'
    INVALID_RESET_TOKEN = 'INVALID_RESET_TOKEN'
    EXPIRED_RESET_TOKEN = 'EXPIRED_RESET_TOKEN'
    
    # Email verification errors
    EMAIL_VERIFICATION_FAILED = 'EMAIL_VERIFICATION_FAILED'
    INVALID_VERIFICATION_TOKEN = 'INVALID_VERIFICATION_TOKEN'
    EMAIL_SEND_FAILED = 'EMAIL_SEND_FAILED'
    EMAIL_REQUIRED = 'EMAIL_REQUIRED'
    
    # Profile management errors
    PROFILE_UPDATE_FAILED = 'PROFILE_UPDATE_FAILED'
    PASSWORD_CHANGE_FAILED = 'PASSWORD_CHANGE_FAILED'
    EMAIL_UPDATE_FAILED = 'EMAIL_UPDATE_FAILED'
    ACCOUNT_DELETION_FAILED = 'ACCOUNT_DELETION_FAILED'
    
    # Session management errors
    SESSION_EXPIRED = 'SESSION_EXPIRED'
    SESSION_INVALID = 'SESSION_INVALID'
    SESSION_TERMINATION_FAILED = 'SESSION_TERMINATION_FAILED'
    
    # Rate limiting errors
    RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED'
    TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS'
    
    # Server errors
    INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR'
    SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE'
    DATABASE_ERROR = 'DATABASE_ERROR'
    
    # Validation errors
    VALIDATION_ERROR = 'VALIDATION_ERROR'
    REQUIRED_FIELD_MISSING = 'REQUIRED_FIELD_MISSING'
    INVALID_FORMAT = 'INVALID_FORMAT'


class AuthErrorMessages:
    """User-friendly error messages"""
    
    ERROR_MESSAGES = {
        # Authentication messages
        AuthErrorCodes.LOGIN_FAILED: 'Login failed. Please check your credentials and try again.',
        AuthErrorCodes.INVALID_CREDENTIALS: 'Invalid username or password.',
        AuthErrorCodes.ACCOUNT_LOCKED: 'Your account has been temporarily locked due to multiple failed login attempts. Please try again later or reset your password.',
        AuthErrorCodes.ACCOUNT_INACTIVE: 'Your account is inactive. Please contact support for assistance.',
        AuthErrorCodes.EMAIL_NOT_VERIFIED: 'Please verify your email address before logging in.',
        
        # Registration messages
        AuthErrorCodes.REGISTRATION_FAILED: 'Registration failed. Please check your information and try again.',
        AuthErrorCodes.USERNAME_EXISTS: 'This username is already taken. Please choose a different one.',
        AuthErrorCodes.EMAIL_EXISTS: 'An account with this email address already exists.',
        AuthErrorCodes.WEAK_PASSWORD: 'Password must be at least 8 characters long and contain uppercase, lowercase, numbers, and special characters.',
        
        # Token messages
        AuthErrorCodes.INVALID_TOKEN: 'Invalid or expired token.',
        AuthErrorCodes.EXPIRED_TOKEN: 'Your session has expired. Please log in again.',
        AuthErrorCodes.TOKEN_REFRESH_FAILED: 'Failed to refresh your session. Please log in again.',
        AuthErrorCodes.REFRESH_TOKEN_REQUIRED: 'Refresh token is required.',
        AuthErrorCodes.INVALID_REFRESH_TOKEN: 'Invalid or expired refresh token.',
        
        # Password reset messages
        AuthErrorCodes.PASSWORD_RESET_FAILED: 'Failed to reset password. Please try again.',
        AuthErrorCodes.INVALID_RESET_TOKEN: 'Invalid or expired password reset token.',
        AuthErrorCodes.EXPIRED_RESET_TOKEN: 'Password reset link has expired. Please request a new one.',
        
        # Email verification messages
        AuthErrorCodes.EMAIL_VERIFICATION_FAILED: 'Failed to verify email address.',
        AuthErrorCodes.INVALID_VERIFICATION_TOKEN: 'Invalid or expired email verification token.',
        AuthErrorCodes.EMAIL_SEND_FAILED: 'Failed to send email. Please try again later.',
        AuthErrorCodes.EMAIL_REQUIRED: 'Email address is required.',
        
        # Profile management messages
        AuthErrorCodes.PROFILE_UPDATE_FAILED: 'Failed to update profile. Please check your information.',
        AuthErrorCodes.PASSWORD_CHANGE_FAILED: 'Failed to change password. Please check your current password.',
        AuthErrorCodes.EMAIL_UPDATE_FAILED: 'Failed to update email address.',
        AuthErrorCodes.ACCOUNT_DELETION_FAILED: 'Failed to delete account. Please verify your password.',
        
        # Session management messages
        AuthErrorCodes.SESSION_EXPIRED: 'Your session has expired. Please log in again.',
        AuthErrorCodes.SESSION_INVALID: 'Invalid session. Please log in again.',
        AuthErrorCodes.SESSION_TERMINATION_FAILED: 'Failed to terminate session.',
        
        # Rate limiting messages
        AuthErrorCodes.RATE_LIMIT_EXCEEDED: 'Too many requests. Please wait before trying again.',
        AuthErrorCodes.TOO_MANY_REQUESTS: 'You have made too many requests. Please wait a few minutes before trying again.',
        
        # Server messages
        AuthErrorCodes.INTERNAL_SERVER_ERROR: 'An internal server error occurred. Please try again later.',
        AuthErrorCodes.SERVICE_UNAVAILABLE: 'Service is temporarily unavailable. Please try again later.',
        AuthErrorCodes.DATABASE_ERROR: 'Database error occurred. Please try again later.',
        
        # Validation messages
        AuthErrorCodes.VALIDATION_ERROR: 'Please check your input and try again.',
        AuthErrorCodes.REQUIRED_FIELD_MISSING: 'Required field is missing.',
        AuthErrorCodes.INVALID_FORMAT: 'Invalid format provided.',
    }
    
    @classmethod
    def get_message(cls, error_code, default_message=None):
        """Get user-friendly message for error code"""
        return cls.ERROR_MESSAGES.get(error_code, default_message or 'An error occurred.')


class StandardizedErrorResponse:
    """Creates standardized error responses"""
    
    @staticmethod
    def create_error_response(
        error_code,
        message=None,
        details=None,
        status_code=status.HTTP_400_BAD_REQUEST,
        extra_data=None
    ):
        """
        Create a standardized error response
        
        Args:
            error_code: Error code from AuthErrorCodes
            message: Custom error message (optional)
            details: Additional error details (optional)
            status_code: HTTP status code
            extra_data: Additional data to include in response
        
        Returns:
            Response object with standardized error format
        """
        if not message:
            message = AuthErrorMessages.get_message(error_code)
        
        error_data = {
            'error': {
                'code': error_code,
                'message': message,
                'timestamp': timezone.now().isoformat()
            }
        }
        
        if details:
            error_data['error']['details'] = details
        
        if extra_data:
            error_data.update(extra_data)
        
        return Response(error_data, status=status_code)
    
    @staticmethod
    def create_validation_error_response(serializer_errors):
        """
        Create error response from serializer validation errors
        
        Args:
            serializer_errors: Serializer errors dict
        
        Returns:
            Response object with validation errors
        """
        return StandardizedErrorResponse.create_error_response(
            error_code=AuthErrorCodes.VALIDATION_ERROR,
            message='Please correct the following errors:',
            details=serializer_errors,
            status_code=status.HTTP_400_BAD_REQUEST
        )
    
    @staticmethod
    def create_authentication_error_response(error_code=None, message=None):
        """Create authentication-specific error response"""
        if not error_code:
            error_code = AuthErrorCodes.INVALID_CREDENTIALS
        
        return StandardizedErrorResponse.create_error_response(
            error_code=error_code,
            message=message,
            status_code=status.HTTP_401_UNAUTHORIZED
        )
    
    @staticmethod
    def create_permission_error_response(message=None):
        """Create permission denied error response"""
        return StandardizedErrorResponse.create_error_response(
            error_code=AuthErrorCodes.ACCOUNT_INACTIVE,
            message=message or 'You do not have permission to perform this action.',
            status_code=status.HTTP_403_FORBIDDEN
        )
    
    @staticmethod
    def create_server_error_response(error_code=None, message=None):
        """Create server error response"""
        if not error_code:
            error_code = AuthErrorCodes.INTERNAL_SERVER_ERROR
        
        return StandardizedErrorResponse.create_error_response(
            error_code=error_code,
            message=message,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


class AuthErrorHandler:
    """Handles different types of authentication errors"""
    
    @staticmethod
    def handle_login_error(exception, user=None):
        """Handle login-specific errors"""
        if user and hasattr(user, 'is_account_locked') and user.is_account_locked():
            return StandardizedErrorResponse.create_authentication_error_response(
                error_code=AuthErrorCodes.ACCOUNT_LOCKED
            )
        
        if user and not user.is_active:
            return StandardizedErrorResponse.create_authentication_error_response(
                error_code=AuthErrorCodes.ACCOUNT_INACTIVE
            )
        
        # Check email verification only if required by settings
        from django.conf import settings
        if (getattr(settings, 'REQUIRE_EMAIL_VERIFICATION', True) and 
            user and not user.email_verified):
            return StandardizedErrorResponse.create_authentication_error_response(
                error_code=AuthErrorCodes.EMAIL_NOT_VERIFIED
            )
        
        # Default to invalid credentials
        return StandardizedErrorResponse.create_authentication_error_response(
            error_code=AuthErrorCodes.INVALID_CREDENTIALS
        )
    
    @staticmethod
    def handle_registration_error(exception):
        """Handle registration-specific errors"""
        if isinstance(exception, (ValidationError, DRFValidationError)):
            if hasattr(exception, 'detail'):
                details = exception.detail
            else:
                details = {'non_field_errors': [str(exception)]}
            
            return StandardizedErrorResponse.create_validation_error_response(details)
        
        return StandardizedErrorResponse.create_error_response(
            error_code=AuthErrorCodes.REGISTRATION_FAILED,
            message=str(exception)
        )
    
    @staticmethod
    def handle_token_error(exception):
        """Handle token-related errors"""
        error_message = str(exception).lower()
        
        if 'expired' in error_message:
            return StandardizedErrorResponse.create_authentication_error_response(
                error_code=AuthErrorCodes.EXPIRED_TOKEN
            )
        
        if 'invalid' in error_message:
            return StandardizedErrorResponse.create_authentication_error_response(
                error_code=AuthErrorCodes.INVALID_TOKEN
            )
        
        return StandardizedErrorResponse.create_authentication_error_response(
            error_code=AuthErrorCodes.TOKEN_REFRESH_FAILED
        )
    
    @staticmethod
    def handle_password_reset_error(exception):
        """Handle password reset errors"""
        error_message = str(exception).lower()
        
        if 'expired' in error_message or 'invalid' in error_message:
            return StandardizedErrorResponse.create_error_response(
                error_code=AuthErrorCodes.INVALID_RESET_TOKEN
            )
        
        return StandardizedErrorResponse.create_error_response(
            error_code=AuthErrorCodes.PASSWORD_RESET_FAILED,
            message=str(exception)
        )
    
    @staticmethod
    def handle_email_verification_error(exception):
        """Handle email verification errors"""
        error_message = str(exception).lower()
        
        if 'expired' in error_message or 'invalid' in error_message:
            return StandardizedErrorResponse.create_error_response(
                error_code=AuthErrorCodes.INVALID_VERIFICATION_TOKEN
            )
        
        return StandardizedErrorResponse.create_error_response(
            error_code=AuthErrorCodes.EMAIL_VERIFICATION_FAILED,
            message=str(exception)
        )
    
    @staticmethod
    def handle_generic_error(exception, default_code=None):
        """Handle generic errors with appropriate response"""
        if isinstance(exception, (ValidationError, DRFValidationError)):
            if hasattr(exception, 'detail'):
                details = exception.detail
            else:
                details = {'non_field_errors': [str(exception)]}
            
            return StandardizedErrorResponse.create_validation_error_response(details)
        
        # Log the error for debugging
        logger.error(f"Unhandled authentication error: {str(exception)}", exc_info=True)
        
        return StandardizedErrorResponse.create_server_error_response(
            error_code=default_code or AuthErrorCodes.INTERNAL_SERVER_ERROR,
            message='An unexpected error occurred. Please try again later.'
        )


def handle_auth_exception(func):
    """
    Decorator to handle authentication exceptions consistently
    """
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except Exception as e:
            return AuthErrorHandler.handle_generic_error(e)
    
    return wrapper


class OfflineErrorHandler:
    """Handle offline-specific errors and responses"""
    
    @staticmethod
    def create_offline_response(action_attempted):
        """Create response for offline scenarios"""
        return {
            'error': {
                'code': 'OFFLINE_ERROR',
                'message': f'Unable to {action_attempted} while offline. Please check your connection and try again.',
                'offline': True,
                'timestamp': timezone.now().isoformat()
            }
        }
    
    @staticmethod
    def create_network_error_response():
        """Create response for network connectivity issues"""
        return {
            'error': {
                'code': 'NETWORK_ERROR',
                'message': 'Unable to connect to server. Please check your internet connection.',
                'network_error': True,
                'timestamp': timezone.now().isoformat()
            }
        }