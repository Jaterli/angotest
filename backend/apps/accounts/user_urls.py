from django.urls import path
from .views import (
    ProfileView, UpdateEmailPasswordView, UpdateGuestProfileView,
    DeactivateAccountView, DashboardView, RankingsView,
    AdminUserListView, AdminUserDetailView, AdminUserProfileView, AdminDeleteUserView, ContactView
)

urlpatterns = [
    # Perfil y acciones de usuario
    path('profile/', ProfileView.as_view(), name='profile'),
    path('update-email-password/', UpdateEmailPasswordView.as_view(), name='update_email_password'),
    path('update-guest-profile/', UpdateGuestProfileView.as_view(), name='update_guest_profile'),
    path('deactivate-account/', DeactivateAccountView.as_view(), name='deactivate_account'),
    path('dashboard/', DashboardView.as_view(), name='dashboard'),
    path('rankings/', RankingsView.as_view(), name='rankings'),
    path('contact/', ContactView.as_view(), name='contact'),

    # Administración de usuarios (admin)
    path('stats/', AdminUserListView.as_view(), name='admin_users'),
    path('<int:user_id>/', AdminUserDetailView.as_view(), name='admin_user_detail'),
    path('<int:user_id>/profile/', AdminUserProfileView.as_view(), name='admin_user_profile'),
    path('<int:user_id>/delete/', AdminDeleteUserView.as_view(), name='admin_delete_user'),
]