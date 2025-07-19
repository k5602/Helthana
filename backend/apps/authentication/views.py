from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db import transaction
import logging

from .models import User, SecurityAuditLog
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
    """Enhanced login view with security features and proper error handling"""
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
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            access_token = refresh.access_token
            
            # Log successful login
            log_security_event(
                user=user,
                action='login',
                request=request,
                success=True,
                details={'login_method': 'password'}
            )
            
            # Send security notification if enabled
            try:
                EmailService.send_security_notification(
                    user=user,
                    event='login',
                    details={
                        'ip_address': get_client_ip(request),
                        'user_agent': request.META.get('HTTP_USER_AGENT', ''),
                        'timestamp': timezone.now().isoformat()
                    }
                )
            except Exception as e:
                logger.warning(f"Failed to send security notification: {str(e)}")
            
            return Response({
                'access': str(access_token),
                'refresh': str(refresh),
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
            
            # Return standardized error response
            if hasattr(e, 'detail'):
                error_message = str(e.detail[0]) if isinstance(e.detail, list) else str(e.detail)
            else:
                error_message = str(e)
            
            return Response({
                'error': {
                    'code': 'LOGIN_FAILED',
                    'message': error_message,
                    'timestamp': timezone.now().isoformat()
                }
            }, status=status.HTTP_400_BAD_REQUEST)


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
            # Return standardized error response
            if hasattr(e, 'detail'):
                error_details = e.detail
            else:
                error_details = {'non_field_errors': [str(e)]}
            
            return Response({
                'error': {
                    'code': 'REGISTRATION_FAILED',
                    'message': 'Registration failed due to validation errors.',
                    'details': error_details,
                    'timestamp': timezone.now().isoformat()
                }
            }, status=status.HTTP_400_BAD_REQUEST)


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
            return Response({
                'error': {
                    'code': 'PASSWORD_RESET_FAILED',
                    'message': 'Failed to process password reset request.',
                    'timestamp': timezone.now().isoformat()
                }
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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
                return Response({
                    'error': {
                        'code': 'INVALID_TOKEN',
                        'message': 'Invalid or expired password reset token.',
                        'timestamp': timezone.now().isoformat()
                    }
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Verify token
            if not user.verify_password_reset_token(token):
                return Response({
                    'error': {
                        'code': 'INVALID_TOKEN',
                        'message': 'Invalid or expired password reset token.',
                        'timestamp': timezone.now().isoformat()
                    }
                }, status=status.HTTP_400_BAD_REQUEST)
            
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
                error_details = e.detail
            else:
                error_details = {'non_field_errors': [str(e)]}
            
            return Response({
                'error': {
                    'code': 'PASSWORD_RESET_FAILED',
                    'message': 'Failed to reset password.',
                    'details': error_details,
                    'timestamp': timezone.now().isoformat()
                }
            }, status=status.HTTP_400_BAD_REQUEST)


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
                return Response({
                    'error': {
                        'code': 'INVALID_TOKEN',
                        'message': 'Invalid or expired email verification token.',
                        'timestamp': timezone.now().isoformat()
                    }
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Verify token
            if not user.verify_email_token(token):
                return Response({
                    'error': {
                        'code': 'INVALID_TOKEN',
                        'message': 'Invalid or expired email verification token.',
                        'timestamp': timezone.now().isoformat()
                    }
                }, status=status.HTTP_400_BAD_REQUEST)
            
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
            
            return Response({
                'error': {
                    'code': 'EMAIL_VERIFICATION_FAILED',
                    'message': 'Failed to verify email.',
                    'timestamp': timezone.now().isoformat()
                }
            }, status=status.HTTP_400_BAD_REQUEST)


class ResendEmailVerificationView(generics.GenericAPIView):
    """View for resending email verification"""
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        email = request.data.get('email')
        
        if not email:
            return Response({
                'error': {
                    'code': 'EMAIL_REQUIRED',
                    'message': 'Email address is required.',
                    'timestamp': timezone.now().isoformat()
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        
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
            return Response({
                'error': {
                    'code': 'EMAIL_SEND_FAILED',
                    'message': 'Failed to send verification email.',
                    'timestamp': timezone.now().isoformat()
                }
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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
                error_details = e.detail
            else:
                error_details = {'non_field_errors': [str(e)]}
            
            return Response({
                'error': {
                    'code': 'PASSWORD_CHANGE_FAILED',
                    'message': 'Failed to change password.',
                    'details': error_details,
                    'timestamp': timezone.now().isoformat()
                }
            }, status=status.HTTP_400_BAD_REQUEST)


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
                error_details = e.detail
            else:
                error_details = {'non_field_errors': [str(e)]}
            
            return Response({
                'error': {
                    'code': 'PROFILE_UPDATE_FAILED',
                    'message': 'Failed to update profile.',
                    'details': error_details,
                    'timestamp': timezone.now().isoformat()
                }
            }, status=status.HTTP_400_BAD_REQUEST)


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
                error_details = e.detail
            else:
                error_details = {'non_field_errors': [str(e)]}
            
            return Response({
                'error': {
                    'code': 'EMAIL_UPDATE_FAILED',
                    'message': 'Failed to update email address.',
                    'details': error_details,
                    'timestamp': timezone.now().isoformat()
                }
            }, status=status.HTTP_400_BAD_REQUEST)


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
                error_details = e.detail
            else:
                error_details = {'non_field_errors': [str(e)]}
            
            return Response({
                'error': {
                    'code': 'ACCOUNT_DELETION_FAILED',
                    'message': 'Failed to delete account.',
                    'details': error_details,
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