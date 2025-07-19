#!/usr/bin/env python
"""
Demo script showing how to use the EmailService.
This is for demonstration purposes only.
"""

import os
import sys
import django

# Add the project root to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'health_guide.settings.development')
django.setup()

from django.contrib.auth import get_user_model
from apps.authentication.services import EmailService

User = get_user_model()


def demo_email_service():
    """Demonstrate EmailService functionality."""
    print("=== Email Service Demo ===\n")
    
    # Create a demo user (or get existing one)
    user, created = User.objects.get_or_create(
        username='demo_user',
        defaults={
            'email': 'demo@example.com',
            'first_name': 'Demo',
            'last_name': 'User'
        }
    )
    
    if created:
        print(f"Created demo user: {user.username}")
    else:
        print(f"Using existing demo user: {user.username}")
    
    print(f"User email: {user.email}\n")
    
    # Demo 1: Verification Email
    print("1. Sending verification email...")
    result = EmailService.send_verification_email(
        user=user,
        verification_token='demo-verification-token-123'
    )
    print(f"   Result: {'Success' if result else 'Failed'}\n")
    
    # Demo 2: Password Reset Email
    print("2. Sending password reset email...")
    result = EmailService.send_password_reset_email(
        user=user,
        reset_token='demo-reset-token-456'
    )
    print(f"   Result: {'Success' if result else 'Failed'}\n")
    
    # Demo 3: Security Notification
    print("3. Sending security notification...")
    result = EmailService.send_security_notification(
        user=user,
        event='login',
        details={
            'ip_address': '192.168.1.100',
            'user_agent': 'Mozilla/5.0 (Demo Browser)',
            'timestamp': '2025-01-19 15:30:00'
        }
    )
    print(f"   Result: {'Success' if result else 'Failed'}\n")
    
    # Demo 4: Welcome Email
    print("4. Sending welcome email...")
    result = EmailService.send_welcome_email(user=user)
    print(f"   Result: {'Success' if result else 'Failed'}\n")
    
    print("=== Demo Complete ===")
    print("Note: In development mode, emails are printed to console.")
    print("Check the console output above to see the email content.")


if __name__ == '__main__':
    demo_email_service()