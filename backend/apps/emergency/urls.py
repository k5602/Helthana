from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EmergencyContactViewSet, EmergencyAlertViewSet

router = DefaultRouter()
router.register(r'contacts', EmergencyContactViewSet, basename='emergency-contact')
router.register(r'alerts', EmergencyAlertViewSet, basename='emergency-alert')

urlpatterns = [
    path('', include(router.urls)),
]