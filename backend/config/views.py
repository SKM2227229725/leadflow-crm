from django.http import JsonResponse
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.response import Response


@api_view(["GET"])
@authentication_classes([])
@permission_classes([])
def health(request):
    return Response({"status": "ok"})


def json_404(request, exception=None):
    return JsonResponse({"success": False, "message": "Not found", "errors": []}, status=404)


def json_500(request):
    return JsonResponse({"success": False, "message": "Internal server error", "errors": []}, status=500)
