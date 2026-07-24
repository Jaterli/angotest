# apps/ai/urls.py
from django.urls import path
from .views import (
    GenerateAITestView,
    CurrentUserQuotaView,
    AIRequestLogListView,
    AIRequestLogDetailView,
)

urlpatterns = [
    path('generate-ai-test/', GenerateAITestView.as_view(), name='generate_ai_test'),
    path('quota/', CurrentUserQuotaView.as_view(), name='ai_quota'),
    path('logs/', AIRequestLogListView.as_view(), name='ai_logs'),
    path('logs/<int:log_id>/', AIRequestLogDetailView.as_view(), name='ai_log_detail'),
]