from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _
from .models import User, PasswordResetToken

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'role', 'is_active', 'registered_at')
    list_filter = ('role', 'is_active', 'is_staff', 'is_superuser', 'registered_at')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    ordering = ('-registered_at',)
    readonly_fields = ('registered_at', 'login_at', 'deleted_at')

    fieldsets = (
        (None, {'fields': ('username', 'email', 'password')}),
        (_('Personal info'), {'fields': ('first_name', 'last_name', 'phone', 'address', 'country', 'birth_date')}),
        (_('Permissions'), {'fields': ('role', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        (_('Important dates'), {'fields': ('registered_at', 'login_at', 'deleted_at')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'password1', 'password2', 'role', 'is_active', 'is_staff'),
        }),
    )

@admin.register(PasswordResetToken)
class PasswordResetTokenAdmin(admin.ModelAdmin):
    list_display = ('user', 'token', 'expires_at', 'used', 'date_joined')
    list_filter = ('used', 'expires_at')
    search_fields = ('user__email', 'user__username', 'token')
    readonly_fields = ('date_joined',)
    ordering = ('-date_joined',)