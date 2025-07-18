from django.urls import path
from .views import (
    EmergencyContactListCreateView,
    EmergencyContactDetailView,
    EmergencyAlertCreateView
)

urlpatterns = [
    path('contacts/', EmergencyContactListCreateView.as_view(), name='emergency-contact-list'),
    path('contacts/<int:pk>/', EmergencyContactDetailView.as_view(), name='emergency-contact-detail'),
    path('alert/', EmergencyAlertCreateView.as_view(), name='emergency-alert'),
]