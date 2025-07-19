"""
Tests for token management system.
"""
import time
from datetime import timedelta
from django.test import TestCase
from django.utils import timezone
from django.contrib.auth import get_user_model
from .tokens import (
    email_verification_token_generator,
    password_reset_token_generator
)
from .token_utils import (
    token_cleanup_service,
    token_validation_service,
    validate_user_email_token,
    validate_user_password_reset_token
)

User = get_user_model()


class EmailVerificationTokenTest(TestCase):
    """Test email verification token generation and validation."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    def test_generate_token(self):
        """Test token generation."""
        token = email_verification_token_generator.generate_token(self.user)
        
        self.assertIsInstance(token, str)
        self.assertGreater(len(token), 20)  # Should be reasonably long
        self.assertIn(':', token)  # Should contain separators
    
    def test_validate_valid_token(self):
        """Test validation of valid token."""
        token = email_verification_token_generator.generate_token(self.user)
        
        is_valid = email_verification_token_generator.validate_token(self.user, token)
        self.assertTrue(is_valid)
    
    def test_validate_invalid_token(self):
        """Test validation of invalid token."""
        invalid_token = "invalid:token:here"
        
        is_valid = email_verification_token_generator.validate_token(self.user, invalid_token)
        self.assertFalse(is_valid)
    
    def test_validate_token_wrong_user(self):
        """Test validation of token for wrong user."""
        other_user = User.objects.create_user(
            username='otheruser',
            email='other@example.com',
            password='testpass123'
        )
        
        token = email_verification_token_generator.generate_token(self.user)
        
        is_valid = email_verification_token_generator.validate_token(other_user, token)
        self.assertFalse(is_valid)
    
    def test_token_expiration_check(self):
        """Test token expiration detection."""
        # Create a token with manipulated timestamp to simulate expiration
        token = email_verification_token_generator.generate_token(self.user)
        
        # Token should not be expired immediately
        is_expired = email_verification_token_generator.is_token_expired(token)
        self.assertFalse(is_expired)
        
        # Test with malformed token
        malformed_token = "malformed"
        is_expired = email_verification_token_generator.is_token_expired(malformed_token)
        self.assertTrue(is_expired)


class PasswordResetTokenTest(TestCase):
    """Test password reset token generation and validation."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    def test_generate_token_with_expiry(self):
        """Test token generation with expiry."""
        token, expiry_time = password_reset_token_generator.generate_token_with_expiry(self.user)
        
        self.assertIsInstance(token, str)
        self.assertIsInstance(expiry_time, timezone.datetime)
        self.assertGreater(len(token), 20)
        self.assertGreater(expiry_time, timezone.now())
    
    def test_validate_valid_token(self):
        """Test validation of valid token."""
        token, _ = password_reset_token_generator.generate_token_with_expiry(self.user)
        
        is_valid = password_reset_token_generator.validate_token_with_expiry(self.user, token)
        self.assertTrue(is_valid)
    
    def test_validate_invalid_token(self):
        """Test validation of invalid token."""
        invalid_token = "invalid:token"
        
        is_valid = password_reset_token_generator.validate_token_with_expiry(self.user, invalid_token)
        self.assertFalse(is_valid)
    
    def test_token_expiration_check(self):
        """Test token expiration detection."""
        token, _ = password_reset_token_generator.generate_token_with_expiry(self.user)
        
        # Token should not be expired immediately
        is_expired = password_reset_token_generator.is_token_expired(token)
        self.assertFalse(is_expired)
        
        # Test with malformed token
        malformed_token = "malformed"
        is_expired = password_reset_token_generator.is_token_expired(malformed_token)
        self.assertTrue(is_expired)


class UserTokenMethodsTest(TestCase):
    """Test User model token-related methods."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    def test_generate_email_verification_token(self):
        """Test user method for generating email verification token."""
        token = self.user.generate_email_verification_token()
        
        self.assertIsInstance(token, str)
        self.assertEqual(self.user.email_verification_token, token)
        
        # Refresh from database
        self.user.refresh_from_db()
        self.assertEqual(self.user.email_verification_token, token)
    
    def test_generate_password_reset_token(self):
        """Test user method for generating password reset token."""
        token, expiry_time = self.user.generate_password_reset_token()
        
        self.assertIsInstance(token, str)
        self.assertIsInstance(expiry_time, timezone.datetime)
        self.assertEqual(self.user.password_reset_token, token)
        self.assertEqual(self.user.password_reset_expires, expiry_time)
        
        # Refresh from database
        self.user.refresh_from_db()
        self.assertEqual(self.user.password_reset_token, token)
        self.assertEqual(self.user.password_reset_expires, expiry_time)
    
    def test_verify_email_token(self):
        """Test email token verification."""
        token = self.user.generate_email_verification_token()
        
        # Initially email should not be verified
        self.assertFalse(self.user.email_verified)
        
        # Verify token
        result = self.user.verify_email_token(token)
        self.assertTrue(result)
        
        # Email should now be verified and token cleared
        self.assertTrue(self.user.email_verified)
        self.assertEqual(self.user.email_verification_token, '')
    
    def test_verify_invalid_email_token(self):
        """Test verification of invalid email token."""
        self.user.generate_email_verification_token()
        
        result = self.user.verify_email_token('invalid_token')
        self.assertFalse(result)
        self.assertFalse(self.user.email_verified)
    
    def test_verify_password_reset_token(self):
        """Test password reset token verification."""
        token, _ = self.user.generate_password_reset_token()
        
        result = self.user.verify_password_reset_token(token)
        self.assertTrue(result)
    
    def test_clear_password_reset_token(self):
        """Test clearing password reset token."""
        self.user.generate_password_reset_token()
        
        # Token should be set
        self.assertNotEqual(self.user.password_reset_token, '')
        self.assertIsNotNone(self.user.password_reset_expires)
        
        # Clear token
        self.user.clear_password_reset_token()
        
        # Token should be cleared
        self.assertEqual(self.user.password_reset_token, '')
        self.assertIsNone(self.user.password_reset_expires)
    
    def test_account_locking(self):
        """Test account locking functionality."""
        # Initially account should not be locked
        self.assertFalse(self.user.is_account_locked())
        
        # Lock account
        self.user.lock_account(duration_minutes=30)
        self.assertTrue(self.user.is_account_locked())
        
        # Unlock account
        self.user.unlock_account()
        self.assertFalse(self.user.is_account_locked())
        self.assertEqual(self.user.failed_login_attempts, 0)
    
    def test_failed_login_attempts(self):
        """Test failed login attempts tracking."""
        # Initially no failed attempts
        self.assertEqual(self.user.failed_login_attempts, 0)
        
        # Increment attempts
        locked = self.user.increment_failed_login_attempts(max_attempts=3)
        self.assertFalse(locked)
        self.assertEqual(self.user.failed_login_attempts, 1)
        
        # Increment to threshold
        self.user.increment_failed_login_attempts(max_attempts=3)
        locked = self.user.increment_failed_login_attempts(max_attempts=3)
        self.assertTrue(locked)
        self.assertTrue(self.user.is_account_locked())
        
        # Reset attempts
        self.user.reset_failed_login_attempts()
        self.assertEqual(self.user.failed_login_attempts, 0)


class TokenCleanupServiceTest(TestCase):
    """Test token cleanup service functionality."""
    
    def setUp(self):
        self.user1 = User.objects.create_user(
            username='user1',
            email='user1@example.com',
            password='testpass123'
        )
        self.user2 = User.objects.create_user(
            username='user2',
            email='user2@example.com',
            password='testpass123'
        )
    
    def test_cleanup_email_verification_tokens(self):
        """Test cleanup of email verification tokens."""
        # Generate tokens for users
        self.user1.generate_email_verification_token()
        self.user2.generate_email_verification_token()
        
        # Run cleanup (should not clean up valid tokens)
        stats = token_cleanup_service.cleanup_expired_email_verification_tokens()
        
        self.assertEqual(stats['total_checked'], 2)
        self.assertEqual(stats['cleaned_up'], 0)  # No expired tokens
    
    def test_cleanup_password_reset_tokens(self):
        """Test cleanup of password reset tokens."""
        # Generate tokens for users
        self.user1.generate_password_reset_token()
        self.user2.generate_password_reset_token()
        
        # Run cleanup (should not clean up valid tokens)
        stats = token_cleanup_service.cleanup_expired_password_reset_tokens()
        
        self.assertEqual(stats['total_checked'], 2)
        self.assertEqual(stats['cleaned_up'], 0)  # No expired tokens
    
    def test_cleanup_locked_accounts(self):
        """Test cleanup of locked accounts."""
        # Lock an account with past expiry time
        past_time = timezone.now() - timedelta(minutes=30)
        self.user1.account_locked_until = past_time
        self.user1.failed_login_attempts = 5
        self.user1.save()
        
        # Run cleanup
        stats = token_cleanup_service.cleanup_locked_accounts()
        
        self.assertEqual(stats['unlocked'], 1)
        
        # Refresh user and check if unlocked
        self.user1.refresh_from_db()
        self.assertFalse(self.user1.is_account_locked())
        self.assertEqual(self.user1.failed_login_attempts, 0)


class TokenValidationServiceTest(TestCase):
    """Test token validation service functionality."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    def test_validate_email_verification_token(self):
        """Test email verification token validation service."""
        token = self.user.generate_email_verification_token()
        
        result = token_validation_service.validate_email_verification_token(self.user, token)
        
        self.assertTrue(result['valid'])
        self.assertFalse(result['expired'])
        self.assertIsNone(result['error'])
    
    def test_validate_invalid_email_token(self):
        """Test validation of invalid email token."""
        self.user.generate_email_verification_token()
        
        result = token_validation_service.validate_email_verification_token(self.user, 'invalid_token')
        
        self.assertFalse(result['valid'])
        self.assertIsNotNone(result['error'])
    
    def test_validate_password_reset_token(self):
        """Test password reset token validation service."""
        token, _ = self.user.generate_password_reset_token()
        
        result = token_validation_service.validate_password_reset_token(self.user, token)
        
        self.assertTrue(result['valid'])
        self.assertFalse(result['expired'])
        self.assertIsNone(result['error'])
    
    def test_validate_invalid_password_reset_token(self):
        """Test validation of invalid password reset token."""
        self.user.generate_password_reset_token()
        
        result = token_validation_service.validate_password_reset_token(self.user, 'invalid_token')
        
        self.assertFalse(result['valid'])
        self.assertIsNotNone(result['error'])


class ConvenienceFunctionsTest(TestCase):
    """Test convenience functions for token validation."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    def test_validate_user_email_token(self):
        """Test convenience function for email token validation."""
        token = self.user.generate_email_verification_token()
        
        result = validate_user_email_token(self.user, token)
        self.assertTrue(result)
        
        result = validate_user_email_token(self.user, 'invalid_token')
        self.assertFalse(result)
    
    def test_validate_user_password_reset_token(self):
        """Test convenience function for password reset token validation."""
        token, _ = self.user.generate_password_reset_token()
        
        result = validate_user_password_reset_token(self.user, token)
        self.assertTrue(result)
        
        result = validate_user_password_reset_token(self.user, 'invalid_token')
        self.assertFalse(result)