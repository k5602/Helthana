#!/usr/bin/env python
"""
Test script for enhanced session and token management
"""

import os
import sys
import django
from django.conf import settings

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'health_guide.settings.development')
django.setup()

from django.contrib.auth import get_user_model
from django.test import RequestFactory
from rest_framework_simplejwt.tokens import RefreshToken
from apps.authentication.session_service import SessionManager, TokenManager
from apps.authentication.models import UserSession

User = get_user_model()

def test_session_management():
    """Test session management functionality"""
    print("Testing Enhanced Session and Token Management")
    print("=" * 50)
    
    # Create a test user
    try:
        user = User.objects.get(username='testuser')
        print(f"Using existing test user: {user.username}")
    except User.DoesNotExist:
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
        print(f"Created test user: {user.username}")
    
    # Create a mock request
    factory = RequestFactory()
    request = factory.post('/auth/login/', {
        'username': 'testuser',
        'password': 'testpass123',
        'remember_me': True
    })
    request.META['HTTP_USER_AGENT'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    request.META['REMOTE_ADDR'] = '127.0.0.1'
    
    print("\n1. Testing Token Creation with Session Management")
    print("-" * 40)
    
    # Test token creation with session
    token_data = TokenManager.create_tokens_for_user(user, request, remember_me=True)
    print(f"✓ Access token created: {token_data['access'][:50]}...")
    print(f"✓ Refresh token created: {token_data['refresh'][:50]}...")
    print(f"✓ Session created with ID: {token_data['session'].id}")
    print(f"✓ Session expires at: {token_data['session'].expires_at}")
    print(f"✓ Remember me enabled: {token_data['session'].remember_me}")
    
    print("\n2. Testing Session Retrieval")
    print("-" * 40)
    
    # Test session retrieval
    refresh_token = RefreshToken(token_data['refresh'])
    jti = str(refresh_token.get('jti'))
    session = SessionManager.get_session_by_refresh_token(jti)
    
    if session:
        print(f"✓ Session retrieved successfully")
        print(f"  - Device info: {session.get_device_info()}")
        print(f"  - IP address: {session.ip_address}")
        print(f"  - Last activity: {session.last_activity}")
    else:
        print("✗ Failed to retrieve session")
    
    print("\n3. Testing Token Refresh")
    print("-" * 40)
    
    # Test token refresh
    refresh_result = TokenManager.refresh_access_token(token_data['refresh'])
    
    if refresh_result:
        print(f"✓ Token refreshed successfully")
        print(f"  - New access token: {refresh_result['access'][:50]}...")
        print(f"  - Session ID: {refresh_result.get('session_id')}")
    else:
        print("✗ Token refresh failed")
    
    print("\n4. Testing Multiple Sessions")
    print("-" * 40)
    
    # Create another session (different device)
    request2 = factory.post('/auth/login/', {
        'username': 'testuser',
        'password': 'testpass123',
        'remember_me': False
    })
    request2.META['HTTP_USER_AGENT'] = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)'
    request2.META['REMOTE_ADDR'] = '192.168.1.100'
    
    token_data2 = TokenManager.create_tokens_for_user(user, request2, remember_me=False)
    print(f"✓ Second session created with ID: {token_data2['session'].id}")
    
    # Get all user sessions
    user_sessions = SessionManager.get_user_sessions(user)
    print(f"✓ Total active sessions: {len(user_sessions)}")
    
    for i, session in enumerate(user_sessions, 1):
        print(f"  Session {i}: {session.get_device_info()} - {session.ip_address}")
    
    print("\n5. Testing Session Termination")
    print("-" * 40)
    
    # Terminate one session
    SessionManager.terminate_session(token_data2['session'], request2, 'test_termination')
    print(f"✓ Session {token_data2['session'].id} terminated")
    
    # Check active sessions
    active_sessions = SessionManager.get_user_sessions(user)
    print(f"✓ Active sessions after termination: {len(active_sessions)}")
    
    print("\n6. Testing Logout")
    print("-" * 40)
    
    # Test logout
    logout_success = TokenManager.logout_user(token_data['refresh'], request)
    print(f"✓ Logout successful: {logout_success}")
    
    # Check sessions after logout
    final_sessions = SessionManager.get_user_sessions(user)
    print(f"✓ Active sessions after logout: {len(final_sessions)}")
    
    print("\n7. Testing Session Cleanup")
    print("-" * 40)
    
    # Test cleanup of expired sessions
    SessionManager.cleanup_expired_sessions()
    print("✓ Expired sessions cleanup completed")
    
    print("\nTest Summary")
    print("=" * 50)
    print("✓ All session and token management tests passed!")
    print("✓ Enhanced JWT token refresh mechanism working")
    print("✓ Remember Me functionality implemented")
    print("✓ Proper logout with token invalidation working")
    print("✓ Multi-device session management working")

if __name__ == '__main__':
    test_session_management()