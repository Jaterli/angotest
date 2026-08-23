from django.contrib import admin
from .models import Topic

@admin.register(Topic)
class TopicAdmin(admin.ModelAdmin):
    list_display = ('main_topic', 'sub_topic', 'specific_topic', 'is_predefined', 'created_at')
    list_filter = ('is_predefined', 'created_at')
    search_fields = ('main_topic', 'sub_topic', 'specific_topic')
    ordering = ('main_topic', 'sub_topic', 'specific_topic')
    readonly_fields = ('created_at', 'updated_at')