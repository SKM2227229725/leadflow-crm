from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from config.exceptions import Conflict

from .models import User


class UserSerializer(serializers.ModelSerializer):
    """Safe public profile - never includes password or hash."""

    class Meta:
        model = User
        fields = ("id", "name", "email", "role", "created_at")
        read_only_fields = fields


class RegisterSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8, max_length=128, trim_whitespace=False)

    def validate_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Name is required.")
        return value

    def validate_email(self, value):
        value = value.strip().lower()
        if User.objects.filter(email__iexact=value).exists():
            raise Conflict("A user with this email already exists.")
        return value

    def validate(self, attrs):
        validate_password(attrs["password"], user=User(name=attrs["name"], email=attrs["email"]))
        return attrs

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate(self, attrs):
        user = authenticate(
            request=self.context.get("request"),
            username=attrs["email"].strip().lower(),
            password=attrs["password"],
        )
        if user is None or not user.is_active:
            # Same message for unknown email and wrong password (no user enumeration).
            raise serializers.ValidationError({"non_field_errors": ["Invalid email or password."]}, code="authorization")
        attrs["user"] = user
        return attrs
