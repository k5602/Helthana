from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db import transaction
import logging

from .models import User, SecurityAuditLog, UserSession
from .session_service import SessionManager, TokenManager
from .serializers import (
    UserRegistrationSerializer, 
    UserProfileSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
    EmailVerificationSerializer,
    ChangePasswordSerializer,
    CustomLoginSerializer,
    SecurityAuditLogSerializer,
    EmailUpdateSerializer,
    AccountDeletionSerializer
)
from .services import EmailService
from .error_handlers import (
    AuthErrorCodes, 
    StandardizedErrorResponse, 
    AuthErrorHandler
)

logger = logging.getLogger(__name__)
User = get_user_model()


def get_client_ip(request):
    """Get client IP address from request"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def log_security_event(user, action, request, success=True, details=None):
    """Log security events for audit purposes"""
    try:
        SecurityAuditLog.objects.create(
            user=user,
            action=action,
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            success=success,
            details=details or {}
        )
    except Exception as e:
        logger.error(f"Failed to log security event: {str(e)}")


class EnhancedLoginView(TokenObtainPairView):
    """Enhanced login view with session management and security features"""
    permission_classes = [AllowAny]
    serializer_class = CustomLoginSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        
        try:
            serializer.is_valid(raise_exception=True)
            user = serializer.validated_data['user']
            
            # Reset failed login attempts on successful login
            user.reset_failed_login_attempts()
            
            # Update last login IP
            user.last_login_ip = get_client_ip(request)
            user.save(update_fields=['last_login_ip'])
            
            # Get remember_me preference from request
            remember_me = request.data.get('remember_me', False)
            
            # Create tokens and session using TokenManager
            token_data = TokenManager.create_tokens_for_user(user, request, remember_me)
            
            # Send security notification if enabled
            try:
                EmailService.send_security_notification(
                    user=user,
                    event='login',
                    details={
                        'ip_address': get_client_ip(request),
                        'user_agent': request.META.get('HTTP_USER_AGENT', ''),
                        'timestamp': timezone.now().isoformat(),
                        'device_info': token_data['session'].get_device_info()
                    }
                )
            except Exception as e:
                logger.warning(f"Failed to send security notification: {str(e)}")
            
            return Response({
                'access': token_data['access'],
                'refresh': token_data['refresh'],
                'expires_in': token_data['expires_in'],
                'refresh_expires_in': token_data['refresh_expires_in'],
                'session_id': token_data['session'].id,
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'email_verified': user.email_verified,
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            # Log failed login attempt
            username = request.data.get('username', '')
            failed_user = None
            try:
                if '@' in username:
                    failed_user = User.objects.get(email=username)
                else:
                    failed_user = User.objects.get(username=username)
                
                log_security_event(
                    user=failed_user,
                    action='login_failed',
                    request=request,
                    success=False,
                    details={'error': str(e)}
                )
            except User.DoesNotExist:
                pass
            
            # Use standardized error handling
            return AuthErrorHandler.handle_login_error(e, failed_user)


class EnhancedRegisterView(generics.CreateAPIView):
    """Enhanced registration view with email verification"""
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        
        try:
            serializer.is_valid(raise_exception=True)
            user = serializer.save()
            
            # Generate email verification token
            verification_token = user.generate_email_verification_token()
            
            # Send verification email
            email_sent = EmailService.send_verification_email(user, verification_token)
            
            # Log registration event
            log_security_event(
                user=user,
                action='register',
                request=request,
                success=True,
                details={
                    'email_sent': email_sent,
                    'verification_required': True
                }
            )
            
            # Send welcome email
            try:
                EmailService.send_welcome_email(user)
            except Exception as e:
                logger.warning(f"Failed to send welcome email: {str(e)}")
            
            return Response({
                'message': 'Registration successful. Please check your email to verify your account.',
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'email_verified': user.email_verified,
                },
                'email_verification_sent': email_sent
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            # Use standardized error handling
            return AuthErrorHandler.handle_registration_error(e)


class PasswordResetRequestView(generics.GenericAPIView):
    """View for requesting password reset"""
    serializer_class = PasswordResetRequestSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        
        try:
            serializer.is_valid(raise_exception=True)
            email = serializer.validated_data['email']
            
            user = User.objects.get(email=email)
            
            # Generate password reset token
            reset_token, expiry_time = user.generate_password_reset_token()
            
            # Send password reset email
            email_sent = EmailService.send_password_reset_email(user, reset_token)
            
            # Log password reset request
            log_security_event(
                user=user,
                action='password_reset_request',
                request=request,
                success=True,
                details={
                    'email_sent': email_sent,
                    'token_expiry': expiry_time.isoformat()
                }
            )
            
            return Response({
                'message': 'Password reset email sent. Please check your email for instructions.',
                'email_sent': email_sent
            }, status=status.HTTP_200_OK)
            
        except User.DoesNotExist:
            # For security, don't reveal if email exists or not
            return Response({
                'message': 'If an account with this email exists, a password reset email has been sent.',
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Password reset request failed: {str(e)}")
            return AuthErrorHandler.handle_password_reset_error(e)


class PasswordResetConfirmView(generics.GenericAPIView):
    """View for confirming password reset"""
    serializer_class = PasswordResetConfirmSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        
        try:
            serializer.is_valid(raise_exception=True)
            token = serializer.validated_data['token']
            new_password = serializer.validated_data['password']
            
            # Find user with this token
            try:
                user = User.objects.get(password_reset_token=token)
            except User.DoesNotExist:
                return StandardizedErrorResponse.create_error_response(
                    error_code=AuthErrorCodes.INVALID_RESET_TOKEN
                )
            
            # Verify token
            if not user.verify_password_reset_token(token):
                return StandardizedErrorResponse.create_error_response(
                    error_code=AuthErrorCodes.INVALID_RESET_TOKEN
                )
            
            # Update password
            user.set_password(new_password)
            user.clear_password_reset_token()
            user.save()
            
            # Log password reset confirmation
            log_security_event(
                user=user,
                action='password_reset_confirm',
                request=request,
                success=True,
                details={'method': 'email_token'}
            )
            
            # Send security notification
            try:
                EmailService.send_security_notification(
                    user=user,
                    event='password_change',
                    details={
                        'ip_address': get_client_ip(request),
                        'timestamp': timezone.now().isoformat(),
                        'method': 'password_reset'
                    }
                )
            except Exception as e:
                logger.warning(f"Failed to send security notification: {str(e)}")
            
            return Response({
                'message': 'Password has been reset successfully. You can now log in with your new password.'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Password reset confirmation failed: {str(e)}")
            
            if hasattr(e, 'detail'):
                pass
            else:
                {'non_field_errors': [str(e)]}
            
            return AuthErrorHandler.handle_password_reset_error(e)


class EmailVerificationView(generics.GenericAPIView):
    """View for email verification"""
    serializer_class = EmailVerificationSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        
        try:
            serializer.is_valid(raise_exception=True)
            token = serializer.validated_data['token']
            
            # Find user with this token
            try:
                user = User.objects.get(email_verification_token=token)
            except User.DoesNotExist:
                return StandardizedErrorResponse.create_error_response(
                    error_code=AuthErrorCodes.INVALID_VERIFICATION_TOKEN
                )
            
            # Verify token
            if not user.verify_email_token(token):
                return StandardizedErrorResponse.create_error_response(
                    error_code=AuthErrorCodes.INVALID_VERIFICATION_TOKEN
                )
            
            # Log email verification
            log_security_event(
                user=user,
                action='email_verification',
                request=request,
                success=True,
                details={'email': user.email}
            )
            
            return Response({
                'message': 'Email has been verified successfully.',
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'email_verified': user.email_verified,
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Email verification failed: {str(e)}")
            
            return AuthErrorHandler.handle_email_verification_error(e)


class ResendEmailVerificationView(generics.GenericAPIView):
    """View for resending email verification"""
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        email = request.data.get('email')
        
        if not email:
            return StandardizedErrorResponse.create_error_response(
                error_code=AuthErrorCodes.EMAIL_REQUIRED
            )
        
        try:
            user = User.objects.get(email=email)
            
            if user.email_verified:
                return Response({
                    'message': 'Email is already verified.'
                }, status=status.HTTP_200_OK)
            
            # Generate new verification token
            verification_token = user.generate_email_verification_token()
            
            # Send verification email
            email_sent = EmailService.send_verification_email(user, verification_token)
            
            return Response({
                'message': 'Verification email sent. Please check your email.',
                'email_sent': email_sent
            }, status=status.HTTP_200_OK)
            
        except User.DoesNotExist:
            # For security, don't reveal if email exists or not
            return Response({
                'message': 'If an account with this email exists, a verification email has been sent.'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Resend email verification failed: {str(e)}")
            return StandardizedErrorResponse.create_server_error_response(
                error_code=AuthErrorCodes.EMAIL_SEND_FAILED
            )


class ChangePasswordView(generics.GenericAPIView):
    """View for changing password"""
    serializer_class = ChangePasswordSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        
        try:
            serializer.is_valid(raise_exception=True)
            new_password = serializer.validated_data['new_password']
            
            # Update password
            user = request.user
            user.set_password(new_password)
            user.save()
            
            # Log password change
            log_security_event(
                user=user,
                action='password_change',
                request=request,
                success=True,
                details={'method': 'user_initiated'}
            )
            
            # Send security notification
            try:
                EmailService.send_security_notification(
                    user=user,
                    event='password_change',
                    details={
                        'ip_address': get_client_ip(request),
                        'timestamp': timezone.now().isoformat(),
                        'method': 'user_initiated'
                    }
                )
            except Exception as e:
                logger.warning(f"Failed to send security notification: {str(e)}")
            
            return Response({
                'message': 'Password has been changed successfully.'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Password change failed: {str(e)}")
            
            if hasattr(e, 'detail'):
                pass
            else:
                {'non_field_errors': [str(e)]}
            
            return AuthErrorHandler.handle_generic_error(e, AuthErrorCodes.PASSWORD_CHANGE_FAILED)


class ProfileView(generics.RetrieveUpdateAPIView):
    """Enhanced profile view"""
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        
        try:
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            
            # Log profile update
            log_security_event(
                user=instance,
                action='profile_update',
                request=request,
                success=True,
                details={'updated_fields': list(request.data.keys())}
            )
            
            return Response(serializer.data)
            
        except Exception as e:
            logger.error(f"Profile update failed: {str(e)}")
            
            if hasattr(e, 'detail'):
                pass
            else:
                {'non_field_errors': [str(e)]}
            
            return AuthErrorHandler.handle_generic_error(e, AuthErrorCodes.PROFILE_UPDATE_FAILED)


class EmailUpdateView(generics.GenericAPIView):
    """View for updating email address with verification"""
    serializer_class = EmailUpdateSerializer
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        
        try:
            serializer.is_valid(raise_exception=True)
            new_email = serializer.validated_data['new_email']
            user = request.user
            
            # Store the new email temporarily (we'll verify it first)
            old_email = user.email
            user.email = new_email
            user.email_verified = False  # Reset verification status
            
            # Generate new email verification token
            verification_token = user.generate_email_verification_token()
            user.save()
            
            # Send verification email to new address
            email_sent = EmailService.send_verification_email(user, verification_token)
            
            # Send notification to old email about the change
            try:
                EmailService.send_security_notification(
                    user=user,
                    event='email_change_request',
                    details={
                        'old_email': old_email,
                        'new_email': new_email,
                        'ip_address': get_client_ip(request),
                        'timestamp': timezone.now().isoformat()
                    },
                    recipient_email=old_email
                )
            except Exception as e:
                logger.warning(f"Failed to send email change notification: {str(e)}")
            
            # Log email update
            log_security_event(
                user=user,
                action='email_update',
                request=request,
                success=True,
                details={
                    'old_email': old_email,
                    'new_email': new_email,
                    'verification_sent': email_sent
                }
            )
            
            return Response({
                'message': f'Email updated to {new_email}. Please check your new email to verify the change.',
                'email_verification_sent': email_sent,
                'new_email': new_email
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Email update failed: {str(e)}")
            
            if hasattr(e, 'detail'):
                pass
            else:
                {'non_field_errors': [str(e)]}
            
            return AuthErrorHandler.handle_generic_error(e, AuthErrorCodes.EMAIL_UPDATE_FAILED)


class AccountDeletionView(generics.GenericAPIView):
    """View for account deletion with confirmation"""
    serializer_class = AccountDeletionSerializer
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        
        try:
            serializer.is_valid(raise_exception=True)
            user = request.user
            
            # Log account deletion
            log_security_event(
                user=user,
                action='account_deletion',
                request=request,
                success=True,
                details={
                    'deletion_method': 'user_initiated',
                    'user_email': user.email,
                    'user_id': user.id
                }
            )
            
            # Send account deletion notification
            try:
                EmailService.send_security_notification(
                    user=user,
                    event='account_deletion',
                    details={
                        'ip_address': get_client_ip(request),
                        'timestamp': timezone.now().isoformat(),
                        'deletion_date': timezone.now().strftime('%Y-%m-%d %H:%M:%S')
                    }
                )
            except Exception as e:
                logger.warning(f"Failed to send account deletion notification: {str(e)}")
            
            # Store user info for the response before deletion
            user_email = user.email
            user_name = f"{user.first_name} {user.last_name}".strip() or user.username
            
            # Soft delete: deactivate account instead of hard delete
            # This preserves data integrity and allows for potential recovery
            user.is_active = False
            user.email = f"deleted_{user.id}_{user.email}"  # Prevent email conflicts
            user.username = f"deleted_{user.id}_{user.username}"  # Prevent username conflicts
            user.save()
            
            # Clear all tokens and sessions
            try:
                # Invalidate all refresh tokens for this user
                from rest_framework_simplejwt.token_blacklist.models import OutstandingToken
                tokens = OutstandingToken.objects.filter(user=user)
                for token in tokens:
                    try:
                        RefreshToken(token.token).blacklist()
                    except Exception:
                        pass  # Token might already be blacklisted
            except Exception as e:
                logger.warning(f"Failed to blacklist tokens: {str(e)}")
            
            return Response({
                'message': f'Account for {user_name} ({user_email}) has been successfully deleted. We\'re sorry to see you go.',
                'deletion_timestamp': timezone.now().isoformat()
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Account deletion failed: {str(e)}")
            
            if hasattr(e, 'detail'):
                pass
            else:
                {'non_field_errors': [str(e)]}
            
            return AuthErrorHandler.handle_generic_error(e, AuthErrorCodes.ACCOUNT_DELETION_FAILED)


class EnhancedTokenRefreshView(TokenRefreshView):
    """Enhanced token refresh view with session management"""
    
    def post(self, request, *args, **kwargs):
        try:
            refresh_token_string = request.data.get('refresh')
            
            if not refresh_token_string:
                return StandardizedErrorResponse.create_error_response(
                    error_code=AuthErrorCodes.REFRESH_TOKEN_REQUIRED
                )
            
            # Use TokenManager to refresh token
            token_data = TokenManager.refresh_access_token(refresh_token_string)
            
            if not token_data:
                return StandardizedErrorResponse.create_authentication_error_response(
                    error_code=AuthErrorCodes.INVALID_REFRESH_TOKEN
                )
            
            return Response({
                'access': token_data['access'],
                'refresh': token_data['refresh'],
                'expires_in': token_data['expires_in'],
                'session_id': token_data.get('session_id')
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Token refresh failed: {str(e)}")
            return AuthErrorHandler.handle_token_error(e)


class LogoutView(generics.GenericAPIView):
    """Enhanced logout view with session termination"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request, *args, **kwargs):
        try:
            refresh_token_string = request.data.get('refresh')
            
            if refresh_token_string:
                # Use TokenManager to logout user
                success = TokenManager.logout_user(refresh_token_string, request)
                
                if success:
                    return Response({
                        'message': 'Successfully logged out.'
                    }, status=status.HTTP_200_OK)
            
            # Fallback: terminate all sessions for this user
            SessionManager.terminate_all_sessions(request.user)
            
            return Response({
                'message': 'Successfully logged out from all devices.'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Logout failed: {str(e)}")
            return Response({
                'error': {
                    'code': 'LOGOUT_FAILED',
                    'message': 'Failed to logout.',
                    'timestamp': timezone.now().isoformat()
                }
            }, status=status.HTTP_400_BAD_REQUEST)


class UserSessionsView(generics.ListAPIView):
    """View for retrieving user's active sessions"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, *args, **kwargs):
        try:
            sessions = SessionManager.get_user_sessions(request.user)
            
            sessions_data = []
            for session in sessions:
                sessions_data.append({
                    'id': session.id,
                    'device_info': session.get_device_info(),
                    'device_type': session.device_type,
                    'ip_address': session.ip_address,
                    'location': session.location,
                    'last_activity': session.last_activity.isoformat(),
                    'created_at': session.created_at.isoformat(),
                    'remember_me': session.remember_me,
                    'is_current': session.refresh_token_jti == request.data.get('current_jti', '')
                })
            
            return Response({
                'sessions': sessions_data,
                'total_sessions': len(sessions_data)
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Failed to retrieve sessions: {str(e)}")
            return Response({
                'error': {
                    'code': 'SESSIONS_RETRIEVAL_FAILED',
                    'message': 'Failed to retrieve sessions.',
                    'timestamp': timezone.now().isoformat()
                }
            }, status=status.HTTP_400_BAD_REQUEST)


class TerminateSessionView(generics.GenericAPIView):
    """View for terminating a specific session"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request, *args, **kwargs):
        try:
            session_id = request.data.get('session_id')
            
            if not session_id:
                return Response({
                    'error': {
                        'code': 'SESSION_ID_REQUIRED',
                        'message': 'Session ID is required.',
                        'timestamp': timezone.now().isoformat()
                    }
                }, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                session = UserSession.objects.get(
                    id=session_id,
                    user=request.user,
                    is_active=True
                )
            except UserSession.DoesNotExist:
                return Response({
                    'error': {
                        'code': 'SESSION_NOT_FOUND',
                        'message': 'Session not found or already terminated.',
                        'timestamp': timezone.now().isoformat()
                    }
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Terminate the session
            SessionManager.terminate_session(session, request, 'user_terminated')
            
            return Response({
                'message': 'Session terminated successfully.'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Session termination failed: {str(e)}")
            return Response({
                'error': {
                    'code': 'SESSION_TERMINATION_FAILED',
                    'message': 'Failed to terminate session.',
                    'timestamp': timezone.now().isoformat()
                }
            }, status=status.HTTP_400_BAD_REQUEST)


class TerminateAllSessionsView(generics.GenericAPIView):
    """View for terminating all sessions except current"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request, *args, **kwargs):
        try:
            current_session_id = request.data.get('current_session_id')
            current_session = None
            
            if current_session_id:
                try:
                    current_session = UserSession.objects.get(
                        id=current_session_id,
                        user=request.user,
                        is_active=True
                    )
                except UserSession.DoesNotExist:
                    pass
            
            # Terminate all sessions except current
            SessionManager.terminate_all_sessions(request.user, current_session)
            
            return Response({
                'message': 'All other sessions terminated successfully.'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Terminate all sessions failed: {str(e)}")
            return Response({
                'error': {
                    'code': 'TERMINATE_ALL_FAILED',
                    'message': 'Failed to terminate all sessions.',
                    'timestamp': timezone.now().isoformat()
                }
            }, status=status.HTTP_400_BAD_REQUEST)


class SecurityLogsView(generics.ListAPIView):
    """View for retrieving user's security audit logs"""
    serializer_class = SecurityAuditLogSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Return security logs for the current user only"""
        return SecurityAuditLog.objects.filter(
            user=self.request.user
        ).order_by('-timestamp')[:50]  # Limit to last 50 entries


# Keep the old views for backward compatibility
class RegisterView(EnhancedRegisterView):
    """Backward compatibility alias"""
    pass


class LoginView(EnhancedLoginView):
    """Backward compatibility alias"""
    pass