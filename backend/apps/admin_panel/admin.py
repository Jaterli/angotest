from django.contrib import admin
from .models import UserQuota, SystemConfig

@admin.register(UserQuota)
class UserQuotaAdmin(admin.ModelAdmin):
    list_display = ('user', 'month_year', 'max_requests', 'used_requests', 'remaining_requests', 'status')
    list_filter = ('month_year', 'max_requests', 'user__role') 
    search_fields = ('user__username', 'user__email', 'month_year')
    ordering = ('-month_year',)
    readonly_fields = ('remaining_requests', 'usage_percentage', 'status', 'created_at', 'updated_at')


@admin.register(SystemConfig)
class SystemConfigAdmin(admin.ModelAdmin):
    list_display = ('key', 'value_preview', 'description', 'updated_at')
    search_fields = ('key', 'value', 'description')
    ordering = ('key',)
    readonly_fields = ('created_at', 'updated_at')

    def value_preview(self, obj):
        return obj.value[:50] + ('...' if len(obj.value) > 50 else '')
    value_preview.short_description = 'Valor (vista previa)'