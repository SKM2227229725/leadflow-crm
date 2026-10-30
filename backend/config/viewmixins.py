from rest_framework.exceptions import ValidationError


class SafePkMixin:
    """Validate the path identifier before it reaches the ORM."""

    lookup_value_regex = r"[^/.]+"

    def get_object(self):
        pk = str(self.kwargs.get(self.lookup_field, ""))
        if not (pk.isdigit() and len(pk) <= 18 and int(pk) > 0):
            raise ValidationError({"id": ["Invalid identifier."]})
        return super().get_object()
