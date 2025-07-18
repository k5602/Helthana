from django.urls import path
from .views import VitalReadingListCreateView, VitalReadingDetailView

urlpatterns = [
    path('', VitalReadingListCreateView.as_view(), name='vital-list-create'),
    path('<int:pk>/', VitalReadingDetailView.as_view(), name='vital-detail'),
]