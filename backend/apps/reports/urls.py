from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import HealthReportViewSet

router = DefaultRouter()
router.register(r'', HealthReportViewSet, basename='health-report')

urlpatterns = [
    path('', include(router.urls)),
]