from django.contrib import admin
from django.urls import include, path

from . import views

handler404 = "config.views.json_404"
handler500 = "config.views.json_500"

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/health", views.health, name="health"),
    path("api/v1/auth/", include("accounts.urls")),
    path("api/v1/", include("leads.urls")),
    path("api/v1/", include("activities.urls")),
    path("api/v1/dashboard/", include("dashboard.urls")),
]
