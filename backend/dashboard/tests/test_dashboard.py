from datetime import timedelta

from django.utils import timezone
from rest_framework.test import APIClient, APITestCase

from activities.models import Activity
from config.testutils import client_for, make_user
from leads.models import Lead

URL = "/api/v1/dashboard/summary"


class DashboardTests(APITestCase):
    def test_requires_auth(self):
        self.assertEqual(APIClient().get(URL).status_code, 401)

    def test_empty_is_zero(self):
        u = make_user()
        self.assertEqual(client_for(u).get(URL).json()["data"],
                         {"totalLeads": 0, "activeLeads": 0, "wonLeads": 0, "pendingFollowUps": 0, "overdueFollowUps": 0})

    def test_counts_match_fixtures_and_are_isolated(self):
        u1, u2 = make_user("u1@x.com"), make_user("u2@x.com")
        stages = ["New", "Contacted", "Qualified", "Proposal Sent", "Won", "Won", "Lost"]
        leads = [Lead.objects.create(name=f"L{i}", email="a@a.com", stage=s, created_by=u1) for i, s in enumerate(stages)]
        other = Lead.objects.create(name="Other", email="o@o.com", stage="Won", created_by=u2)
        now = timezone.now()
        mk = lambda lead, user, delta, status="Pending": Activity.objects.create(
            lead=lead, created_by=user, title="t", due_at=now + delta, status=status)
        mk(leads[0], u1, -timedelta(days=1))                  # pending + overdue
        mk(leads[0], u1, -timedelta(minutes=5))               # pending + overdue
        mk(leads[1], u1, timedelta(days=2))                   # pending, not overdue
        mk(leads[2], u1, -timedelta(days=3), "Completed")     # completed: never overdue
        mk(other, u2, -timedelta(days=1))                     # other user's data
        data = client_for(u1).get(URL).json()["data"]
        self.assertEqual(data, {"totalLeads": 7, "activeLeads": 4, "wonLeads": 2, "pendingFollowUps": 3, "overdueFollowUps": 2})
        d2 = client_for(u2).get(URL).json()["data"]
        self.assertEqual(d2, {"totalLeads": 1, "activeLeads": 0, "wonLeads": 1, "pendingFollowUps": 1, "overdueFollowUps": 1})
