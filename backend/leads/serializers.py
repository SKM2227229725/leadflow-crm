import re

from rest_framework import serializers

from config.serializers import StrictInputMixin

from .models import SERVICE_CHOICES, SOURCE_CHOICES, Lead, Stage

PHONE_RE = re.compile(r"^[0-9+()\-.\s]{5,30}$")


class LeadSerializer(StrictInputMixin, serializers.ModelSerializer):
    serviceInterest = serializers.ChoiceField(source="service_interest", choices=SERVICE_CHOICES, required=False, allow_blank=True)
    source = serializers.ChoiceField(choices=SOURCE_CHOICES, required=False, allow_blank=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    budget = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=0, required=False, allow_null=True)
    stage = serializers.ChoiceField(choices=Stage.choices, required=False)
    createdBy = serializers.IntegerField(source="created_by_id", read_only=True)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)

    class Meta:
        model = Lead
        fields = ("id", "name", "company", "email", "phone", "serviceInterest", "source",
                  "budget", "stage", "createdBy", "createdAt", "updatedAt")
        read_only_fields = ("id",)

    def validate_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Name is required.")
        return value

    def validate_email(self, value):
        return value.strip().lower()

    def validate_phone(self, value):
        value = value.strip()
        if value and not PHONE_RE.match(value):
            raise serializers.ValidationError("Enter a valid phone number.")
        return value

    def validate_company(self, value):
        return value.strip()

    def validate(self, attrs):
        # Merge with the stored values so PATCH cannot remove the last contact method.
        current = self.instance
        email = attrs.get("email", current.email if current else "")
        phone = attrs.get("phone", current.phone if current else "")
        if not email and not phone:
            raise serializers.ValidationError({"email": ["Provide at least one of email or phone."],
                                               "phone": ["Provide at least one of email or phone."]})
        return attrs
