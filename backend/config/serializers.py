from rest_framework import serializers


class StrictInputMixin:
    """Reject any input key that is not an explicitly writable field.

    This blocks attempts to set ownership / system fields (id, createdBy,
    createdAt, completedAt...) instead of silently ignoring them.
    """

    def get_writable_keys(self):
        return {name for name, f in self.fields.items() if not f.read_only}

    def to_internal_value(self, data):
        if hasattr(data, "keys"):
            extra = set(data.keys()) - self.get_writable_keys()
            if extra:
                raise serializers.ValidationError(
                    {key: ["This field is unknown or cannot be modified."] for key in sorted(extra)}
                )
        return super().to_internal_value(data)
