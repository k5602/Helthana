#!/usr/bin/env python
"""
Test script for enhanced authentication serializers
"""
import os
import sys
import django
from django.conf import settings

# Add the backend directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

# Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'health_guide.settings.development')
django.setup()

from apps.authentication.serializers import (
    UserRegistrationSerializer,
    UserProfileSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
    EmailVerificationSerializer,
    ChangePasswordSerializer,
    CustomLoginSerializer,
    EmailUpdateSerializer,
    PasswordValidationMixin
)
from apps.authentication.models import User
from django.test import RequestFactory
from rest_framework.request import Request


def test_password_validation():
    """Test password strength validation"""
    print("Testing password validation...")
    
    mixin = PasswordValidationMixin()
    
    # Test weak passwords
    weak_passwords = [
        "123456",
        "password",
        "Password",
        "Password1",
        "abc123",
        "qwerty123"
    ]
    
    for password in weak_passwords:
        try:
            mixin.validate_password_strength(password)
            print(f"❌ Weak password '{password}' was accepted")
        except Exception as e:
            print(f"✅ Weak password '{password}' rejected: {str(e)[:50]}...")
    
    # Test strong password
    try:
        mixin.validate_password_strength("MyStr0ng!P@ssw0rd")
        print("✅ Strong password accepted")
    except Exception as e:
        print(f"❌ Strong password rejected: {e}")


def test_user_registration_serializer():
    """Test user registration serializer validation"""
    print("\nTesting user registration serializer...")
    
    # Test valid data
    valid_data = {
        'username': 'testuser123',
        'email': 'test@example.com',
        'password': 'MyStr0ng!P@ssw0rd',
        'password_confirm': 'MyStr0ng!P@ssw0rd',
        'first_name': 'John',
        'last_name': 'Doe',
        'phone_number': '+1234567890',
        'date_of_birth': '1990-01-01'
    }
    
    serializer = UserRegistrationSerializer(data=valid_data)
    if serializer.is_valid():
        print("✅ Valid registration data accepted")
    else:
        print(f"❌ Valid registration data rejected: {serializer.errors}")
    
    # Test invalid email
    invalid_data = valid_data.copy()
    invalid_data['email'] = 'invalid-email'
    
    serializer = UserRegistrationSerializer(data=invalid_data)
    if not serializer.is_valid():
        print("✅ Invalid email rejected")
    else:
        print("❌ Invalid email accepted")
    
    # Test password mismatch
    invalid_data = valid_data.copy()
    invalid_data['password_confirm'] = 'DifferentPassword123!'
    
    serializer = UserRegistrationSerializer(data=invalid_data)
    if not serializer.is_valid():
        print("✅ Password mismatch rejected")
    else:
        print("❌ Password mismatch accepted")


def test_login_serializer():
    """Test login serializer validation"""
    print("\nTesting login serializer...")
    
    # Create a test user first
    try:
        user = User.objects.create_user(
            username='logintest',
            email='logintest@example.com',
            password='TestPassword123!'
        )
        print("✅ Test user created")
        
        # Test valid login
        factory = RequestFactory()
        request = factory.post('/login/')
        drf_request = Request(request)
        
        login_data = {
            'username': 'logintest',
            'password': 'TestPassword123!'
        }
        
        serializer = CustomLoginSerializer(data=login_data, context={'request': drf_request})
        if serializer.is_valid():
            print("✅ Valid login data accepted")
        else:
            print(f"❌ Valid login data rejected: {serializer.errors}")
        
        # Test invalid password
        invalid_login_data = {
            'username': 'logintest',
            'password': 'WrongPassword'
        }
        
        serializer = CustomLoginSerializer(data=invalid_login_data, context={'request': drf_request})
        if not serializer.is_valid():
            print("✅ Invalid password rejected")
        else:
            print("❌ Invalid password accepted")
        
        # Clean up
        user.delete()
        
    except Exception as e:
        print(f"❌ Login test failed: {e}")


def test_password_reset_serializers():
    """Test password reset serializers"""
    print("\nTesting password reset serializers...")
    
    # Test password reset request
    reset_request_data = {'email': 'test@example.com'}
    serializer = PasswordResetRequestSerializer(data=reset_request_data)
    if serializer.is_valid():
        print("✅ Password reset request data accepted")
    else:
        print(f"❌ Password reset request data rejected: {serializer.errors}")
    
    # Test password reset confirm
    reset_confirm_data = {
        'token': 'valid-token-123',
        'password': 'NewStr0ng!P@ssw0rd',
        'password_confirm': 'NewStr0ng!P@ssw0rd'
    }
    
    serializer = PasswordResetConfirmSerializer(data=reset_confirm_data)
    if serializer.is_valid():
        print("✅ Password reset confirm data accepted")
    else:
        print(f"❌ Password reset confirm data rejected: {serializer.errors}")


def test_email_verification_serializer():
    """Test email verification serializer"""
    print("\nTesting email verification serializer...")
    
    verification_data = {'token': 'verification-token-123'}
    serializer = EmailVerificationSerializer(data=verification_data)
    if serializer.is_valid():
        print("✅ Email verification data accepted")
    else:
        print(f"❌ Email verification data rejected: {serializer.errors}")


def test_profile_update_serializer():
    """Test profile update serializer"""
    print("\nTesting profile update serializer...")
    
    profile_data = {
        'first_name': 'Updated',
        'last_name': 'Name',
        'phone_number': '+9876543210',
        'emergency_contact_name': 'Emergency Contact',
        'emergency_contact_phone': '+1111111111'
    }
    
    serializer = UserProfileSerializer(data=profile_data)
    if serializer.is_valid():
        print("✅ Profile update data accepted")
    else:
        print(f"❌ Profile update data rejected: {serializer.errors}")


if __name__ == '__main__':
    print("🧪 Testing Enhanced Authentication Serializers\n")
    print("=" * 50)
    
    try:
        test_password_validation()
        test_user_registration_serializer()
        test_login_serializer()
        test_password_reset_serializers()
        test_email_verification_serializer()
        test_profile_update_serializer()
        
        print("\n" + "=" * 50)
        print("✅ All serializer tests completed!")
        
    except Exception as e:
        print(f"\n❌ Test suite failed: {e}")
        import traceback
        traceback.print_exc()