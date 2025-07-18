from django.urls import path
from .views import (
    PrescriptionListCreateView,
    PrescriptionDetailView,
    MedicationListView
)

urlpatterns = [
    path('', PrescriptionListCreateView.as_view(), name='prescription-list-create'),
    path('<int:pk>/', PrescriptionDetailView.as_view(), name='prescription-detail'),
    path('medications/', MedicationListView.as_view(), name='medication-list'),
]