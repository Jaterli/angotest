# apps/invitations/urls.py
from django.urls import path
from .views import (
    CreateInvitationView,
    CheckInvitationView,
    AcceptInvitationView,
    AdminInvitationListView,
    AdminInvitationStatsView,
    AdminDeleteInvitationView,
    AdminDeleteInvitationsBulkView,
)

urlpatterns = [
    # Endpoints públicos (shared)
    path('create/', CreateInvitationView.as_view(), name='create_invitation'),
    path('check-invitation/', CheckInvitationView.as_view(), name='check_invitation'),
    path('accept-invitation/', AcceptInvitationView.as_view(), name='accept_invitation'),

    # Endpoints para el Admin
    path('admin/list/', AdminInvitationListView.as_view(), name='admin_invitations'),
    path('admin/stats/', AdminInvitationStatsView.as_view(), name='admin_invitation_stats'),
    path('admin/<int:invitation_id>/delete/', AdminDeleteInvitationView.as_view(), name='admin_delete_invitation'),
    path('admin/bulk-delete/', AdminDeleteInvitationsBulkView.as_view(), name='admin_delete_invitations_bulk'),
]