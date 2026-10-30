"""Centralized exception handling. Never leaks stack traces to clients."""
import logging

from django.core.exceptions import PermissionDenied as DjangoPermissionDenied
from django.db import IntegrityError
from django.http import Http404
from rest_framework import exceptions, status
from rest_framework.response import Response

from .responses import error_response_body

logger = logging.getLogger(__name__)


class Conflict(exceptions.APIException):
    status_code = status.HTTP_409_CONFLICT
    default_detail = "Resource already exists."
    default_code = "conflict"


def _flatten(detail, prefix=""):
    """Turn DRF error detail into [{'field': ..., 'message': ...}]."""
    out = []
    if isinstance(detail, dict):
        for key, value in detail.items():
            out.extend(_flatten(value, f"{prefix}.{key}" if prefix else str(key)))
    elif isinstance(detail, (list, tuple)):
        for item in detail:
            out.extend(_flatten(item, prefix))
    else:
        out.append({"field": prefix or "non_field_errors", "message": str(detail)})
    return out


def api_exception_handler(exc, context):
    if isinstance(exc, Http404):
        return Response(error_response_body("Not found"), status=404)
    if isinstance(exc, DjangoPermissionDenied):
        return Response(error_response_body("Permission denied"), status=403)
    if isinstance(exc, exceptions.ValidationError):
        return Response(error_response_body("Validation failed", _flatten(exc.detail)), status=400)
    if isinstance(exc, (exceptions.NotAuthenticated, exceptions.AuthenticationFailed)):
        resp = Response(error_response_body("Authentication failed", _flatten(exc.detail)), status=401)
        header = exc.get_headers().get("WWW-Authenticate") if hasattr(exc, "get_headers") else None
        if header:
            resp["WWW-Authenticate"] = header
        return resp
    if isinstance(exc, exceptions.PermissionDenied):
        return Response(error_response_body("Permission denied", _flatten(exc.detail)), status=403)
    if isinstance(exc, exceptions.NotFound):
        return Response(error_response_body("Not found"), status=404)
    if isinstance(exc, exceptions.APIException):
        message = "Conflict" if exc.status_code == 409 else "Request failed"
        return Response(error_response_body(message, _flatten(exc.detail)), status=exc.status_code)
    if isinstance(exc, IntegrityError):
        return Response(error_response_body("Conflict", [{"field": "non_field_errors", "message": "Duplicate or invalid data."}]), status=409)

    # Unexpected: log server-side only (type + traceback), return generic body.
    logger.error("Unhandled API exception", exc_info=exc)
    return Response(error_response_body("Internal server error"), status=500)
