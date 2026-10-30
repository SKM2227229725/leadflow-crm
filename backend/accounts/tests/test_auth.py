from datetime import timedelta

from django.test import override_settings
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import AccessToken

from accounts.models import User

REG = "/api/v1/auth/register"
LOGIN = "/api/v1/auth/login"
ME = "/api/v1/auth/me"


class AuthTests(APITestCase):
    def register(self, **over):
        data = {"name": "Asha", "email": "Asha@Example.com", "password": "S3cure-pass-9"}
        data.update(over)
        return self.client.post(REG, data, format="json")

    def test_health(self):
        r = self.client.get("/api/v1/health")
        self.assertEqual(r.status_code, 200)
        self.assertTrue(r.json()["success"])

    def test_register_success_and_safe_response(self):
        r = self.register()
        self.assertEqual(r.status_code, 201)
        body = r.json()
        self.assertTrue(body["success"])
        self.assertNotIn("password", str(body).lower().replace("password_", ""))
        self.assertIn("access", body["data"]["tokens"])
        self.assertEqual(body["data"]["user"]["email"], "asha@example.com")

    def test_email_normalization_and_duplicate_409(self):
        self.register()
        r = self.register(email="  ASHA@example.COM ")
        self.assertEqual(r.status_code, 409)
        self.assertFalse(r.json()["success"])
        self.assertEqual(User.objects.count(), 1)

    def test_password_is_hashed(self):
        self.register()
        u = User.objects.get(email="asha@example.com")
        self.assertNotEqual(u.password, "S3cure-pass-9")
        self.assertTrue(u.password.startswith("pbkdf2_"))
        self.assertTrue(u.check_password("S3cure-pass-9"))

    def test_register_validation(self):
        self.assertEqual(self.register(email="bad").status_code, 400)
        self.assertEqual(self.register(password="short").status_code, 400)
        self.assertEqual(self.register(name="   ").status_code, 400)

    def test_login_valid_and_invalid(self):
        self.register()
        ok = self.client.post(LOGIN, {"email": "ASHA@example.com", "password": "S3cure-pass-9"}, format="json")
        self.assertEqual(ok.status_code, 200)
        self.assertIn("access", ok.json()["data"]["tokens"])
        bad = self.client.post(LOGIN, {"email": "asha@example.com", "password": "wrong-pass-1"}, format="json")
        self.assertEqual(bad.status_code, 400)
        self.assertEqual(bad.json()["message"], "Validation failed")
        ghost = self.client.post(LOGIN, {"email": "no@one.com", "password": "wrong-pass-1"}, format="json")
        self.assertEqual(ghost.json()["errors"], bad.json()["errors"])  # no user enumeration

    def test_me_requires_valid_token(self):
        self.assertEqual(self.client.get(ME).status_code, 401)
        self.client.credentials(HTTP_AUTHORIZATION="Bearer not-a-token")
        self.assertEqual(self.client.get(ME).status_code, 401)

    def test_me_returns_safe_profile(self):
        token = self.register().json()["data"]["tokens"]["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        r = self.client.get(ME)
        self.assertEqual(r.status_code, 200)
        self.assertEqual(set(r.json()["data"]), {"id", "name", "email", "role", "created_at"})

    def test_expired_token_rejected(self):
        self.register()
        user = User.objects.get(email="asha@example.com")
        token = AccessToken.for_user(user)
        token.set_exp(lifetime=-timedelta(seconds=5))
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(self.client.get(ME).status_code, 401)

    def test_tampered_token_rejected(self):
        token = self.register().json()["data"]["tokens"]["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token[:-4]}abcd")
        self.assertEqual(self.client.get(ME).status_code, 401)

    def test_refresh_flow(self):
        refresh = self.register().json()["data"]["tokens"]["refresh"]
        r = self.client.post("/api/v1/auth/refresh", {"refresh": refresh}, format="json")
        self.assertEqual(r.status_code, 200)
        self.assertIn("access", r.json()["data"])
        bad = self.client.post("/api/v1/auth/refresh", {"refresh": "junk"}, format="json")
        self.assertEqual(bad.status_code, 401)

    def test_unknown_route_json_404(self):
        r = self.client.get("/api/v1/nope")
        self.assertEqual(r.status_code, 404)
        self.assertFalse(r.json()["success"])
