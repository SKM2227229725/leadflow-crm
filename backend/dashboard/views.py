from rest_framework.response import Response
from rest_framework.views import APIView

from .services import build_summary


class SummaryView(APIView):
    def get(self, request):
        data = build_summary(request.user)
        return Response({
            "success": True,
            "message": "Success",
            "data": data
        })