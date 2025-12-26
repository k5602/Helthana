from django.urls import path
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
    SecurityLogsView,
    EnhancedTokenRefreshView,
    LogoutView,
    UserSessionsView,
    TerminateSessionView,
    TerminateAllSessionsView
)
from .hijack_views import (
    CustomHijackView,
    CustomReleaseView,
    hijack_status_api,
    hijack_user_api,
    release_hijack_api
)

urlpatterns = [
    # Authentication endpoints
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('token/refresh/', EnhancedTokenRefreshView.as_view(), name='token_refresh'),
    
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
    
    # Session management endpoints
    path('sessions/', UserSessionsView.as_view(), name='user_sessions'),
    path('sessions/terminate/', TerminateSessionView.as_view(), name='terminate_session'),
    path('sessions/terminate-all/', TerminateAllSessionsView.as_view(), name='terminate_all_sessions'),
    
    # Security audit
    path('security-logs/', SecurityLogsView.as_view(), name='security_logs'),
    
    # Hijack endpoints (admin only)
    path('hijack/<int:user_id>/', CustomHijackView.as_view(), name='custom_hijack'),
    path('hijack/release/', CustomReleaseView.as_view(), name='custom_release'),
    path('hijack/status/', hijack_status_api, name='hijack_status_api'),
    path('hijack/user/<int:user_id>/', hijack_user_api, name='hijack_user_api'),
    path('hijack/release-api/', release_hijack_api, name='release_hijack_api'),
]