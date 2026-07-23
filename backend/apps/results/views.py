# apps/results/views.py (añadir al final o reemplazar funciones)
from rest_framework.generics import ( # type: ignore
    RetrieveAPIView, ListAPIView, DestroyAPIView, GenericAPIView
)
from rest_framework.permissions import IsAuthenticated # type: ignore
from rest_framework.response import Response # type: ignore
from rest_framework import status # type: ignore
from rest_framework.views import APIView # type: ignore
from django_filters.rest_framework import DjangoFilterBackend # type: ignore
from rest_framework.filters import OrderingFilter # type: ignore
from django.db.models import Q, Count, Avg, Sum, F, Case, When, Value, FloatField
from django.db.models.functions import Coalesce, Round
from django.utils import timezone
from django.core.cache import cache
from django.http import HttpResponse
import csv
import json
from datetime import timedelta

from .models import Result
from apps.test.models import Test, Question, Answer
from apps.accounts.models import User
from apps.shared.models import get_main_topics
from .serializers import (
    ResultDetailSerializer,
    ResultListSerializer,
    UserResultListSerializer,
)
from .filters import ResultsListFilter, UserResultsFilter
from apps.shared.pagination import CustomPagination  # reutilizar paginador personalizado
from django.core.paginator import Paginator
import logging

logger = logging.getLogger(__name__)


# ===========================================================================
# Endpoints de usuario (públicos)
# ===========================================================================

class IncorrectAnswersView(RetrieveAPIView):
    """Obtener respuestas incorrectas de un resultado completado"""
    permission_classes = [IsAuthenticated]
    lookup_field = 'id'
    lookup_url_kwarg = 'result_id'

    def get_queryset(self):
        # Solo el usuario puede ver sus propios resultados
        return Result.objects.filter(user=self.request.user, status='completed')

    def retrieve(self, request, *args, **kwargs):
        result = self.get_object()

        # Obtener respuestas correctas del test (usando caché)
        correct_answers_map = self._get_correct_answers(result.test_id)

        # Obtener preguntas con respuestas
        questions = Question.objects.filter(test_id=result.test_id).prefetch_related('answers')

        # Parsear respuestas del usuario
        user_answers = {}
        if result.answers:
            try:
                user_answers = json.loads(result.answers) if isinstance(result.answers, str) else result.answers
            except json.JSONDecodeError:
                pass

        incorrect_questions = []
        for idx, question in enumerate(questions, 1):
            user_answer_id = user_answers.get(str(question.pk))
            correct_answer = correct_answers_map.get(question.pk)

            if user_answer_id != correct_answer['id'] if correct_answer else True:
                # Obtener texto de respuesta del usuario
                user_answer_text = 'No respondida'
                if user_answer_id:
                    try:
                        user_answer = Answer.objects.filter(id=user_answer_id).values_list('answer_text', flat=True).first()
                        if user_answer:
                            user_answer_text = user_answer
                    except:
                        pass

                incorrect_questions.append({
                    'question_id': question.pk,
                    'question_number': idx,
                    'question_text': question.question_text,
                    'correct_answer_id': correct_answer['id'] if correct_answer else None,
                    'correct_answer_text': correct_answer['text'] if correct_answer else 'No definida',
                    'user_answer_text': user_answer_text
                })

        total_questions = result.correct_answers + result.wrong_answers
        score_percentage = (result.correct_answers / total_questions * 100) if total_questions > 0 else 0

        data = {
            'incorrect_questions': incorrect_questions,
            'summary': {
                'total_questions': total_questions,
                'total_correct': result.correct_answers,
                'total_incorrect': result.wrong_answers,
                'questions_with_errors': len(incorrect_questions),
                'score_percentage': round(score_percentage, 2)
            }
        }
        return Response(data)

    def _get_correct_answers(self, test_id):
        """Cache de respuestas correctas para un test"""
        cache_key = f'test_correct_answers_{test_id}'
        correct_answers = cache.get(cache_key)

        if correct_answers is None:
            answers = Answer.objects.filter(
                question__test_id=test_id,
                is_correct=True
            ).select_related('question').values('question_id', 'id', 'answer_text')

            correct_answers = {
                answer['question_id']: {'id': answer['id'], 'text': answer['answer_text']}
                for answer in answers
            }
            cache.set(cache_key, correct_answers, timeout=3600)

        return correct_answers


# ===========================================================================
# Endpoints de administración
# ===========================================================================

class ResultDetailView(RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    queryset = Result.objects.select_related('user', 'test')
    serializer_class = ResultDetailSerializer
    lookup_field = 'id'
    lookup_url_kwarg = 'result_id'

    def retrieve(self, request, *args, **kwargs):
        response = super().retrieve(request, *args, **kwargs)
        # Añadir información del test y user
        data = response.data
        result = self.get_object()
        data['test'] = {
            'id': result.test.id,
            'title': result.test.title,
            'description': result.test.description,
            'main_topic': result.test.main_topic,
            'sub_topic': result.test.sub_topic,
            'specific_topic': result.test.specific_topic,
            'level': result.test.level,
            'total_questions': result.test.questions.count(),
        }
        data['user'] = {
            'id': result.user.id,
            'username': result.user.username,
            'email': result.user.email,
            'first_name': result.user.first_name,
            'last_name': result.user.last_name,
            'role': result.user.role,
        }
        return Response(data)


class ResultsListView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ResultListSerializer
    pagination_class = CustomPagination
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = ResultsListFilter
    ordering_fields = ['id', 'started_at', 'updated_at', 'time_taken', 'correct_answers', 'score', 'user__username', 'test__title', 'test__main_topic', 'test__level']
    ordering = ['-updated_at']

    def get_queryset(self):
        queryset = Result.objects.select_related('user', 'test')
        # Anotar score para ordenar
        queryset = queryset.annotate(
            score=Case(
                When(
                    status='completed',
                    then=Coalesce(
                        Round(F('correct_answers') * 100.0 / (F('correct_answers') + F('wrong_answers')), 2),
                        Value(0.0)
                    )
                ),
                default=Value(0.0),
                output_field=FloatField()
            ),
            total_questions=F('correct_answers') + F('wrong_answers')
        )
        return queryset

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        # Añadir estadísticas
        response.data['available_filters'] = {
            'main_topics': get_main_topics(),
            'levels': Test.LEVEL_CHOICES,
            'statuses': Result.STATUS_CHOICES,
            'roles': User.ROLE_CHOICES, # Todos los roles, sin filtrar
        }
        # Estadísticas adicionales
        queryset = self.filter_queryset(self.get_queryset())
        response.data['stats'] = {
            'total_unfiltered': Result.objects.count(),
            'total_filtered': queryset.count(),
        }
        return response


class ResultsUserView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserResultListSerializer
    pagination_class = CustomPagination
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = UserResultsFilter
    ordering_fields = ['test__title', 'test__level', 'test__created_at', 'started_at', 'updated_at', 'time_taken']
    ordering = ['-updated_at']

    def get_queryset(self):
        user_id = self.kwargs.get('user_id')
        queryset = Result.objects.filter(user_id=user_id).select_related('test')
        # Anotar score
        queryset = queryset.annotate(
            score=Case(
                When(
                    status='completed',
                    then=Coalesce(
                        Round(F('correct_answers') * 100.0 / (F('correct_answers') + F('wrong_answers')), 2),
                        Value(0.0)
                    )
                ),
                default=Value(0.0),
                output_field=FloatField()
            )
        )
        return queryset

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        user_id = self.kwargs.get('user_id')

        # Añadir info de usuario y estadísticas
        queryset = self.filter_queryset(self.get_queryset())
        stats = queryset.aggregate(
            total=Count('id'),
            completed=Count('id', filter=Q(status='completed')),
            in_progress=Count('id', filter=Q(status='in_progress')),
            avg_score=Coalesce(Avg('score'), Value(0.0)),
            total_time=Coalesce(Sum('time_taken'), Value(0)),
            total_correct=Coalesce(Sum('correct_answers'), Value(0)),
            total_questions=Coalesce(Sum(F('correct_answers') + F('wrong_answers')), Value(0))
        )

        response.data['stats'] = {
            'total_unfiltered': Result.objects.filter(user_id=user_id).count(),
            'total_filtered': queryset.count(),
            'completed_tests': stats['completed'] or 0,
            'in_progress_tests': stats['in_progress'] or 0,
            'average_score': round(stats['avg_score'] or 0, 2),
            'total_time_spent': stats['total_time'] or 0,
            'total_questions_answered': stats['total_questions'] or 0,
            'total_correct_answers': stats['total_correct'] or 0,
        }
        response.data['available_filters'] = {
            'main_topics': list(
                Result.objects.filter(user_id=user_id)
                .exclude(test__main_topic='')
                .values_list('test__main_topic', flat=True)
                .distinct()
                .order_by('test__main_topic')
            ),
            'levels': Test.LEVEL_CHOICES,
            'statuses': Result.STATUS_CHOICES,
        }
        return response


class ResultUserDetailView(RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    lookup_field = 'id'
    lookup_url_kwarg = 'result_id'

    def get_queryset(self):
        user_id = self.kwargs.get('user_id')
        return Result.objects.filter(user_id=user_id).select_related('user', 'test')

    def retrieve(self, request, *args, **kwargs):
        result = self.get_object()

        # Obtener preguntas con respuestas y respuestas del usuario
        questions = Question.objects.filter(test_id=result.test_id).prefetch_related('answers')
        user_answers = {}
        if result.answers:
            try:
                user_answers = json.loads(result.answers) if isinstance(result.answers, str) else result.answers
            except json.JSONDecodeError:
                pass

        question_details = []
        for idx, question in enumerate(questions, 1):
            answers_detail = []
            user_selected_answer = user_answers.get(str(question.pk))

            for answer in question.answers.all():
                answers_detail.append({
                    'id': answer.pk,
                    'answer_text': answer.answer_text,
                    'is_correct': answer.is_correct,
                    'is_selected': user_selected_answer == answer.pk
                })

            is_correct = False
            if user_selected_answer:
                is_correct = any(
                    a.pk == user_selected_answer and a.is_correct
                    for a in question.answers.all()
                )

            question_details.append({
                'id': question.pk,
                'question_number': idx,
                'question_text': question.question_text,
                'answers': answers_detail,
                'user_answer_id': user_selected_answer,
                'is_correct_answered': is_correct if user_selected_answer else None
            })

        data = {}

        data['result'] = {
            'id': result.id,
            'user_id': result.user_id,
            'test_id': result.test_id,
            'correct_answers': result.correct_answers,
            'wrong_answers': result.wrong_answers,
            'time_taken': result.time_taken,
            'status': result.status,
            'answered_questions': result.answers,
            'started_at': result.started_at,
            'updated_at': result.updated_at,
        }
        data['user'] = {
            'id': result.user_id,
            'username': result.user.username,
            'role': result.user.role,
            'email': result.user.email,
            'first_name': result.user.first_name,
            'last_name': result.user.last_name,  
        }
        data['test'] = {
            'id': result.test.id,
            'title': result.test.title,
            'description': result.test.description,
            'main_topic': result.test.main_topic,
            'sub_topic': result.test.sub_topic,
            'specific_topic': result.test.specific_topic,
            'level': result.test.level,
            'created_at': result.test.created_at,
            'total_questions': len(question_details),          
        }
        data['questions'] = question_details
        data['score_details'] = {
            'correct': result.correct_answers,
            'wrong': result.wrong_answers,
            'score_percentage': round((result.correct_answers / len(question_details) * 100), 1) if len(question_details) > 0 and result.status == 'completed' else 0
        }
        # Formato de tiempo
        seconds = result.time_taken
        if seconds > 0:
            hours = seconds // 3600
            minutes = (seconds % 3600) // 60
            secs = seconds % 60
            if hours > 0:
                time_formatted = f"{hours}h {minutes}m {secs}s"
            elif minutes > 0:
                time_formatted = f"{minutes}m {secs}s"
            else:
                time_formatted = f"{secs}s"
            data['time_formatted'] = time_formatted
            data['avg_time_per_question'] = round(seconds / len(question_details), 1) if len(question_details) > 0 else 0
        else:
            data['time_formatted'] = ''
            data['avg_time_per_question'] = 0

        return Response(data)


class DeleteResultView(DestroyAPIView):
    permission_classes = [IsAuthenticated]
    lookup_field = 'id'
    lookup_url_kwarg = 'result_id'

    def get_queryset(self):
        return Result.objects.all()

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        cache.delete('result_stats')  # Limpiar caché de estadísticas
        return Response({'message': 'Resultado eliminado', 'id': instance.pk})


class DeleteResultsBulkView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return Response({'error': 'Invalid JSON'}, status=status.HTTP_400_BAD_REQUEST)

        ids = data.get('ids', [])
        if not ids or not isinstance(ids, list):
            return Response({'error': 'Se requiere una lista de IDs'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            ids = [int(id_val) for id_val in ids]
        except (ValueError, TypeError):
            return Response({'error': 'Los IDs deben ser números enteros'}, status=status.HTTP_400_BAD_REQUEST)

        deleted_count, _ = Result.objects.filter(id__in=ids).delete()
        cache.delete('result_stats')
        return Response({
            'message': f'{deleted_count} resultados eliminados',
            'deleted_count': deleted_count
        })


class ResultStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        cache_key = 'result_stats'
        stats_data = cache.get(cache_key)

        if stats_data is None:
            total_results = Result.objects.count()

            status_stats = list(Result.objects.values('status').annotate(count=Count('id')))

            # Estadísticas de completados
            completed_results = Result.objects.filter(status='completed')
            total_correct = completed_results.aggregate(total=Sum('correct_answers'))['total'] or 0
            total_answered = completed_results.aggregate(
                total=Sum(F('correct_answers') + F('wrong_answers'))
            )['total'] or 0
            avg_score = (total_correct / total_answered * 100) if total_answered > 0 else 0

            # Resultados por día (últimos 30 días)
            thirty_days_ago = timezone.now() - timedelta(days=30)
            daily_stats = Result.objects.filter(
                started_at__gte=thirty_days_ago
            ).extra(
                {'day': "DATE(started_at)"}
            ).values('day').annotate(
                count=Count('id'),
                avg_score=Avg(
                    Case(
                        When(status='completed', then=F('correct_answers') * 100.0 / (F('correct_answers') + F('wrong_answers'))),
                        default=Value(0.0),
                        output_field=FloatField()
                    )
                )
            ).order_by('day')

            # Resultados por nivel de test
            level_stats = list(Result.objects.filter(status='completed').select_related('test').values('test__level').annotate(
                count=Count('id'),
                avg_score=Avg(F('correct_answers') * 100.0 / (F('correct_answers') + F('wrong_answers')))
            ))

            # Top 10 tests más realizados
            top_tests = list(Result.objects.select_related('test').values(
                'test__id', 'test__title'
            ).annotate(
                count=Count('id')
            ).order_by('-count')[:10])

            # Top 10 usuarios con más resultados
            top_users = list(Result.objects.select_related('user').values(
                'user__id', 'user__username', 'user__email'
            ).annotate(
                count=Count('id'),
                avg_score=Avg(
                    Case(
                        When(status='completed', then=F('correct_answers') * 100.0 / (F('correct_answers') + F('wrong_answers'))),
                        default=Value(0.0),
                        output_field=FloatField()
                    )
                )
            ).order_by('-count')[:10])

            stats_data = {
                'stats': {
                    'total_results': total_results,
                    'average_score': round(avg_score, 2),
                    'by_status': status_stats,
                    'by_level': level_stats,
                    'daily_last_30_days': [
                        {
                            'date': item['day'].isoformat() if item['day'] else None,
                            'count': item['count'],
                            'avg_score': round(float(item['avg_score']), 2) if item['avg_score'] else 0
                        }
                        for item in daily_stats
                    ],
                    'top_tests': [
                        {
                            'test_id': item['test__id'],
                            'test_title': item['test__title'],
                            'times_taken': item['count']
                        }
                        for item in top_tests
                    ],
                    'top_users': [
                        {
                            'user_id': item['user__id'],
                            'username': item['user__username'],
                            'email': item['user__email'],
                            'results_count': item['count'],
                            'avg_score': round(float(item['avg_score']), 2) if item['avg_score'] else 0
                        }
                        for item in top_users
                    ]
                },
                'timestamp': timezone.now().isoformat()
            }

            cache.set(cache_key, stats_data, timeout=300)

        return Response(stats_data)


class ExportResultsCSVView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Construir query con filtros (usando el mismo filtro que ResultsListView)
        filter_set = ResultsListFilter(request.GET, queryset=Result.objects.select_related('user', 'test'))
        queryset = filter_set.qs

        # Aplicar ordenación y paginación (exportamos todos, sin paginar)
        queryset = queryset.order_by('-updated_at')

        response = HttpResponse(content_type='text/csv; charset=utf-8')
        response['Content-Disposition'] = 'attachment; filename="results_export.csv"'
        response.write('\ufeff')

        writer = csv.writer(response)
        writer.writerow([
            'ID', 'Usuario', 'Email', 'Test', 'Nivel', 'Tema Principal',
            'Subtema', 'Tema Específico', 'Correctas', 'Incorrectas',
            'Total Respondidas', 'Puntuación (%)', 'Tiempo (seg)',
            'Estado', 'Fecha Inicio', 'Última Actualización'
        ])

        for result in queryset.iterator(chunk_size=1000):
            total_answers = result.correct_answers + result.wrong_answers
            score = 0
            if result.status == 'completed' and total_answers > 0:
                score = round((result.correct_answers / total_answers) * 100, 2)

            writer.writerow([
                result.pk,
                result.user.username,
                result.user.email,
                result.test.title,
                result.test.level,
                result.test.main_topic,
                result.test.sub_topic,
                result.test.specific_topic,
                result.correct_answers,
                result.wrong_answers,
                total_answers,
                score,
                result.time_taken,
                result.status,
                result.started_at.isoformat() if result.started_at else '',
                result.updated_at.isoformat() if result.updated_at else '',
            ])

        return response