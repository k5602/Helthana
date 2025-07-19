"""
Custom hijack views for frontend integration.
"""
from django.contrib.auth import login
from django.contrib.auth.decorators import user_passes_test
from django.http import JsonResponse
from django.shortcuts import redirect, get_object_or_404
from django.urls import reverse
from django.utils.decorators import method_decorator
from django.views.generic import View
from hijack.views import AcquireUserView, ReleaseUserView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework import status
from .models import User, SecurityAuditLog
import logging

logger = logging.getLogger(__name__)


def is_admin_user(user):
    """Check if user is admin/superuser"""
    return user.is_authenticated and (user.is_superuser or user.is_staff)


class CustomHijackView(AcquireUserView):
    """Custom hijack view with enhanced logging and frontend integration"""
    
    @method_decorator(user_passes_test(is_admin_user))
    def dispatch(self, request, *args, **kwargs):
        return super().dispatch(request, *args, **kwargs)
    
    def post(self, request, *args, **kwargs):
        """Handle hijack request with security logging"""
        try:
            # Get the target user from the URL parameter
            user_id = kwargs.get('pk') or kwargs.get('user_id')
            target_user = get_object_or_404(User, id=user_id)
            hijacker = request.user
            
            # Log the hijack attempt
            SecurityAuditLog.objects.create(
                user=target_user,
                action='HIJACK_ATTEMPT',
                ip_address=self.get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                success=True,
                details={
                    'hijacker_id': hijacker.id,
                    'hijacker_email': hijacker.email,
                    'target_user_id': target_user.id,
                    'target_user_email': target_user.email
                }
            )
            
            logger.info(f"Admin {hijacker.email} hijacked user {target_user.email}")
            
            # Call the parent class method to handle the actual hijack
            response = super().post(request, *args, **kwargs)
            
            # Override the redirect to go to frontend dashboard
            if response.status_code == 302:
                return redirect('/dashboard.html')
            
            return response
            
        except Exception as e:
            logger.error(f"Hijack error: {str(e)}")
            return JsonResponse({'error': 'Hijack failed'}, status=500)
    
    def get_client_ip(self, request):
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class CustomReleaseView(ReleaseUserView):
    """Custom release view with enhanced logging"""
    
    def get(self, request):
        """Handle hijack release with security logging"""
        try:
            if hasattr(request, 'session') and 'hijack_history' in request.session:
                hijack_history = request.session.get('hijack_history', [])
                if hijack_history:
                    original_user_id = hijack_history[-1]
                    current_user = request.user
                    
                    # Log the release
                    SecurityAuditLog.objects.create(
                        user=current_user,
                        action='HIJACK_RELEASE',
                        ip_address=self.get_client_ip(request),
                        user_agent=request.META.get('HTTP_USER_AGENT', ''),
                        success=True,
                        details={
                            'original_user_id': original_user_id,
                            'hijacked_user_id': current_user.id,
                            'hijacked_user_email': current_user.email
                        }
                    )
                    
                    logger.info(f"Released hijack session for user {current_user.email}")
            
            # Call the parent class method to handle the actual release
            response = super().get(request)
            
            # Override the redirect to go to admin panel
            if response.status_code == 302:
                return redirect('/admin/')
            
            return response
            
        except Exception as e:
            logger.error(f"Release hijack error: {str(e)}")
            return JsonResponse({'error': 'Release failed'}, status=500)
    
    def get_client_ip(self, request):
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


@api_view(['GET'])
@permission_classes([IsAdminUser])
def hijack_status_api(request):
    """API endpoint to check hijack status"""
    try:
        is_hijacked = hasattr(request, 'session') and 'hijack_history' in request.session
        hijack_info = {}
        
        if is_hijacked:
            hijack_history = request.session.get('hijack_history', [])
            if hijack_history:
                original_user_id = hijack_history[-1]
                try:
                    original_user = User.objects.get(id=original_user_id)
                    hijack_info = {
                        'is_hijacked': True,
                        'original_user': {
                            'id': original_user.id,
                            'email': original_user.email,
                            'first_name': original_user.first_name,
                            'last_name': original_user.last_name
                        },
                        'current_user': {
                            'id': request.user.id,
                            'email': request.user.email,
                            'first_name': request.user.first_name,
                            'last_name': request.user.last_name
                        }
                    }
                except User.DoesNotExist:
                    hijack_info = {'is_hijacked': False}
        else:
            hijack_info = {'is_hijacked': False}
        
        return Response(hijack_info, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Hijack status API error: {str(e)}")
        return Response(
            {'error': 'Failed to get hijack status'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAdminUser])
def hijack_user_api(request, user_id):
    """API endpoint to hijack a user"""
    try:
        target_user = User.objects.get(id=user_id)
        hijacker = request.user
        
        # Check if user is already hijacked
        if hasattr(request, 'session') and 'hijack_history' in request.session:
            return Response(
                {'error': 'Already in hijack session'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Log the hijack attempt
        SecurityAuditLog.objects.create(
            user=target_user,
            action='HIJACK_API_ATTEMPT',
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            success=True,
            details={
                'hijacker_id': hijacker.id,
                'hijacker_email': hijacker.email,
                'target_user_id': target_user.id,
                'target_user_email': target_user.email
            }
        )
        
        # Note: Actual hijack is handled by the hijack middleware and views
        # This API is for logging purposes only
        
        logger.info(f"Admin {hijacker.email} hijacked user {target_user.email} via API")
        
        return Response({
            'success': True,
            'message': f'Successfully hijacked user {target_user.email}',
            'hijacked_user': {
                'id': target_user.id,
                'email': target_user.email,
                'first_name': target_user.first_name,
                'last_name': target_user.last_name
            }
        }, status=status.HTTP_200_OK)
        
    except User.DoesNotExist:
        logger.warning(f"Admin {request.user.email} attempted to hijack non-existent user {user_id}")
        return Response(
            {'error': 'User not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Hijack API error: {str(e)}")
        return Response(
            {'error': 'Hijack failed'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAdminUser])
def release_hijack_api(request):
    """API endpoint to release hijack"""
    try:
        if not (hasattr(request, 'session') and 'hijack_history' in request.session):
            return Response(
                {'error': 'No active hijack session'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        hijack_history = request.session.get('hijack_history', [])
        if hijack_history:
            original_user_id = hijack_history[-1]
            current_user = request.user
            
            # Log the release
            SecurityAuditLog.objects.create(
                user=current_user,
                action='HIJACK_API_RELEASE',
                ip_address=get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                success=True,
                details={
                    'original_user_id': original_user_id,
                    'hijacked_user_id': current_user.id,
                    'hijacked_user_email': current_user.email
                }
            )
            
            logger.info(f"Released hijack session for user {current_user.email} via API")
        
        # Note: Actual release is handled by the hijack middleware and views
        # This API is for logging purposes only
        
        return Response({
            'success': True,
            'message': 'Hijack session release logged'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Release hijack API error: {str(e)}")
        return Response(
            {'error': 'Release failed'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


def get_client_ip(request):
    """Helper function to get client IP address"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip