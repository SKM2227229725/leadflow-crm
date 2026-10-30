from rest_framework import serializers

from config.serializers import StrictInputMixin
from leads.models import Lead

from .models import Activity, ActivityStatus, ActivityType


class OwnedLeadField(serializers.PrimaryKeyRelatedField):
    """Lead must exist AND belong to the authenticated user (same error for both)."""

    def get_queryset(self):
        return Lead.objects.filter(created_by=self.context["request"].user)

    def to_internal_value(self, data):
        if isinstance(data, bool) or not str(data).isdigit():
            raise serializers.ValidationError("Invalid lead identifier.")
        return super().to_internal_value(data)


class ActivitySerializer(StrictInputMixin, serializers.ModelSerializer):
    leadId = OwnedLeadField(source="lead")
    leadName = serializers.CharField(source="lead.name", read_only=True)
    title = serializers.CharField(max_length=200)
    dueAt = serializers.DateTimeField(source="due_at")
    type = serializers.ChoiceField(choices=ActivityType.choices, required=False)
    status = serializers.ChoiceField(choices=ActivityStatus.choices, required=False)
    completedAt = serializers.DateTimeField(source="completed_at", read_only=True)
    isOverdue = serializers.BooleanField(source="is_overdue", read_only=True)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = Activity
        fields = ("id", "leadId", "leadName", "title", "dueAt", "type", "status",
                  "completedAt", "isOverdue", "createdAt")
        read_only_fields = ("id",)

    def get_writable_keys(self):
        keys = super().get_writable_keys()
        if self.instance is not None:
            keys.discard("leadId")  # a follow-up cannot be moved to another lead
        return keys

    def validate_title(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Title is required.")
        return value
