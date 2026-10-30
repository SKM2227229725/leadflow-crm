"""Uniform success/error envelope for every API response."""
from rest_framework.renderers import JSONRenderer

STATUS_MESSAGES = {200: "Success", 201: "Created", 204: "Deleted"}


def error_response_body(message, errors=None):
    return {"success": False, "message": message, "errors": errors or []}


class EnvelopeJSONRenderer(JSONRenderer):
    def render(self, data, accepted_media_type=None, renderer_context=None):
        response = (renderer_context or {}).get("response")
        # Error bodies are already built by the exception handler.
        if response is not None and response.status_code < 400:
            if not (isinstance(data, dict) and "success" in data):
                data = {
                    "success": True,
                    "message": STATUS_MESSAGES.get(response.status_code, "Success"),
                    "data": data if data is not None else {},
                }
        return super().render(data, accepted_media_type, renderer_context)
