from rest_framework.routers import SimpleRouter

from .views import LeadViewSet

router = SimpleRouter(trailing_slash=False)
router.register("leads", LeadViewSet, basename="lead")
urlpatterns = router.urls
