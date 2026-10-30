from rest_framework.test import APIClient, APITestCase

from config.testutils import client_for, make_user
from leads.models import Lead

URL = "/api/v1/leads"


class LeadTests(APITestCase):
    def setUp(self):
        self.u1, self.u2 = make_user("u1@x.com"), make_user("u2@x.com")
        self.c1, self.c2 = client_for(self.u1), client_for(self.u2)

    def create(self, client=None, **over):
        data = {"name": "Acme Lead", "email": "Lead@Acme.com", "company": "Acme"}
        data.update(over)
        return (client or self.c1).post(URL, data, format="json")

    # --- auth
    def test_requires_authentication(self):
        anon = APIClient()
        self.assertEqual(anon.get(URL).status_code, 401)
        self.assertEqual(anon.post(URL, {}, format="json").status_code, 401)

    # --- create / view / edit / delete
    def test_create_defaults_and_owner(self):
        r = self.create()
        self.assertEqual(r.status_code, 201)
        d = r.json()["data"]
        self.assertEqual(d["stage"], "New")
        self.assertEqual(d["createdBy"], self.u1.id)
        self.assertEqual(d["email"], "lead@acme.com")

    def test_create_with_phone_only(self):
        self.assertEqual(self.create(email="", phone="+91 98765 43210").status_code, 201)

    def test_view_edit_delete(self):
        lead_id = self.create().json()["data"]["id"]
        self.assertEqual(self.c1.get(f"{URL}/{lead_id}").status_code, 200)
        r = self.c1.patch(f"{URL}/{lead_id}", {"company": "NewCo", "budget": "2500.50"}, format="json")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(Lead.objects.get(pk=lead_id).company, "NewCo")
        self.assertEqual(self.c1.delete(f"{URL}/{lead_id}").status_code, 204)
        self.assertEqual(self.c1.get(f"{URL}/{lead_id}").status_code, 404)

    # --- validation
    def test_missing_name(self):
        self.assertEqual(self.create(name="").status_code, 400)
        self.assertEqual(self.create(name="   ").status_code, 400)
        r = self.c1.post(URL, {"email": "a@b.com"}, format="json")
        self.assertEqual(r.status_code, 400)

    def test_missing_email_and_phone(self):
        r = self.c1.post(URL, {"name": "No contact"}, format="json")
        self.assertEqual(r.status_code, 400)
        self.assertFalse(r.json()["success"])

    def test_patch_cannot_remove_last_contact_method(self):
        lead_id = self.create().json()["data"]["id"]
        self.assertEqual(self.c1.patch(f"{URL}/{lead_id}", {"email": ""}, format="json").status_code, 400)

    def test_invalid_email_negative_budget_invalid_stage(self):
        self.assertEqual(self.create(email="not-an-email").status_code, 400)
        self.assertEqual(self.create(budget=-1).status_code, 400)
        self.assertEqual(self.create(stage="Bogus").status_code, 400)
        self.assertEqual(self.create(serviceInterest="Bogus").status_code, 400)

    def test_malformed_ids(self):
        for bad in ["abc", "0", "-1", "1;DROP", "9" * 40]:
            self.assertEqual(self.c1.get(f"{URL}/{bad}").status_code, 400, bad)
        self.assertEqual(self.c1.get(f"{URL}/999999").status_code, 404)

    # --- protected fields
    def test_protected_fields_rejected(self):
        for field, val in [("createdBy", self.u2.id), ("id", 99), ("createdAt", "2020-01-01T00:00:00Z"),
                           ("updatedAt", "2020-01-01T00:00:00Z"), ("created_by", self.u2.id)]:
            r = self.create(**{field: val})
            self.assertEqual(r.status_code, 400, field)
        lead_id = self.create().json()["data"]["id"]
        r = self.c1.patch(f"{URL}/{lead_id}", {"createdBy": self.u2.id}, format="json")
        self.assertEqual(r.status_code, 400)
        self.assertEqual(Lead.objects.get(pk=lead_id).created_by_id, self.u1.id)

    # --- stage pipeline
    def test_stage_updates_all_six(self):
        lead_id = self.create().json()["data"]["id"]
        for stage in ["Contacted", "Qualified", "Proposal Sent", "Won", "Lost", "New"]:
            r = self.c1.patch(f"{URL}/{lead_id}", {"stage": stage}, format="json")
            self.assertEqual(r.status_code, 200)
            self.assertEqual(Lead.objects.get(pk=lead_id).stage, stage)
        self.assertEqual(self.c1.patch(f"{URL}/{lead_id}", {"stage": "Nope"}, format="json").status_code, 400)

    # --- search / filter
    def test_search_and_filter(self):
        self.create(name="Alpha Studio", company="Zed", email="a@a.com")
        self.create(name="Beta", company="Alphabet Inc", email="b@b.com", stage="Won")
        self.create(name="Gamma", company="Other", email="g@g.com")
        names = lambda r: sorted(x["name"] for x in r.json()["data"])
        self.assertEqual(names(self.c1.get(URL, {"search": "alpha"})), ["Alpha Studio", "Beta"])
        self.assertEqual(names(self.c1.get(URL, {"stage": "Won"})), ["Beta"])
        self.assertEqual(names(self.c1.get(URL, {"search": "alpha", "stage": "New"})), ["Alpha Studio"])
        self.assertEqual(self.c1.get(URL, {"stage": "Bad"}).status_code, 400)
        self.assertEqual(len(self.c1.get(URL).json()["data"]), 3)

    # --- cross-user access
    def test_cross_user_isolation(self):
        lead_id = self.create().json()["data"]["id"]
        self.assertEqual(self.c2.get(URL).json()["data"], [])
        self.assertEqual(self.c2.get(f"{URL}/{lead_id}").status_code, 404)
        self.assertEqual(self.c2.patch(f"{URL}/{lead_id}", {"name": "Hacked"}, format="json").status_code, 404)
        self.assertEqual(self.c2.delete(f"{URL}/{lead_id}").status_code, 404)
        self.assertEqual(Lead.objects.get(pk=lead_id).name, "Acme Lead")

    def test_put_not_allowed(self):
        lead_id = self.create().json()["data"]["id"]
        self.assertEqual(self.c1.put(f"{URL}/{lead_id}", {"name": "x"}, format="json").status_code, 405)
