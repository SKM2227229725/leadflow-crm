from django.conf import settings
from django.db import models
from django.utils import timezone


class ActivityType(models.TextChoices):
    CALL = "Call", "Call"
    EMAIL = "Email", "Email"
    MEETING = "Meeting", "Meeting"
    TASK = "Task", "Task"


class ActivityStatus(models.TextChoices):
    PENDING = "Pending", "Pending"
    COMPLETED = "Completed", "Completed"


class ActivityQuerySet(models.QuerySet):
    def overdue(self, now=None):
        """Pending AND due strictly before the current server time."""
        return self.filter(status=ActivityStatus.PENDING, due_at__lt=now or timezone.now())


class Activity(models.Model):
    lead = models.ForeignKey("leads.Lead", on_delete=models.CASCADE, related_name="activities")  # cascade delete
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="activities")
    title = models.CharField(max_length=200)
    due_at = models.DateTimeField()
    type = models.CharField(max_length=10, choices=ActivityType.choices, default=ActivityType.TASK)
    status = models.CharField(max_length=10, choices=ActivityStatus.choices, default=ActivityStatus.PENDING)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = ActivityQuerySet.as_manager()

    class Meta:
        ordering = ["due_at", "id"]
        indexes = [models.Index(fields=["created_by", "status", "due_at"])]
        verbose_name_plural = "activities"

    @property
    def is_overdue(self):
        return self.status == ActivityStatus.PENDING and self.due_at < timezone.now()

    def apply_status_transition(self):
        """completedAt is server-generated only."""
        if self.status == ActivityStatus.COMPLETED and self.completed_at is None:
            self.completed_at = timezone.now()
        elif self.status == ActivityStatus.PENDING:
            self.completed_at = None

    def save(self, *args, **kwargs):
        self.apply_status_transition()
        super().save(*args, **kwargs)
