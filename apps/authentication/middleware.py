"""
Security middleware for authentication and rate limiting
"""
import time
import logging
from typing import Optional, Tuple

from django.core.cache import cache
from django.http import JsonResponse
from django.utils import timezone
from django.utils.deprecation import MiddlewareMixin
from django.contrib.auth import get_user_model
from django.conf import settings

from .models import SecurityAuditLog

logger = logging.getLogger(__name__)
User = get_user_model()


class SecurityAuditMiddleware(MiddlewareMixin):
    """
    Middleware for logging security events and tracking authentication attempts
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        super().__init__(get_response)
    
    def process_request(self, request):
        """Process incoming request for security tracking"""
        # Store request start time for performance tracking
        request._security_start_time = time.time()
        
        # Get client IP address
        request._client_ip = self.get_client_ip(request)
        
        # Track authentication endpoints
        if self.is_auth_endpoint(request.path):
            request._is_auth_request = True
        
        return None
    
    def process_response(self, request, response):
        """Process response for security logging"""
        # Log authentication attempts
        if hasattr(request, '_is_auth_request') and request._is_auth_request:
            self.log_auth_attempt(request, response)
        
        # Add security headers
        response = self.add_security_headers(response)
        
        return response
    
    def get_client_ip(self, request) -> str:
        """Get client IP address from request"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR', '127.0.0.1')
        return ip
    
    def is_auth_endpoint(self, path: str) -> bool:
        """Check if the path is an authentication endpoint"""
        auth_endpoints = [
            '/api/v1/auth/login/',
            '/api/v1/auth/register/',
            '/api/v1/auth/password-reset/',
            '/api/v1/auth/password-reset-confirm/',
            '/api/v1/auth/verify-email/',
            '/api/v1/auth/change-password/',
        ]
        return any(path.startswith(endpoint) for endpoint in auth_endpoints)
    
    def log_auth_attempt(self, request, response):
        """Log authentication attempts for security audit"""
        try:
            path = request.path
            method = request.method
            status_code = response.status_code
            ip_address = getattr(request, '_client_ip', '127.0.0.1')
            user_agent = request.META.get('HTTP_USER_AGENT', '')
            
            # Determine action based on endpoint
            action = 'unknown'
            if 'login' in path:
                action = 'login' if status_code == 200 else 'login_failed'
            elif 'register' in path:
                action = 'register'
            elif 'password-reset' in path:
                action = 'password_reset_request'
            elif 'verify-email' in path:
                action = 'email_verification'
            elif 'change-password' in path:
                action = 'password_change'
            
            # Try to get user from request data or response
            user = None
            if hasattr(request, 'user') and request.user.is_authenticated:
                user = request.user
            elif method == 'POST' and hasattr(request, 'data'):
                # Try to find user from login data
                username = request.data.get('username') or request.data.get('email')
                if username:
                    try:
                        if '@' in username:
                            user = User.objects.get(email=username)
                        else:
                            user = User.objects.get(username=username)
                    except User.DoesNotExist:
                        pass
            
            # Log the event if we have a user
            if user:
                SecurityAuditLog.objects.create(
                    user=user,
                    action=action,
                    ip_address=ip_address,
                    user_agent=user_agent,
                    success=(status_code < 400),
                    details={
                        'endpoint': path,
                        'method': method,
                        'status_code': status_code,
                        'response_time': getattr(request, '_security_start_time', 0)
                    }
                )
        
        except Exception as e:
            logger.error(f"Failed to log authentication attempt: {str(e)}")
    
    def add_security_headers(self, response):
        """Add security headers to response"""
        # Add security headers
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['X-XSS-Protection'] = '1; mode=block'
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        
        # Add CSP header for API responses
        if response.get('Content-Type', '').startswith('application/json'):
            response['Content-Security-Policy'] = "default-src 'none'; frame-ancestors 'none';"
        
        return response


class RateLimitMiddleware(MiddlewareMixin):
    """
    Rate limiting middleware for authentication endpoints
    """
    
    # Rate limit configurations
    RATE_LIMITS = {
        '/api/v1/auth/login/': {
            'requests': 10,  # 10 requests
            'window': 900,   # per 15 minutes (900 seconds)
            'block_duration': 900,  # block for 15 minutes
        },
        '/api/v1/auth/register/': {
            'requests': 5,   # 5 requests
            'window': 3600,  # per hour
            'block_duration': 3600,  # block for 1 hour
        },
        '/api/v1/auth/password-reset/': {
            'requests': 3,   # 3 requests
            'window': 3600,  # per hour
            'block_duration': 3600,  # block for 1 hour
        },
        '/api/v1/auth/verify-email/': {
            'requests': 10,  # 10 requests
            'window': 3600,  # per hour
            'block_duration': 1800,  # block for 30 minutes
        },
    }
    
    def __init__(self, get_response):
        self.get_response = get_response
        super().__init__(get_response)
    
    def process_request(self, request):
        """Check rate limits before processing request"""
        # Skip rate limiting if disabled in settings
        if not getattr(settings, 'RATELIMIT_ENABLE', True):
            return None
        
        # Check if this endpoint has rate limiting
        endpoint = self.get_rate_limit_endpoint(request.path)
        if not endpoint:
            return None
        
        # Get client identifier (IP + User Agent hash for better uniqueness)
        client_id = self.get_client_identifier(request)
        
        # Check rate limit
        is_blocked, remaining_time = self.check_rate_limit(endpoint, client_id)
        
        if is_blocked:
            return self.rate_limit_response(remaining_time)
        
        return None
    
    def get_rate_limit_endpoint(self, path: str) -> Optional[str]:
        """Get the rate limit configuration for a given path"""
        for endpoint in self.RATE_LIMITS.keys():
            if path.startswith(endpoint.rstrip('/')):
                return endpoint
        return None
    
    def get_client_identifier(self, request) -> str:
        """Get unique client identifier for rate limiting"""
        ip = self.get_client_ip(request)
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        
        # Create a hash of IP + User Agent for better uniqueness
        import hashlib
        identifier = f"{ip}:{hashlib.md5(user_agent.encode()).hexdigest()[:8]}"
        return identifier
    
    def get_client_ip(self, request) -> str:
        """Get client IP address from request"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR', '127.0.0.1')
        return ip
    
    def check_rate_limit(self, endpoint: str, client_id: str) -> Tuple[bool, int]:
        """
        Check if client has exceeded rate limit
        
        Returns:
            Tuple[bool, int]: (is_blocked, remaining_block_time_seconds)
        """
        config = self.RATE_LIMITS[endpoint]
        cache_key_requests = f"ratelimit:requests:{endpoint}:{client_id}"
        cache_key_blocked = f"ratelimit:blocked:{endpoint}:{client_id}"
        
        # Check if client is currently blocked
        blocked_until = cache.get(cache_key_blocked)
        if blocked_until:
            current_time = time.time()
            if current_time < blocked_until:
                return True, int(blocked_until - current_time)
            else:
                # Block period expired, remove block
                cache.delete(cache_key_blocked)
        
        # Get current request count
        current_requests = cache.get(cache_key_requests, [])
        current_time = time.time()
        window_start = current_time - config['window']
        
        # Filter requests within the time window
        recent_requests = [req_time for req_time in current_requests if req_time > window_start]
        
        # Check if limit exceeded
        if len(recent_requests) >= config['requests']:
            # Block the client
            block_until = current_time + config['block_duration']
            cache.set(cache_key_blocked, block_until, config['block_duration'])
            
            # Log the rate limit violation
            logger.warning(f"Rate limit exceeded for {client_id} on {endpoint}")
            
            return True, config['block_duration']
        
        # Add current request to the list
        recent_requests.append(current_time)
        cache.set(cache_key_requests, recent_requests, config['window'])
        
        return False, 0
    
    def rate_limit_response(self, remaining_time: int) -> JsonResponse:
        """Return rate limit exceeded response"""
        return JsonResponse({
            'error': {
                'code': 'RATE_LIMIT_EXCEEDED',
                'message': 'Too many requests. Please try again later.',
                'retry_after': remaining_time,
                'timestamp': timezone.now().isoformat()
            }
        }, status=429)





class IPTrackingMiddleware(MiddlewareMixin):
    """
    Middleware to track IP addresses and detect suspicious activity
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        super().__init__(get_response)
    
    def process_request(self, request):
        """Track IP addresses for authenticated users"""
        if hasattr(request, 'user') and request.user.is_authenticated:
            current_ip = self.get_client_ip(request)
            
            # Check if IP has changed
            if request.user.last_login_ip and request.user.last_login_ip != current_ip:
                # Log IP change
                try:
                    SecurityAuditLog.objects.create(
                        user=request.user,
                        action='ip_change',
                        ip_address=current_ip,
                        user_agent=request.META.get('HTTP_USER_AGENT', ''),
                        success=True,
                        details={
                            'previous_ip': request.user.last_login_ip,
                            'new_ip': current_ip
                        }
                    )
                    
                    # Send security notification for IP change
                    from .services import EmailService
                    EmailService.send_security_notification(
                        user=request.user,
                        event='ip_change',
                        details={
                            'previous_ip': request.user.last_login_ip,
                            'new_ip': current_ip,
                            'timestamp': timezone.now().isoformat()
                        }
                    )
                except Exception as e:
                    logger.warning(f"Failed to log IP change: {str(e)}")
        
        return None
    
    def get_client_ip(self, request) -> str:
        """Get client IP address from request"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR', '127.0.0.1')
        return ip