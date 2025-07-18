from django.urls import path
from .views import HealthReportListCreateView, HealthReportDetailView

urlpatterns = [
    path('', HealthReportListCreateView.as_view(), name='report-list-create'),
    path('<int:pk>/', HealthReportDetailView.as_view(), name='report-detail'),
]