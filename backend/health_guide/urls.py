"""
URL configuration for health_guide project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

urlpatterns = [
    path('admin/', admin.site.urls),
    # API Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/schema/swagger-ui/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/schema/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    # API Endpoints
    path('api/v1/auth/', include('apps.authentication.urls')),
    path('api/v1/prescriptions/', include('apps.prescriptions.urls')),
    path('api/v1/vitals/', include('apps.vitals.urls')),
    path('api/v1/reports/', include('apps.reports.urls')),
    path('api/v1/emergency/', include('apps.emergency.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)