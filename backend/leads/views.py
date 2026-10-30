from django.db.models import Q
from rest_framework import viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated

from config.viewmixins import SafePkMixin

from .models import Lead, Stage
from .permissions import IsOwner
from .serializers import LeadSerializer


class LeadViewSet(SafePkMixin, viewsets.ModelViewSet):
    serializer_class = LeadSerializer
    permission_classes = [IsAuthenticated, IsOwner]
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_queryset(self):
        qs = Lead.objects.filter(created_by=self.request.user)
        params = self.request.query_params
        search = params.get("search", "").strip()
        if search:
            qs = qs.filter(Q(name__icontains=search) | Q(company__icontains=search))
        stage = params.get("stage", "").strip()
        if stage:
            if stage not in Stage.values:
                raise ValidationError({"stage": [f"Invalid stage. Allowed: {', '.join(Stage.values)}"]})
            qs = qs.filter(stage=stage)
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)  # ownership only from request.user
