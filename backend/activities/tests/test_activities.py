from datetime import timedelta

from django.utils import timezone
from rest_framework.test import APIClient, APITestCase

from activities.models import Activity
from config.testutils import client_for, make_user
from leads.models import Lead

URL = "/api/v1/activities"


class ActivityTests(APITestCase):
    def setUp(self):
        self.u1, self.u2 = make_user("u1@x.com"), make_user("u2@x.com")
        self.c1, self.c2 = client_for(self.u1), client_for(self.u2)
        self.lead = Lead.objects.create(name="L1", email="l@x.com", created_by=self.u1)
        self.other_lead = Lead.objects.create(name="L2", email="m@x.com", created_by=self.u2)

    def payload(self, **over):
        d = {"leadId": self.lead.id, "title": "Call back", "dueAt": (timezone.now() + timedelta(days=1)).isoformat(), "type": "Call"}
        d.update(over)
        return d

    def create(self, **over):
        return self.c1.post(URL, self.payload(**over), format="json")

    def test_requires_auth(self):
        self.assertEqual(APIClient().get(URL).status_code, 401)

    def test_create_valid(self):
        r = self.create()
        self.assertEqual(r.status_code, 201)
        d = r.json()["data"]
        self.assertEqual(d["status"], "Pending")
        self.assertIsNone(d["completedAt"])
        self.assertEqual(d["leadName"], "L1")
        self.assertFalse(d["isOverdue"])
        self.assertEqual(Activity.objects.get().created_by, self.u1)

    def test_invalid_lead_reference(self):
        self.assertEqual(self.create(leadId=99999).status_code, 400)
        self.assertEqual(self.create(leadId="abc").status_code, 400)
        self.assertEqual(self.create(leadId=None).status_code, 400)
        self.assertEqual(self.create(leadId=self.other_lead.id).status_code, 400)  # someone else's lead
        self.assertEqual(Activity.objects.count(), 0)

    def test_invalid_fields(self):
        self.assertEqual(self.create(title="").status_code, 400)
        self.assertEqual(self.create(title="  ").status_code, 400)
        self.assertEqual(self.create(dueAt="not-a-date").status_code, 400)
        self.assertEqual(self.create(type="Fax").status_code, 400)
        self.assertEqual(self.create(status="Done").status_code, 400)
        d = self.payload(); d.pop("dueAt")
        self.assertEqual(self.c1.post(URL, d, format="json").status_code, 400)

    def test_client_cannot_set_ownership_or_completed_at(self):
        self.assertEqual(self.create(createdBy=self.u2.id).status_code, 400)
        self.assertEqual(self.create(completedAt="2020-01-01T00:00:00Z").status_code, 400)
        self.assertEqual(self.create(created_by=self.u2.id).status_code, 400)

    def test_mark_complete_sets_server_timestamp(self):
        act_id = self.create().json()["data"]["id"]
        before = timezone.now()
        r = self.c1.patch(f"{URL}/{act_id}", {"status": "Completed"}, format="json")
        self.assertEqual(r.status_code, 200)
        a = Activity.objects.get(pk=act_id)
        self.assertEqual(a.status, "Completed")
        self.assertGreaterEqual(a.completed_at, before)
        # client-supplied completedAt rejected
        r = self.c1.patch(f"{URL}/{act_id}", {"completedAt": "2001-01-01T00:00:00Z"}, format="json")
        self.assertEqual(r.status_code, 400)
        # re-completing does not move the timestamp
        first = a.completed_at
        self.c1.patch(f"{URL}/{act_id}", {"status": "Completed"}, format="json")
        self.assertEqual(Activity.objects.get(pk=act_id).completed_at, first)

    def test_cannot_move_activity_to_other_lead(self):
        act_id = self.create().json()["data"]["id"]
        r = self.c1.patch(f"{URL}/{act_id}", {"leadId": self.other_lead.id}, format="json")
        self.assertEqual(r.status_code, 400)

    def test_overdue_rules(self):
        past = timezone.now() - timedelta(hours=1)
        pending_past = Activity.objects.create(lead=self.lead, created_by=self.u1, title="p", due_at=past)
        done_past = Activity.objects.create(lead=self.lead, created_by=self.u1, title="d", due_at=past, status="Completed")
        future = Activity.objects.create(lead=self.lead, created_by=self.u1, title="f", due_at=timezone.now() + timedelta(hours=1))
        overdue_ids = set(Activity.objects.overdue().values_list("id", flat=True))
        self.assertEqual(overdue_ids, {pending_past.id})
        self.assertTrue(pending_past.is_overdue)
        self.assertFalse(done_past.is_overdue)
        self.assertFalse(future.is_overdue)
        r = self.c1.get(URL, {"overdue": "true"})
        self.assertEqual([x["id"] for x in r.json()["data"]], [pending_past.id])

    def test_status_filter_and_invalid(self):
        self.create(); 
        a = self.create().json()["data"]["id"]
        self.c1.patch(f"{URL}/{a}", {"status": "Completed"}, format="json")
        self.assertEqual(len(self.c1.get(URL, {"status": "Completed"}).json()["data"]), 1)
        self.assertEqual(len(self.c1.get(URL, {"status": "Pending"}).json()["data"]), 1)
        self.assertEqual(self.c1.get(URL, {"status": "Nope"}).status_code, 400)

    def test_cross_user_access(self):
        act_id = self.create().json()["data"]["id"]
        self.assertEqual(self.c2.get(URL).json()["data"], [])
        self.assertEqual(self.c2.get(f"{URL}/{act_id}").status_code, 404)
        self.assertEqual(self.c2.patch(f"{URL}/{act_id}", {"status": "Completed"}, format="json").status_code, 404)

    def test_malformed_id(self):
        self.assertEqual(self.c1.patch(f"{URL}/abc", {"status": "Completed"}, format="json").status_code, 400)

    def test_naive_datetime_stored_as_utc_aware(self):
        r = self.create(dueAt="2030-01-01T10:00:00")
        self.assertEqual(r.status_code, 201)
        a = Activity.objects.get()
        self.assertIsNotNone(a.due_at.tzinfo)
        self.assertEqual(a.due_at.utcoffset(), timedelta(0))

    def test_cascade_delete_with_lead(self):
        self.create(); self.create()
        self.assertEqual(Activity.objects.count(), 2)
        self.assertEqual(self.c1.delete(f"/api/v1/leads/{self.lead.id}").status_code, 204)
        self.assertEqual(Activity.objects.count(), 0)
