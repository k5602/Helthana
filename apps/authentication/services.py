"""
Email service for authentication-related emails.
"""

import logging
from typing import Dict, Any
from django.core.mail import send_mail, EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils.html import strip_tags

User = get_user_model()
logger = logging.getLogger(__name__)


class EmailService:
    """
    Service class for handling authentication-related email operations.
    Supports both HTML and plain text emails with proper error handling.
    """
    
    @staticmethod
    def _send_email(
        subject: str,
        recipient_email: str,
        template_name: str,
        context: Dict[str, Any],
        from_email: str = None
    ) -> bool:
        """
        Internal method to send emails with HTML and plain text versions.
        
        Args:
            subject: Email subject line
            recipient_email: Recipient's email address
            template_name: Base template name (without extension)
            context: Template context variables
            from_email: Sender email (defaults to DEFAULT_FROM_EMAIL)
            
        Returns:
            bool: True if email sent successfully, False otherwise
        """
        try:
            from_email = from_email or settings.DEFAULT_FROM_EMAIL
            
            # Render HTML template
            html_template = f'authentication/emails/{template_name}.html'
            html_content = render_to_string(html_template, context)
            
            # Create plain text version by stripping HTML tags
            text_content = strip_tags(html_content)
            
            # Create email message
            email = EmailMultiAlternatives(
                subject=subject,
                body=text_content,
                from_email=from_email,
                to=[recipient_email]
            )
            
            # Attach HTML version
            email.attach_alternative(html_content, "text/html")
            
            # Send email
            email.send()
            
            logger.info(f"Email sent successfully to {recipient_email}: {subject}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email to {recipient_email}: {str(e)}")
            return False
    
    @classmethod
    def send_verification_email(cls, user: User, verification_token: str) -> bool:
        """
        Send email verification email to user.
        
        Args:
            user: User instance
            verification_token: Email verification token
            
        Returns:
            bool: True if email sent successfully
        """
        verification_url = f"{settings.FRONTEND_URL}/verify-email?token={verification_token}"
        
        context = {
            'user': user,
            'verification_url': verification_url,
            'site_name': 'Your Health Guide',
            'site_name_ar': 'دليلك الصحي',
        }
        
        subject = 'Verify Your Email Address - Your Health Guide'
        
        return cls._send_email(
            subject=subject,
            recipient_email=user.email,
            template_name='email_verification',
            context=context
        )
    
    @classmethod
    def send_password_reset_email(cls, user: User, reset_token: str) -> bool:
        """
        Send password reset email to user.
        
        Args:
            user: User instance
            reset_token: Password reset token
            
        Returns:
            bool: True if email sent successfully
        """
        reset_url = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"
        
        context = {
            'user': user,
            'reset_url': reset_url,
            'site_name': 'Your Health Guide',
            'site_name_ar': 'دليلك الصحي',
            'expiry_hours': 1,  # Token expires in 1 hour
        }
        
        subject = 'Reset Your Password - Your Health Guide'
        
        return cls._send_email(
            subject=subject,
            recipient_email=user.email,
            template_name='password_reset',
            context=context
        )
    
    @classmethod
    def send_security_notification(
        cls, 
        user: User, 
        event: str, 
        details: Dict[str, Any] = None, 
        recipient_email: str = None
    ) -> bool:
        """
        Send security notification email to user.
        
        Args:
            user: User instance
            event: Security event type (e.g., 'login', 'password_change', 'account_locked')
            details: Additional event details
            recipient_email: Optional different recipient email (for email change notifications)
            
        Returns:
            bool: True if email sent successfully
        """
        details = details or {}
        recipient_email = recipient_email or user.email
        
        # Map event types to user-friendly messages
        event_messages = {
            'login': 'New login to your account',
            'password_change': 'Password changed successfully',
            'account_locked': 'Account temporarily locked',
            'failed_login': 'Failed login attempts detected',
            'email_change_request': 'Email address change requested',
            'account_deletion': 'Account deletion completed',
        }
        
        event_message = event_messages.get(event, 'Security event')
        
        context = {
            'user': user,
            'event': event,
            'event_message': event_message,
            'details': details,
            'site_name': 'Your Health Guide',
            'site_name_ar': 'دليلك الصحي',
        }
        
        subject = f'Security Alert - {event_message}'
        
        return cls._send_email(
            subject=subject,
            recipient_email=recipient_email,
            template_name='security_notification',
            context=context
        )
    
    @classmethod
    def send_welcome_email(cls, user: User) -> bool:
        """
        Send welcome email to newly registered user.
        
        Args:
            user: User instance
            
        Returns:
            bool: True if email sent successfully
        """
        context = {
            'user': user,
            'site_name': 'Your Health Guide',
            'site_name_ar': 'دليلك الصحي',
            'dashboard_url': f"{settings.FRONTEND_URL}/dashboard.html",
        }
        
        subject = 'Welcome to Your Health Guide - دليلك الصحي'
        
        return cls._send_email(
            subject=subject,
            recipient_email=user.email,
            template_name='welcome',
            context=context
        )