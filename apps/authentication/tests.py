"""
Tests for authentication app.
"""

from django.test import TestCase, override_settings
from django.core import mail
from django.contrib.auth import get_user_model
from apps.authentication.services import EmailService

User = get_user_model()


class EmailServiceTestCase(TestCase):
    """Test cases for EmailService functionality."""
    
    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            first_name='Test',
            last_name='User'
        )
    
    @override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend')
    def test_send_verification_email(self):
        """Test sending verification email."""
        # Clear any existing emails
        mail.outbox = []
        
        # Send verification email
        result = EmailService.send_verification_email(
            user=self.user,
            verification_token='test-token-123'
        )
        
        # Assert email was sent successfully
        self.assertTrue(result)
        self.assertEqual(len(mail.outbox), 1)
        
        # Check email content
        email = mail.outbox[0]
        self.assertEqual(email.to, ['test@example.com'])
        self.assertIn('Verify Your Email Address', email.subject)
        self.assertIn('test-token-123', email.body)
        self.assertIn('Your Health Guide', email.body)
    
    @override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend')
    def test_send_password_reset_email(self):
        """Test sending password reset email."""
        # Clear any existing emails
        mail.outbox = []
        
        # Send password reset email
        result = EmailService.send_password_reset_email(
            user=self.user,
            reset_token='reset-token-456'
        )
        
        # Assert email was sent successfully
        self.assertTrue(result)
        self.assertEqual(len(mail.outbox), 1)
        
        # Check email content
        email = mail.outbox[0]
        self.assertEqual(email.to, ['test@example.com'])
        self.assertIn('Reset Your Password', email.subject)
        self.assertIn('reset-token-456', email.body)
        self.assertIn('Your Health Guide', email.body)
    
    @override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend')
    def test_send_security_notification(self):
        """Test sending security notification email."""
        # Clear any existing emails
        mail.outbox = []
        
        # Send security notification
        result = EmailService.send_security_notification(
            user=self.user,
            event='login',
            details={'ip_address': '192.168.1.1', 'user_agent': 'Test Browser'}
        )
        
        # Assert email was sent successfully
        self.assertTrue(result)
        self.assertEqual(len(mail.outbox), 1)
        
        # Check email content
        email = mail.outbox[0]
        self.assertEqual(email.to, ['test@example.com'])
        self.assertIn('Security Alert', email.subject)
        self.assertIn('login', email.body)
        self.assertIn('Your Health Guide', email.body)
    
    @override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend')
    def test_send_welcome_email(self):
        """Test sending welcome email."""
        # Clear any existing emails
        mail.outbox = []
        
        # Send welcome email
        result = EmailService.send_welcome_email(user=self.user)
        
        # Assert email was sent successfully
        self.assertTrue(result)
        self.assertEqual(len(mail.outbox), 1)
        
        # Check email content
        email = mail.outbox[0]
        self.assertEqual(email.to, ['test@example.com'])
        self.assertIn('Welcome to Your Health Guide', email.subject)
        self.assertIn('Welcome', email.body)
        self.assertIn('دليلك الصحي', email.body)
    
    def test_email_failure_handling(self):
        """Test email service handles failures gracefully."""
        # Test with invalid email configuration to simulate failure
        with override_settings(
            EMAIL_BACKEND='django.core.mail.backends.smtp.EmailBackend',
            EMAIL_HOST='invalid-smtp-server.example.com',
            EMAIL_PORT=587,
            EMAIL_USE_TLS=True,
            EMAIL_HOST_USER='invalid@example.com',
            EMAIL_HOST_PASSWORD='invalid-password'
        ):
            result = EmailService.send_verification_email(
                user=self.user,
                verification_token='test-token'
            )
            
            # Should return False but not raise an exception
            self.assertFalse(result)