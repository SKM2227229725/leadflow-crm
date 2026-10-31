from django.utils import timezone

from activities.models import Activity, ActivityStatus
from leads.models import ACTIVE_EXCLUDED, Lead, Stage


def build_summary(user, now=None):
    """All numbers are computed from the DB and scoped to `user`."""
    now = now or timezone.now()
    leads = Lead.objects.filter(created_by=user)
    acts = Activity.objects.filter(created_by=user)
    
    # Naya: Recent Leads (Top 3) - Latest created pehle
    recent_leads_qs = leads.order_by('-created_at')[:3]
    recent_leads = [
        {
            "id": l.id, 
            "name": l.name, 
            "company": l.company, 
            "stage": l.stage
        } 
        for l in recent_leads_qs
    ]

    # Naya: Upcoming Follow-ups (Top 3) - Due date ke hisaab se
    upcoming_qs = acts.filter(status=ActivityStatus.PENDING).order_by('due_at')[:3]
    upcoming_followups = [
        {
            "id": a.id, 
            "title": a.title, 
            "dueAt": a.due_at, 
            "leadName": a.lead.name, 
            "isOverdue": a.due_at < now
        }
        for a in upcoming_qs
    ]

    return {
        "totalLeads": leads.count(),
        "activeLeads": leads.exclude(stage__in=ACTIVE_EXCLUDED).count(),
        "wonLeads": leads.filter(stage=Stage.WON).count(),
        "pendingFollowUps": acts.filter(status=ActivityStatus.PENDING).count(),
        "overdueFollowUps": acts.overdue(now).count(),
        "recentLeads": recent_leads,              # Naya
        "upcomingFollowups": upcoming_followups,  # Naya
    }