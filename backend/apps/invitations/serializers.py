# apps/invitations/serializers.py
from rest_framework import serializers
from .models import TestInvitation


class InvitationListSerializer(serializers.ModelSerializer):
    """Serializer para listar invitaciones (y usado en respuestas)"""
    test_title = serializers.CharField(source='test.title')
    test_id = serializers.IntegerField(source='test.id')
    inviter_name = serializers.CharField(source='invited_by.username')
    guest_user_id = serializers.IntegerField(source='guest_user.id', read_only=True, allow_null=True)
    guest_name = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    invitation_url = serializers.SerializerMethodField()

    class Meta:
        model = TestInvitation
        fields = [
            'id', 'test_id', 'test_title', 'invited_by', 'inviter_name',
            'guest_user_id', 'guest_name', 'message',
            'is_used', 'is_guest', 'expires_at', 'created_at', 'updated_at',
            'status', 'invitation_url'
        ]

    def get_guest_name(self, obj):
        return obj.guest_user.username if obj.guest_user else None

    def get_status(self, obj):
        return obj.status

    def get_invitation_url(self, obj):
        return obj.invitation_url


class InvitationCreateSerializer(serializers.Serializer):
    """Serializer para crear invitaciones"""
    test_id = serializers.IntegerField()
    message = serializers.CharField(required=False, allow_blank=True, allow_null=True, default='')

    def validate_test_id(self, value):
        from apps.test.models import Test
        if not Test.objects.filter(id=value, is_active=True).exists():
            raise serializers.ValidationError("Test no encontrado o inactivo")
        return value


class InvitationAcceptSerializer(serializers.Serializer):
    """Serializer para aceptar invitaciones"""
    as_guest = serializers.BooleanField(default=False, required=False)