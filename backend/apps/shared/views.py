# shared/views.py
import json
import logging

from django.http import HttpResponse
from rest_framework.views import APIView # type: ignore
from rest_framework.response import Response # type: ignore
from rest_framework.permissions import IsAdminUser, AllowAny # type: ignore

from .models import (
    get_topics, get_main_topics, get_sub_topics, get_specific_topics,
    validate_and_suggest_topics, invalidate_topics_cache, get_topic_hierarchy,
    get_topic_statistics, insert_or_update_topic
)

logger = logging.getLogger(__name__)


# ============================================================================
# Endpoints públicos (sin autenticación)
# ============================================================================

class TopicsView(APIView):
    """Obtiene la jerarquía completa de temas"""
    permission_classes = [AllowAny]

    def get(self, request):
        include_predefined = request.GET.get('include_predefined', 'true').lower() == 'true'
        force_refresh = request.GET.get('force_refresh', 'false').lower() == 'true'

        try:
            hierarchy = get_topics(include_predefined, force_refresh)
            return Response(hierarchy)
        except Exception as e:
            logger.error(f"Error getting topics: {str(e)}")
            return Response({'error': str(e)}, status=500)


class MainTopicsView(APIView):
    """Obtiene solo los temas principales"""
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            topics = get_main_topics()
            return Response(topics)
        except Exception as e:
            logger.error(f"Error getting main topics: {str(e)}")
            return Response({'error': str(e)}, status=500)


class SubTopicsView(APIView):
    """Obtiene subtemas de un tema principal"""
    permission_classes = [AllowAny]

    def get(self, request, main_topic):
        if not main_topic:
            return Response({'error': 'Main topic is required'}, status=400)

        try:
            sub_topics = get_sub_topics(main_topic)
            return Response(sub_topics)
        except Exception as e:
            logger.error(f"Error getting sub topics for {main_topic}: {str(e)}")
            return Response({'error': str(e)}, status=500)


class SpecificTopicsView(APIView):
    """Obtiene temas específicos de un subtema"""
    permission_classes = [AllowAny]

    def get(self, request, main_topic, sub_topic):
        if not main_topic or not sub_topic:
            return Response(
                {'error': 'Both main_topic and sub_topic are required'},
                status=400
            )

        try:
            specific_topics = get_specific_topics(main_topic, sub_topic)
            return Response(specific_topics)
        except Exception as e:
            logger.error(f"Error getting specific topics for {main_topic}/{sub_topic}: {str(e)}")
            return Response({'error': str(e)}, status=500)


class ValidateTopicView(APIView):
    """Valida una combinación de temas y sugiere alternativas"""
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return Response({'error': 'Invalid request body'}, status=400)

        main_topic = data.get('main_topic', '')
        sub_topic = data.get('sub_topic', '')
        specific_topic = data.get('specific_topic', '')

        if not main_topic or not sub_topic or not specific_topic:
            return Response(
                {'error': 'main_topic, sub_topic and specific_topic are required'},
                status=400
            )

        try:
            is_valid, suggestions = validate_and_suggest_topics(
                main_topic, sub_topic, specific_topic
            )
            return Response({
                'valid': is_valid,
                'suggestions': suggestions
            })
        except Exception as e:
            logger.error(f"Error validating topic: {str(e)}")
            return Response({'error': str(e)}, status=500)


class TopicHierarchyView(APIView):
    """Obtiene la estructura jerárquica completa"""
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            hierarchy = get_topic_hierarchy()
            return Response(hierarchy)
        except Exception as e:
            logger.error(f"Error getting topic hierarchy: {str(e)}")
            return Response({'error': str(e)}, status=500)


class TopicStatisticsView(APIView):
    """Obtiene estadísticas de temas"""
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            stats = get_topic_statistics()
            return Response(stats)
        except Exception as e:
            logger.error(f"Error getting topic statistics: {str(e)}")
            return Response({'error': str(e)}, status=500)


class SystemConfigByKeyView(APIView):
    """Obtiene el valor de una configuración por su clave (público)"""
    permission_classes = [AllowAny]

    def get(self, request, key):
        from apps.admin_panel.utils import SystemConfigManager

        try:
            system_config = SystemConfigManager.get_value(key=key, default=5)
            return HttpResponse(str(system_config), content_type='text/plain')
        except Exception as e:
            logger.error(f"Error getting system config by key {key}: {str(e)}")
            return Response({'error': 'Error al obtener configuración'}, status=500)


# ============================================================================
# Endpoints de administración (requieren autenticación y rol admin)
# ============================================================================

class RefreshCacheView(APIView):
    """Refresca el cache de temas (solo administradores)"""
    permission_classes = [IsAdminUser]

    def post(self, request):
        try:
            invalidate_topics_cache()
            # Forzar recarga
            get_topics(True, True)
            return Response({'message': 'Topics cache refreshed successfully'})
        except Exception as e:
            logger.error(f"Error refreshing cache: {str(e)}")
            return Response({'error': 'Failed to refresh cache'}, status=500)


class CreateTopicView(APIView):
    """Crea un nuevo tema (solo administradores)"""
    permission_classes = [IsAdminUser]

    def post(self, request):
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return Response({'error': 'Invalid request body'}, status=400)

        main_topic = data.get('main_topic', '').strip()
        sub_topic = data.get('sub_topic', '').strip()
        specific_topic = data.get('specific_topic', '').strip()
        is_predefined = data.get('is_predefined', False)

        if not main_topic or not sub_topic or not specific_topic:
            return Response(
                {'error': 'main_topic, sub_topic and specific_topic are required'},
                status=400
            )

        try:
            topic, created = insert_or_update_topic(
                main_topic, sub_topic, specific_topic, is_predefined
            )
            return Response({
                'message': 'Topic created successfully' if created else 'Topic updated successfully',
                'topic': {
                    'main_topic': topic.main_topic,
                    'sub_topic': topic.sub_topic,
                    'specific_topic': topic.specific_topic,
                    'is_predefined': topic.is_predefined
                }
            }, status=201 if created else 200)
        except Exception as e:
            logger.error(f"Error creating topic: {str(e)}")
            return Response({'error': str(e)}, status=500)