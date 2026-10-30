from rest_framework import viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated

from config.viewmixins import SafePkMixin
from leads.permissions import IsOwner

from .models import Activity, ActivityStatus
from .serializers import ActivitySerializer


class ActivityViewSet(SafePkMixin, viewsets.ModelViewSet):
    serializer_class = ActivitySerializer
    permission_classes = [IsAuthenticated, IsOwner]
    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_queryset(self):
        qs = Activity.objects.filter(created_by=self.request.user).select_related("lead")
        params = self.request.query_params
        status = params.get("status", "").strip()
        if status:
            if status not in ActivityStatus.values:
                raise ValidationError({"status": [f"Invalid status. Allowed: {', '.join(ActivityStatus.values)}"]})
            qs = qs.filter(status=status)
        lead_id = params.get("leadId", "").strip()
        if lead_id:
            if not lead_id.isdigit() or len(lead_id) > 18:
                raise ValidationError({"leadId": ["Invalid identifier."]})
            qs = qs.filter(lead_id=int(lead_id))
        if params.get("overdue", "").lower() == "true":
            qs = qs.overdue()
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
