# tests/urls.py
from django.urls import path
from .views import (
    NotStartedTestListView, 
    InProgressTestListView, 
    CompletedTestListView, 
    TestDetailView, 
    TestProgressView, 
    SaveResultView, 
    DeleteTestProgressView, 
    NextQuestionView,
    AdminTestListView,
    AdminTestCreateView,
    AdminTestUpdateView,
    AdminTestDeleteView
)
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [

    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    
    path('not-started/', NotStartedTestListView.as_view(), name='not_started_tests'),
    path('in-progress/', InProgressTestListView.as_view(), name='in_progress_tests'),
    path('completed/', CompletedTestListView.as_view(), name='completed_tests'),

    path('<int:test_id>/', TestDetailView.as_view(), name='get_test_by_id'),

    # Lógica de negocio
    path('<int:test_id>/progress/', TestProgressView.as_view(), name='get_test_progress'),
    path('<int:test_id>/save/', SaveResultView.as_view(), name='save_result'),
    path('<int:test_id>/progress/delete/', DeleteTestProgressView.as_view(), name='delete_test_progress'),
    path('<int:test_id>/next-question/', NextQuestionView.as_view(), name='get_next_unanswered_question'),

    # Admin endpoints
    path('admin/<int:test_id>/', TestDetailView.as_view(), name='get_test_by_id'),
    path('admin/list/', AdminTestListView.as_view(), name='get_all_tests'),
    path('admin/create/', AdminTestCreateView.as_view(), name='create_test'),
    path('admin/<int:test_id>/edit/', AdminTestUpdateView.as_view(), name='update_test'),
    path('admin/<int:test_id>/delete/', AdminTestDeleteView.as_view(), name='delete_test'),
]