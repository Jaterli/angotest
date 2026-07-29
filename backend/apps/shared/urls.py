# shared/urls.py
from django.urls import path
from .views import (
    TopicsView,
    MainTopicsView,
    SubTopicsView,
    SpecificTopicsView,
    ValidateTopicView,
    TopicHierarchyView,
    TopicStatisticsView,
    SystemConfigByKeyView,
    RefreshCacheView,
    CreateTopicView,
)

urlpatterns = [
    # Endpoints públicos
    path('topics/', TopicsView.as_view(), name='get_topics'),
    path('topics/main/', MainTopicsView.as_view(), name='get_main_topics'),
    path('topics/<str:main_topic>/sub_topics/', SubTopicsView.as_view(), name='get_sub_topics'),
    path('topics/<str:main_topic>/<str:sub_topic>/specific_topics/', SpecificTopicsView.as_view(), name='get_specific_topics'),
    path('topics/hierarchy/', TopicHierarchyView.as_view(), name='get_topic_hierarchy'),
    path('topics/validate/', ValidateTopicView.as_view(), name='validate_topic'),
    path('topics/statistics/', TopicStatisticsView.as_view(), name='topic_statistics'),

    # Endpoints de administración
    path('topics/create/', CreateTopicView.as_view(), name='create_topic'),
    path('topics/refresh-cache/', RefreshCacheView.as_view(), name='refresh_cache'),

    # Configuración del sistema
    path('system-configsForUser/key/<str:key>/', SystemConfigByKeyView.as_view(), name='get_system_config_by_key'),
]