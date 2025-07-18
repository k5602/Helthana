from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import VitalReading
from .serializers import VitalReadingSerializer


class VitalReadingListCreateView(generics.ListCreateAPIView):
    serializer_class = VitalReadingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = VitalReading.objects.filter(user=self.request.user, is_active=True)
        vital_type = self.request.query_params.get('type')
        if vital_type:
            queryset = queryset.filter(vital_type=vital_type)
        return queryset


class VitalReadingDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = VitalReadingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return VitalReading.objects.filter(user=self.request.user, is_active=True)