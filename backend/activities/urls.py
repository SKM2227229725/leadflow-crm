from rest_framework.routers import SimpleRouter

from .views import ActivityViewSet

router = SimpleRouter(trailing_slash=False)
router.register("activities", ActivityViewSet, basename="activity")
urlpatterns = router.urls
