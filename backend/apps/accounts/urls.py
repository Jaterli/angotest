from django.urls import path
from .views import (
    RegisterView, LoginView, CheckAuthView, LogoutView,
    ForgotPasswordView, ValidateResetTokenView, ResetPasswordWithTokenView
)

urlpatterns = [
    path('register', RegisterView.as_view(), name='register'),
    path('login', LoginView.as_view(), name='login'),
    path('check-auth', CheckAuthView.as_view(), name='check_auth'),
    path('logout', LogoutView.as_view(), name='logout'),
    path('forgot-password', ForgotPasswordView.as_view(), name='forgot_password'),
    path('reset-password-with-token', ResetPasswordWithTokenView.as_view(), name='reset_password'),
    path('validate-reset-token', ValidateResetTokenView.as_view(), name='validate_token'),
    # La página de reset password (template) se mantiene
]