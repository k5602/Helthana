"""
Tests for security middleware functionality
"""
import json
import time
from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.conf import settings
from unittest.mock import patch

from .models import SecurityAuditLog

User = get_user_model()


class SecurityMiddlewareTestCase(TestCase):
    """Test cases for security middleware"""
    
    def setUp(self):
        """Set up test data"""
        self.client = Client()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='TestPass123!'
        )
        self.login_url = reverse('login')
        
        # Clear cache before each test
        cache.clear()
    
    def test_security_audit_logging(self):
        """Test that security events are logged"""
        # Clear existing logs
        SecurityAuditLog.objects.all().delete()
        
        # Attempt login
        response = self.client.post(self.login_url, {
            'username': 'testuser',
            'password': 'TestPass123!'
        }, content_type='application/json')
        
        # Check that security log was created
        logs = SecurityAuditLog.objects.filter(user=self.user)
        self.assertTrue(logs.exists())
        
        log = logs.first()
        self.assertEqual(log.action, 'login')
        self.assertTrue(log.success)
        self.assertIsNotNone(log.ip_address)
    
    def test_failed_login_logging(self):
        """Test that failed login attempts are logged"""
        # Clear existing logs
        SecurityAuditLog.objects.all().delete()
        
        # Attempt login with wrong password
        response = self.client.post(self.login_url, {
            'username': 'testuser',
            'password': 'wrongpassword'
        }, content_type='application/json')
        
        # Check that failed login was logged
        logs = SecurityAuditLog.objects.filter(user=self.user, action='login_failed')
        self.assertTrue(logs.exists())
        
        log = logs.first()
        self.assertEqual(log.action, 'login_failed')
        self.assertFalse(log.success)
    
    def test_rate_limiting(self):
        """Test rate limiting functionality"""
        # Make multiple rapid requests to trigger rate limiting
        for i in range(12):  # Exceed the limit of 10 requests per 15 minutes
            response = self.client.post(self.login_url, {
                'username': 'testuser',
                'password': 'wrongpassword'
            }, content_type='application/json')
        
        # The last request should be rate limited
        self.assertEqual(response.status_code, 429)
        
        response_data = json.loads(response.content)
        self.assertEqual(response_data['error']['code'], 'RATE_LIMIT_EXCEEDED')
    
    def test_account_lockout(self):
        """Test account lockout after failed attempts"""
        # Reset user's failed attempts
        self.user.failed_login_attempts = 0
        self.user.account_locked_until = None
        self.user.save()
        
        # Make 7 failed login attempts
        for i in range(7):
            response = self.client.post(self.login_url, {
                'username': 'testuser',
                'password': 'wrongpassword'
            }, content_type='application/json')
        
        # Refresh user from database
        self.user.refresh_from_db()
        
        # Check that account is locked
        self.assertTrue(self.user.is_account_locked())
        
        # Next login attempt should return account locked error
        response = self.client.post(self.login_url, {
            'username': 'testuser',
            'password': 'TestPass123!'  # Correct password
        }, content_type='application/json')
        
        self.assertEqual(response.status_code, 423)  # HTTP 423 Locked
        
        response_data = json.loads(response.content)
        self.assertEqual(response_data['error']['code'], 'ACCOUNT_LOCKED')
    
    def test_security_headers(self):
        """Test that security headers are added"""
        response = self.client.get('/')
        
        # Check security headers
        self.assertEqual(response.get('X-Content-Type-Options'), 'nosniff')
        self.assertEqual(response.get('X-Frame-Options'), 'DENY')
        self.assertEqual(response.get('X-XSS-Protection'), '1; mode=block')
        self.assertEqual(response.get('Referrer-Policy'), 'strict-origin-when-cross-origin')
    
    def test_ip_tracking(self):
        """Test IP address tracking"""
        # Clear existing logs
        SecurityAuditLog.objects.all().delete()
        
        # Login with different IP addresses
        response = self.client.post(self.login_url, {
            'username': 'testuser',
            'password': 'TestPass123!'
        }, content_type='application/json', HTTP_X_FORWARDED_FOR='192.168.1.1')
        
        # Check that IP was tracked
        logs = SecurityAuditLog.objects.filter(user=self.user, action='login')
        self.assertTrue(logs.exists())
        
        log = logs.first()
        self.assertEqual(log.ip_address, '192.168.1.1')
    
    @patch('apps.authentication.services.EmailService.send_security_notification')
    def test_security_notification_sent(self, mock_send_notification):
        """Test that security notifications are sent"""
        # Successful login should trigger security notification
        response = self.client.post(self.login_url, {
            'username': 'testuser',
            'password': 'TestPass123!'
        }, content_type='application/json')
        
        # Check that security notification was called
        mock_send_notification.assert_called_once()
        
        # Check the call arguments
        call_args = mock_send_notification.call_args
        self.assertEqual(call_args[1]['user'], self.user)
        self.assertEqual(call_args[1]['event'], 'login')
    
    def test_rate_limit_bypass_with_different_clients(self):
        """Test that rate limiting is per client, not global"""
        # Make requests from first client
        for i in range(10):
            response = self.client.post(self.login_url, {
                'username': 'testuser',
                'password': 'wrongpassword'
            }, content_type='application/json')
        
        # Create second client with different IP
        client2 = Client()
        response = client2.post(self.login_url, {
            'username': 'testuser',
            'password': 'wrongpassword'
        }, content_type='application/json', HTTP_X_FORWARDED_FOR='192.168.1.2')
        
        # Second client should not be rate limited
        self.assertNotEqual(response.status_code, 429)
    
    def tearDown(self):
        """Clean up after tests"""
        cache.clear()


class SecurityAuditLogViewTestCase(TestCase):
    """Test cases for security audit log view"""
    
    def setUp(self):
        """Set up test data"""
        self.client = Client()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='TestPass123!'
        )
        
        # Create some security logs
        SecurityAuditLog.objects.create(
            user=self.user,
            action='login',
            ip_address='127.0.0.1',
            user_agent='Test Agent',
            success=True
        )
        SecurityAuditLog.objects.create(
            user=self.user,
            action='password_change',
            ip_address='127.0.0.1',
            user_agent='Test Agent',
            success=True
        )
    
    def test_security_logs_view_authenticated(self):
        """Test that authenticated users can view their security logs"""
        # Login user
        self.client.force_login(self.user)
        
        # Get security logs
        response = self.client.get(reverse('security_logs'))
        
        self.assertEqual(response.status_code, 200)
        
        response_data = json.loads(response.content)
        self.assertIn('results', response_data)
        self.assertEqual(len(response_data['results']), 2)
    
    def test_security_logs_view_unauthenticated(self):
        """Test that unauthenticated users cannot view security logs"""
        response = self.client.get(reverse('security_logs'))
        
        self.assertEqual(response.status_code, 401)
    
    def test_security_logs_view_only_own_logs(self):
        """Test that users can only see their own security logs"""
        # Create another user with logs
        other_user = User.objects.create_user(
            username='otheruser',
            email='other@example.com',
            password='OtherPass123!'
        )
        SecurityAuditLog.objects.create(
            user=other_user,
            action='login',
            ip_address='127.0.0.1',
            user_agent='Test Agent',
            success=True
        )
        
        # Login as first user
        self.client.force_login(self.user)
        
        # Get security logs
        response = self.client.get(reverse('security_logs'))
        
        self.assertEqual(response.status_code, 200)
        
        response_data = json.loads(response.content)
        # Should only see own logs (2), not other user's log
        self.assertEqual(len(response_data['results']), 2)
        
        # Verify all logs belong to the current user
        for log in response_data['results']:
            self.assertEqual(log['user_display'], self.user.username)