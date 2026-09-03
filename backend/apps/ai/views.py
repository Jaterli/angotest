# apps/ai/views.py
from rest_framework.views import APIView # type: ignore
from rest_framework.generics import ListAPIView, RetrieveAPIView # type: ignore
from rest_framework.permissions import IsAuthenticated # type: ignore
from rest_framework.response import Response # type: ignore
from rest_framework import status # type: ignore
from django_filters.rest_framework import DjangoFilterBackend # type: ignore
from rest_framework.filters import OrderingFilter # type: ignore
from django.utils import timezone
import time
import logging

from .models import AIRequestLog
from .serializers import (
    AIRequestLogSerializer,
    AIRequestLogDetailSerializer,
    GenerateAITestSerializer
)
from .filters import AIRequestLogFilter
from .services import (
    get_ai_provider, get_system_prompt, build_prompt,
    check_quota_available, consume_quota, make_ai_request,
    parse_ai_response, create_test_from_ai_response, get_or_create_user_quota, quota_to_dict
)
from apps.shared.pagination import CustomPagination

logger = logging.getLogger(__name__)


class GenerateAITestView(APIView):
    """Generar un test usando IA"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        
        serializer = GenerateAITestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        user_id = request.user.id

        # Verificar quota
        has_quota, quota_data = check_quota_available(user_id)
        if not has_quota:
            return Response({
                'error': 'Has alcanzado el límite de tests generados para este mes',
                'code': 'QUOTA_EXCEEDED',
                'quota': quota_data
            }, status=status.HTTP_403_FORBIDDEN)

        # Preparar input
        input_data = {
            'main_topic': data.get('main_topic', ''),
            'sub_topic': data.get('sub_topic', ''),
            'specific_topic': data.get('specific_topic', ''),
            'level': data['level'],
            'num_questions': data['num_questions'],
            'num_answers': data['num_answers'],
            'language': data.get('language', 'es'),
            'generation_mode': data['generation_mode'],
            'ai_prompt': data.get('ai_prompt', '')
        }

        provider = get_ai_provider()

        if not provider:
            logger.error("No AI provider configured")
            return Response({
                'error': 'No hay configuración de IA disponible. Contacte con el administrador.'
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        # Crear log
        ai_log = AIRequestLog.objects.create(
            user_id=user_id,
            main_topic=input_data['main_topic'],
            sub_topic=input_data['sub_topic'],
            specific_topic=input_data['specific_topic'],
            level=input_data['level'],
            num_questions=input_data['num_questions'],
            num_answers=input_data['num_answers'],
            language=input_data['language'],
            generation_mode=input_data['generation_mode'],
            ai_prompt=input_data['ai_prompt'],
            ai_provider=provider.name if provider else 'mock',
            ai_model=provider.model if provider else 'mock',
            status='pending'
        )

        try:
            start_time = time.time()

            # Usar IA
            prompt = build_prompt(input_data)
            messages = [
                {'role': 'system', 'content': get_system_prompt(provider.name)},
                {'role': 'user', 'content': prompt}
            ]

            payload = {
                'model': provider.model,
                'messages': messages,
                'temperature': provider.temperature,
                'max_completion_tokens': provider.max_tokens,
                'reasoning_effort': 'low',   # reduce tokens de "pensamiento"
                'response_format': {'type': 'json_object'},   # fuerza salida JSON limpia                
                'stream': False
            }

            result = make_ai_request(provider, payload)
            ai_response = parse_ai_response(result, input_data)

            ai_log.ai_response = result
            ai_log.response_time = time.time() - start_time
            ai_log.tokens_used = result.get('usage', {}).get('total_tokens', 0)


            # Crear test en BD
            test = create_test_from_ai_response(ai_response, user_id, input_data)

            ai_log.test = test
            ai_log.status = 'completed'
            ai_log.save()


            # Consumo de cuota (solo si el test se creó exitosamente)
            consumed, new_quota_data = consume_quota(user_id)

            return Response({
                'message': 'Test generado exitosamente',
                'generated_test_id': test.pk,
                'test': {
                    'id': test.pk,
                    'title': test.title,
                    'description': test.description,
                    'main_topic': test.main_topic,
                    'sub_topic': test.sub_topic,
                    'specific_topic': test.specific_topic,
                    'level': test.level,
                    'questions_count': test.questions.count(),
                },
                'status': 'completed',
                'quota_used': consumed,
                'quota': new_quota_data
            })

        except Exception as e:
            ai_log.status = 'failed'
            ai_log.error_message = str(e)
            ai_log.save()

            logger.error(f"Error generating AI test: {str(e)}")

            return Response({
                'error': f'Error generando test: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CurrentUserQuotaView(APIView):
    """Obtener la quota actual del usuario"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        quota = get_or_create_user_quota(request.user.id)
        return Response(quota_to_dict(quota))


class AIRequestLogListView(ListAPIView):
    """Obtener historial de solicitudes de IA del usuario"""
    permission_classes = [IsAuthenticated]
    serializer_class = AIRequestLogSerializer
    pagination_class = CustomPagination
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = AIRequestLogFilter
    ordering_fields = ['created_at', 'status', 'response_time', 'tokens_used']
    ordering = ['-created_at']

    def get_queryset(self):
        return AIRequestLog.objects.filter(
            user=self.request.user
        ).select_related('test').order_by('-created_at')

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        # Renombrar clave a 'logs' si se desea, pero el frontend espera 'logs'
        response.data['logs'] = response.data['data']['tests']
        del response.data['data']
        return response


class AIRequestLogDetailView(RetrieveAPIView):
    """Obtener detalle de una solicitud de IA"""
    permission_classes = [IsAuthenticated]
    serializer_class = AIRequestLogDetailSerializer
    lookup_field = 'id'
    lookup_url_kwarg = 'log_id'

    def get_queryset(self):
        return AIRequestLog.objects.filter(user=self.request.user).select_related('test')