"""
Development settings for health_guide project.
"""

from .base import *
import dj_database_url
import socket

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0', '*']

# Database - Use SQLite for development (temporary until PostgreSQL is set up)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# CORS settings for development - Enhanced for frontend-backend communication
# Base localhost origins
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "http://localhost:5173",  # Vite default port
    "http://127.0.0.1:5173",
    "http://localhost:5174",  # Alternative Vite port
    "http://127.0.0.1:5174",
    "http://localhost:4173",  # Vite preview port
    "http://127.0.0.1:4173",
    "http://localhost:8000",  # Django dev server
    "http://127.0.0.1:8000",
]

# Add network IP origins dynamically from system
def get_local_ip():
    """Get the local network IP address of the system"""
    try:
        # Connect to a remote address to determine local IP
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.connect(("8.8.8.8", 80))
            return s.getsockname()[0]
    except Exception:
        return None

NETWORK_IP = get_local_ip()
if NETWORK_IP and NETWORK_IP != '127.0.0.1':
    CORS_ALLOWED_ORIGINS.extend([
        f"http://{NETWORK_IP}:8080",  # Network frontend
        f"http://{NETWORK_IP}:8000",  # Network backend
        f"http://{NETWORK_IP}:5173",  # Network Vite
        f"http://{NETWORK_IP}:5174",  # Network Vite alt
        f"http://{NETWORK_IP}:4173",  # Network Vite preview
    ])

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_ALL_ORIGINS = DEBUG  # Allow all origins in development

# Additional CORS settings for network access
CORS_ALLOW_PRIVATE_NETWORK = True  # Allow private network access

# Enhanced CORS headers for authentication and API functionality
CORS_ALLOWED_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
    'cache-control',
    'pragma',
    'expires',
    'x-forwarded-for',
    'x-forwarded-proto',
    'x-real-ip',
    'referer',
]

# Allow specific HTTP methods for API endpoints
CORS_ALLOWED_METHODS = [
    'DELETE',
    'GET',
    'HEAD',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

# Expose headers that frontend might need
CORS_EXPOSE_HEADERS = [
    'content-type',
    'x-csrftoken',
    'authorization',
    'cache-control',
    'expires',
    'pragma',
]

# Preflight request cache time (1 hour for development)
CORS_PREFLIGHT_MAX_AGE = 3600

# Cache configuration
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
    }
}

# Email backend for development - use console backend
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Frontend URL for development
FRONTEND_URL = config('FRONTEND_URL', default='http://localhost:5173')

# Disable email verification in development
REQUIRE_EMAIL_VERIFICATION = False

# Disable security settings for development
SECURE_BROWSER_XSS_FILTER = False
SECURE_CONTENT_TYPE_NOSNIFF = False
X_FRAME_OPTIONS = 'SAMEORIGIN'