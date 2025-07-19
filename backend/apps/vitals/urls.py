from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VitalReadingViewSet

router = DefaultRouter()
# Register at root level so endpoints are /api/v1/vitals/ instead of /api/v1/vitals/readings/
router.register(r'', VitalReadingViewSet, basename='vital-reading')

urlpatterns = [
    path('', include(router.urls)),
]