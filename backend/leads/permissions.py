from rest_framework.permissions import BasePermission


class IsOwner(BasePermission):
    """Object-level check; querysets are *also* scoped to the user (defense in depth)."""

    def has_object_permission(self, request, view, obj):
        return obj.created_by_id == request.user.id
