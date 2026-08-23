from django.contrib import admin
from .models import AIRequestLog

@admin.register(AIRequestLog)
class AIRequestLogAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'test', 'status', 'generation_mode', 'created_at', 'response_time')
    list_filter = ('status', 'generation_mode', 'language', 'created_at')
    search_fields = ('user__username', 'user__email', 'main_topic', 'sub_topic', 'specific_topic')
    readonly_fields = ('created_at', 'updated_at')
    ordering = ('-created_at',)
    fieldsets = (
        (None, {
            'fields': ('user', 'test', 'main_topic', 'sub_topic', 'specific_topic', 'level', 'num_questions', 'num_answers', 'language', 'generation_mode')
        }),
        ('Prompt y respuesta', {
            'fields': ('ai_prompt', 'ai_response', 'ai_provider', 'ai_model')
        }),
        ('Estado y métricas', {
            'fields': ('status', 'error_message', 'response_time', 'tokens_used')
        }),
        ('Fechas', {
            'fields': ('created_at', 'updated_at')
        }),
    )