from django.utils import timezone

from activities.models import Activity, ActivityStatus
from leads.models import ACTIVE_EXCLUDED, Lead, Stage


def build_summary(user, now=None):
    """All numbers are computed from the DB and scoped to `user`."""
    now = now or timezone.now()
    leads = Lead.objects.filter(created_by=user)
    acts = Activity.objects.filter(created_by=user)
    return {
        "totalLeads": leads.count(),
        "activeLeads": leads.exclude(stage__in=ACTIVE_EXCLUDED).count(),
        "wonLeads": leads.filter(stage=Stage.WON).count(),
        "pendingFollowUps": acts.filter(status=ActivityStatus.PENDING).count(),
        "overdueFollowUps": acts.overdue(now).count(),
    }
