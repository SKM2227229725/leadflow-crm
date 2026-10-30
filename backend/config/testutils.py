from rest_framework.test import APIClient

from accounts.models import User


def make_user(email="a@example.com", name="A"):
    return User.objects.create_user(email=email, password="S3cure-pass-9", name=name)


def client_for(user):
    c = APIClient()
    c.force_authenticate(user=user)
    return c
