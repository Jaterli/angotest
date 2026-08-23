from django.contrib import admin
from .models import TestInvitation

@admin.register(TestInvitation)
class TestInvitationAdmin(admin.ModelAdmin):
    list_display = ('test', 'invited_by', 'guest_user', 'status', 'is_guest', 'is_used', 'expires_at', 'created_at')
    list_filter = ('is_used', 'is_guest') 
    search_fields = ('test__title', 'invited_by__username', 'guest_user__username', 'token')
    readonly_fields = ('token', 'created_at', 'updated_at', 'invitation_url')
    ordering = ('-created_at',)

    def invitation_url(self, obj):
        return obj.invitation_url
    invitation_url.short_description = 'URL de invitación'