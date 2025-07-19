from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, 
    LoginView, 
    ProfileView,
    PasswordResetRequestView,
    PasswordResetConfirmView,
    EmailVerificationView,
    ResendEmailVerificationView,
    ChangePasswordView,
    EmailUpdateView,
    AccountDeletionView,
    SecurityLogsView
)

urlpatterns = [
    # Authentication endpoints
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Password reset endpoints
    path('password-reset/', PasswordResetRequestView.as_view(), name='password_reset_request'),
    path('password-reset-confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    
    # Email verification endpoints
    path('verify-email/', EmailVerificationView.as_view(), name='email_verification'),
    path('resend-verification/', ResendEmailVerificationView.as_view(), name='resend_email_verification'),
    
    # Profile and password management
    path('profile/', ProfileView.as_view(), name='profile'),
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('update-email/', EmailUpdateView.as_view(), name='update_email'),
    path('delete-account/', AccountDeletionView.as_view(), name='delete_account'),
    
    # Security audit
    path('security-logs/', SecurityLogsView.as_view(), name='security_logs'),
]