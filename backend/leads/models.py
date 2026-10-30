from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models


class Stage(models.TextChoices):
    NEW = "New", "New"
    CONTACTED = "Contacted", "Contacted"
    QUALIFIED = "Qualified", "Qualified"
    PROPOSAL = "Proposal Sent", "Proposal Sent"
    WON = "Won", "Won"
    LOST = "Lost", "Lost"


ACTIVE_EXCLUDED = [Stage.WON, Stage.LOST]

SERVICE_CHOICES = [(v, v) for v in ["Web Development", "Digital Marketing", "SEO", "Social Media", "Branding", "Other"]]
SOURCE_CHOICES = [(v, v) for v in ["Website", "Referral", "Social Media", "Email", "Direct Outreach", "Other"]]


class Lead(models.Model):
    name = models.CharField(max_length=150)
    company = models.CharField(max_length=150, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=30, blank=True)
    service_interest = models.CharField(max_length=40, choices=SERVICE_CHOICES, blank=True)
    source = models.CharField(max_length=40, choices=SOURCE_CHOICES, blank=True)
    budget = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0)])
    stage = models.CharField(max_length=20, choices=Stage.choices, default=Stage.NEW)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="leads")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at", "-id"]
        indexes = [models.Index(fields=["created_by", "stage"])]

    def __str__(self):
        return self.name
