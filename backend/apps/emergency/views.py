from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import EmergencyContact, EmergencyAlert
from .serializers import EmergencyContactSerializer, EmergencyAlertSerializer


class EmergencyContactListCreateView(generics.ListCreateAPIView):
    serializer_class = EmergencyContactSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return EmergencyContact.objects.filter(user=self.request.user, is_active=True)


class EmergencyContactDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = EmergencyContactSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return EmergencyContact.objects.filter(user=self.request.user, is_active=True)


class EmergencyAlertCreateView(generics.CreateAPIView):
    serializer_class = EmergencyAlertSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        # TODO: Implement Twilio SMS/call functionality
        response = super().create(request, *args, **kwargs)
        return Response({
            'message': 'Emergency alert sent successfully',
            'alert': response.data
        }, status=status.HTTP_201_CREATED)