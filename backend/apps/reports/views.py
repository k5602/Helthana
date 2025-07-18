from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import HealthReport
from .serializers import HealthReportSerializer


class HealthReportListCreateView(generics.ListCreateAPIView):
    serializer_class = HealthReportSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return HealthReport.objects.filter(user=self.request.user, is_active=True)


class HealthReportDetailView(generics.RetrieveDestroyAPIView):
    serializer_class = HealthReportSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return HealthReport.objects.filter(user=self.request.user, is_active=True)