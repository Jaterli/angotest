from django.contrib import admin
from .models import Result

@admin.register(Result)
class ResultAdmin(admin.ModelAdmin):
    list_display = ('user', 'test', 'status', 'correct_answers', 'wrong_answers', 'score_percentage', 'started_at')
    list_filter = ('status', 'started_at', 'updated_at')
    search_fields = ('user__username', 'user__email', 'test__title')
    readonly_fields = ('started_at', 'updated_at', 'total_answered', 'score_percentage')
    ordering = ('-started_at',)

    fieldsets = (
        (None, {
            'fields': ('user', 'test', 'status')
        }),
        ('Resultados', {
            'fields': ('correct_answers', 'wrong_answers', 'score_percentage', 'total_answered')
        }),
        ('Detalles', {
            'fields': ('answers', 'time_taken')
        }),
        ('Fechas', {
            'fields': ('started_at', 'updated_at')
        }),
    )