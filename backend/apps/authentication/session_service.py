"""
Session Management Service
Handles user sessions, device tracking, and token management
"""

import uuid
import hashlib
from datetime import timedelta
from typing import Optional, Dict, Any, List
from django.utils import timezone
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken
from user_agents import parse as parse_user_agent

from .models import UserSession, SecurityAuditLog

User = get_user_model()


class SessionManager:
    """Manages user sessions and device tracking"""
    
    @staticmethod
    def parse_user_agent(user_agent_string: str) -> Dict[str, str]:
        """Parse user agent string to extract device information"""
        try:
            user_agent = parse_user_agent(user_agent_string)
            return {
                'browser_name': user_agent.browser.family,
                'browser_version': user_agent.browser.version_string,
                'os_name': user_agent.os.family,
                'os_version': user_agent.os.version_string,
                'device_type': 'mobile' if user_agent.is_mobile else 'tablet' if user_agent.is_tablet else 'desktop',
                'device_name': f"{user_agent.device.family}" if user_agent.device.family != 'Other' else None
            }
        except Exception:
            return {
                'browser_name': 'Unknown',
                'browser_version': '',
                'os_name': 'Unknown',
                'os_version': '',
                'device_type': 'desktop',
                'device_name': None
            }
    
    @staticmethod
    def generate_session_key() -> str:
        """Generate a unique session key"""
        return hashlib.sha256(f"{uuid.uuid4()}{timezone.now()}".encode()).hexdigest()
    
    @classmethod
    def create_session(
        cls,
        user: User,
        refresh_token: RefreshToken,
        request,
        remember_me: bool = False
    ) -> UserSession:
        """Create a new user session"""
        
        # Parse user agent
        user_agent_string = request.META.get('HTTP_USER_AGENT', '')
        device_info = cls.parse_user_agent(user_agent_string)
        
        # Get IP address
        ip_address = cls.get_client_ip(request)
        
        # Calculate expiry time based on remember_me
        if remember_me:
            expires_at = timezone.now() + timedelta(days=30)  # 30 days for remember me
        else:
            expires_at = timezone.now() + timedelta(days=7)   # 7 days default
        
        # Create session
        session = UserSession.objects.create(
            user=user,
            session_key=cls.generate_session_key(),
            refresh_token_jti=str(refresh_token.get('jti')),
            device_name=device_info.get('device_name') or '',
            device_type=device_info.get('device_type') or 'desktop',
            browser_name=device_info.get('browser_name') or '',
            browser_version=device_info.get('browser_version') or '',
            os_name=device_info.get('os_name') or '',
            os_version=device_info.get('os_version') or '',
            ip_address=ip_address,
            remember_me=remember_me,
            expires_at=expires_at
        )
        
        # Log session creation
        SecurityAuditLog.objects.create(
            user=user,
            action='session_created',
            ip_address=ip_address,
            user_agent=user_agent_string,
            success=True,
            details={
                'session_id': session.id,
                'device_info': device_info,
                'remember_me': remember_me,
                'expires_at': expires_at.isoformat()
            },
            session=session
        )
        
        return session
    
    @staticmethod
    def get_client_ip(request) -> str:
        """Get client IP address from request"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR', '127.0.0.1')
        return ip
    
    @classmethod
    def get_session_by_refresh_token(cls, refresh_token_jti: str) -> Optional[UserSession]:
        """Get session by refresh token JTI"""
        try:
            return UserSession.objects.get(
                refresh_token_jti=refresh_token_jti,
                is_active=True
            )
        except UserSession.DoesNotExist:
            return None
    
    @classmethod
    def update_session_activity(cls, session: UserSession):
        """Update session last activity timestamp"""
        session.last_activity = timezone.now()
        session.save(update_fields=['last_activity'])
    
    @classmethod
    def terminate_session(cls, session: UserSession, request=None, reason: str = 'user_logout'):
        """Terminate a user session"""
        # Blacklist the refresh token
        try:
            outstanding_token = OutstandingToken.objects.get(jti=session.refresh_token_jti)
            BlacklistedToken.objects.get_or_create(token=outstanding_token)
        except OutstandingToken.DoesNotExist:
            pass  # Token might already be blacklisted or expired
        
        # Deactivate session
        session.deactivate()
        
        # Log session termination
        ip_address = cls.get_client_ip(request) if request else session.ip_address
        user_agent = request.META.get('HTTP_USER_AGENT', '') if request else ''
        
        SecurityAuditLog.objects.create(
            user=session.user,
            action='session_terminated',
            ip_address=ip_address,
            user_agent=user_agent,
            success=True,
            details={
                'session_id': session.id,
                'reason': reason,
                'device_info': session.get_device_info()
            },
            session=session
        )
    
    @classmethod
    def terminate_all_sessions(cls, user: User, except_session: Optional[UserSession] = None):
        """Terminate all active sessions for a user"""
        sessions = UserSession.objects.filter(user=user, is_active=True)
        
        if except_session:
            sessions = sessions.exclude(id=except_session.id)
        
        for session in sessions:
            cls.terminate_session(session, reason='all_sessions_terminated')
    
    @classmethod
    def cleanup_expired_sessions(cls):
        """Clean up expired sessions"""
        expired_sessions = UserSession.objects.filter(
            expires_at__lt=timezone.now(),
            is_active=True
        )
        
        for session in expired_sessions:
            cls.terminate_session(session, reason='session_expired')
    
    @classmethod
    def get_user_sessions(cls, user: User) -> List[UserSession]:
        """Get all active sessions for a user"""
        return UserSession.objects.filter(
            user=user,
            is_active=True
        ).order_by('-last_activity')
    
    @classmethod
    def refresh_session_token(cls, session: UserSession, new_refresh_token: RefreshToken):
        """Update session with new refresh token after rotation"""
        session.refresh_token_jti = str(new_refresh_token.get('jti'))
        session.last_activity = timezone.now()
        
        # Extend expiry if remember_me is enabled
        if session.remember_me:
            session.expires_at = timezone.now() + timedelta(days=30)
        
        session.save(update_fields=['refresh_token_jti', 'last_activity', 'expires_at'])
        
        # Log token refresh
        SecurityAuditLog.objects.create(
            user=session.user,
            action='token_refreshed',
            ip_address=session.ip_address,
            user_agent='',  # We don't have request context here
            success=True,
            details={
                'session_id': session.id,
                'new_jti': str(new_refresh_token.get('jti'))
            },
            session=session
        )


class TokenManager:
    """Manages JWT tokens and their lifecycle"""
    
    @staticmethod
    def create_tokens_for_user(user: User, request, remember_me: bool = False) -> Dict[str, Any]:
        """Create access and refresh tokens for a user"""
        refresh = RefreshToken.for_user(user)
        access = refresh.access_token
        
        # Create session
        session = SessionManager.create_session(user, refresh, request, remember_me)
        
        return {
            'access': str(access),
            'refresh': str(refresh),
            'session': session,
            'expires_in': access.lifetime.total_seconds(),
            'refresh_expires_in': refresh.lifetime.total_seconds()
        }
    
    @staticmethod
    def refresh_access_token(refresh_token_string: str) -> Optional[Dict[str, Any]]:
        """Refresh access token and optionally rotate refresh token"""
        try:
            refresh_token = RefreshToken(refresh_token_string)
            
            # Get session by refresh token JTI
            session = SessionManager.get_session_by_refresh_token(str(refresh_token.get('jti')))
            
            if not session or session.is_expired():
                return None
            
            # Create new access token
            new_access_token = refresh_token.access_token
            
            # If token rotation is enabled, create new refresh token
            if hasattr(refresh_token, 'rotate'):
                new_refresh_token = refresh_token.rotate()
                SessionManager.refresh_session_token(session, new_refresh_token)
                refresh_token_string = str(new_refresh_token)
            else:
                # Update session activity
                SessionManager.update_session_activity(session)
            
            return {
                'access': str(new_access_token),
                'refresh': refresh_token_string,
                'expires_in': new_access_token.lifetime.total_seconds(),
                'session_id': session.id
            }
            
        except Exception as e:
            print(f"Token refresh failed: {e}")
            return None
    
    @staticmethod
    def blacklist_token(refresh_token_string: str):
        """Blacklist a refresh token"""
        try:
            refresh_token = RefreshToken(refresh_token_string)
            refresh_token.blacklist()
        except Exception:
            pass  # Token might already be blacklisted
    
    @staticmethod
    def logout_user(refresh_token_string: str, request=None):
        """Logout user by blacklisting token and terminating session"""
        try:
            refresh_token = RefreshToken(refresh_token_string)
            session = SessionManager.get_session_by_refresh_token(str(refresh_token.get('jti')))
            
            if session:
                SessionManager.terminate_session(session, request, 'user_logout')
            
            # Blacklist the token
            refresh_token.blacklist()
            
            return True
        except Exception:
            return False