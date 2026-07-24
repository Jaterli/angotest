from rest_framework.filters import OrderingFilter # type: ignore
from rest_framework.generics import RetrieveAPIView, ListAPIView, CreateAPIView, DestroyAPIView, GenericAPIView, UpdateAPIView # type: ignore
from rest_framework.response import Response # type: ignore
from rest_framework.permissions import IsAuthenticated # type: ignore
from rest_framework import status # type: ignore
from django.db.models import Count, Sum, Avg, F, Value, FloatField, Window
from django.db.models.functions import Rank, Coalesce
from django_filters.rest_framework import DjangoFilterBackend # type: ignore
from django.utils import timezone
from django.db import transaction
from apps.results.models import Result
from .filters import TestFilter, CompletedTestsFilter, InProgressTestsFilter
from .serializers import TestDetailSerializer, SaveResultInputSerializer, TestListSerializer, CompletedTestSerializer, InProgressTestSerializer, QuestionWithAnswersSerializer, TestCreateUpdateSerializer, TestListSerializer
from ..shared.pagination import CustomPagination
from .models import Test, Question, Answer
from apps.accounts.permissions import IsAdminUser
from apps.shared.models import get_main_topics
from apps.shared.models import insert_or_update_topic, invalidate_topics_cache, delete_orphaned_topics, get_sub_topics
from apps.results.models import Result
import json
import logging

logger = logging.getLogger(__name__)


class NotStartedTestListView(ListAPIView):
    serializer_class = TestListSerializer
    pagination_class = CustomPagination
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = TestFilter
    ordering_fields = ['title', 'main_topic', 'level', 'created_at', 'question_count']
    ordering = ['-created_at']

    def get_queryset(self):
        user = self.request.user
        started_test_ids = Result.objects.filter(user=user).values_list('test_id', flat=True).distinct()
        
        return Test.objects.filter(is_active=True).exclude(id__in=started_test_ids).annotate(
            question_count=Count('questions')
        )

    def list(self, request, *args, **kwargs):
        # 1. Obtener el queryset base sin filtros de request
        base_qs = self.get_queryset()
        total_sin_filtrar = base_qs.count()   # COUNT ligero sobre el queryset base

        # 2. Aplicar filtros de la URL (DjangoFilterBackend, OrderingFilter)
        filtered_qs = self.filter_queryset(base_qs)

        # 3. Paginación
        page = self.paginate_queryset(filtered_qs)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            response = self.get_paginated_response(serializer.data)
        else:
            serializer = self.get_serializer(filtered_qs, many=True)
            response = Response(serializer.data)

        # 4. Estadísticas adicionales (usando filtered_qs)
        main_topics = get_main_topics()
       
        stats_qs = Test.objects.filter(pk__in=filtered_qs.values('pk'))
        level_counts = (
            stats_qs
            .values('level')
            .annotate(count=Count('id'))
            .order_by()  # por si acaso, anulamos cualquier ordering residual
        )
        total_by_level = {item['level']: item['count'] for item in level_counts}

        response.data['available_filters']['main_topics'] = main_topics
        response.data['available_filters']['levels'] = Test.LEVEL_CHOICES
        response.data['stats']['total_unfiltered'] = total_sin_filtrar
        response.data['stats']['total_by_level'] = total_by_level

        return response


class InProgressTestListView(ListAPIView):
    serializer_class = InProgressTestSerializer
    pagination_class = CustomPagination
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = InProgressTestsFilter
    ordering_fields = ['test__title', 'test__main_topic', 'test_level', 'started_at', 'updated_at']
    ordering = ['-updated_at']

    def get_queryset(self):
        user = self.request.user
        return Result.objects.filter(user=user, status='in_progress').select_related('test')

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        
        # main_topics = get_main_topics() # Todos los temas (Considerar esta opción por eficiencia)
        main_topics = Result.objects.filter(
            user=request.user,
            status='in_progress'
        ).values_list('test__main_topic', flat=True).distinct()  

        filtered_qs = self.filter_queryset(self.get_queryset())
        level_counts = filtered_qs.values('test__level').annotate(count=Count('id'))
        total_by_level = {item['test__level']: item['count'] for item in level_counts}
        total_sin_filtrar = Result.objects.filter(user=request.user, status='in_progress').count()
        response.data['available_filters']['main_topics'] = main_topics
        response.data['stats']['total_unfiltered'] = total_sin_filtrar
        response.data['stats']['total_by_level'] = total_by_level

        # Calcular estadísticas adicionales
        total_time = filtered_qs.aggregate(total=Sum('time_taken'))['total'] or 0
        total_answered = 0
        progress_sum = 0
        count = filtered_qs.count()
        for result in filtered_qs:
            answered = 0
            if result.answers:
                try:
                    answers = json.loads(result.answers) if isinstance(result.answers, str) else result.answers
                    answered = len(answers) if answers else 0
                except:
                    pass
            total_answered += answered
            total_q = result.test.questions.count()
            if total_q > 0:
                progress_sum += (answered / total_q) * 100
        avg_progress = (progress_sum / count) if count > 0 else 0

        response.data['stats']['average_progress'] = round(avg_progress, 2)
        response.data['stats']['total_questions_answered'] = total_answered
        response.data['stats']['total_time_spent'] = total_time

        return response


class CompletedTestListView(ListAPIView):
    serializer_class = CompletedTestSerializer
    pagination_class = CustomPagination
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = CompletedTestsFilter
    ordering_fields = ['test__title', 'test__created_at', 'test__level', 'started_at', 'updated_at', 'time_taken', 'score']
    ordering = ['-updated_at']

    def get_queryset(self):
        user = self.request.user
        queryset = Result.objects.filter(user=user, status='completed').select_related('test')

        # Anotar posición de intento
        queryset = queryset.annotate(
            total_attempts=Window(
                expression=Count('id'),
                partition_by=[F('test_id')]
            ),
            attempt_position=Window(
                expression=Rank(),
                partition_by=[F('test_id')],
                order_by=[F('updated_at').asc(), F('id').asc()]
            )
        )

        # Anotar score para ordenar
        queryset = queryset.annotate(
            score=Coalesce(
                F('correct_answers') * 100.0 / (F('correct_answers') + F('wrong_answers')),
                Value(0.0),
                output_field=FloatField()
            )
        )

        return queryset

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)

        # main_topics = get_main_topics() # Todos los temas
        main_topics = Result.objects.filter(
            user=request.user,
            status='completed'
        ).values_list('test__main_topic', flat=True).distinct()        

        filtered_qs = self.filter_queryset(self.get_queryset())
        level_counts = filtered_qs.values('test__level').annotate(count=Count('id'))
        total_by_level = {item['test__level']: item['count'] for item in level_counts}
        total_sin_filtrar = Result.objects.filter(user=request.user, status='completed').count()
        response.data['available_filters']['main_topics'] = main_topics
        response.data['available_filters']['levels'] = Test.LEVEL_CHOICES
        response.data['stats']['total_unfiltered'] = total_sin_filtrar
        response.data['stats']['total_by_level'] = total_by_level

        # Estadísticas adicionales
        agg = filtered_qs.aggregate(
            avg_score=Avg('score'),
            total_time=Sum('time_taken'),
            total_questions=Sum(F('correct_answers') + F('wrong_answers'))
        )
        response.data['stats']['average_score'] = round(agg['avg_score'] or 0, 2)
        response.data['stats']['total_time_spent'] = agg['total_time'] or 0
        response.data['stats']['total_questions_answered'] = agg['total_questions'] or 0

        return response
    

class TestDetailView(RetrieveAPIView):
    queryset = Test.objects.prefetch_related('questions__answers')
    serializer_class = TestDetailSerializer
    lookup_field = 'id'
    lookup_url_kwarg = 'test_id'

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response({'test': serializer.data})


class TestProgressView(RetrieveAPIView):
    lookup_field = 'id'
    lookup_url_kwarg = 'test_id'

    def get_queryset(self):
        return Test.objects.prefetch_related('questions__answers')

    def retrieve(self, request, *args, **kwargs):
        test = self.get_object()
        user = request.user

        # Buscar resultado en progreso para este test
        result = Result.objects.filter(user=user, test=test, status='in_progress').first()

        # Pre-cargar preguntas y respuestas para el test
        test.questions_prefetched = test.questions.all()

        # Serializar test
        test_serializer = TestDetailSerializer(test)
        test_data = test_serializer.data

        if not result:
            # No hay progreso, devolver test vacío
            data = {
                'test': test_data,
                'answers': {},
                'time_elapsed': 0,
                'progress': 0.0,
                'is_resuming': False,
            }
            return Response(data)

        # Decodificar respuestas guardadas
        saved_answers = {}
        if result.answers:
            try:
                saved_answers = json.loads(result.answers) if isinstance(result.answers, str) else result.answers
            except json.JSONDecodeError:
                pass

        total_questions = test.questions.count()
        progress = (len(saved_answers) / total_questions * 100) if total_questions > 0 else 0

        data = {
            'test': test_data,
            'answers': saved_answers,
            'time_elapsed': result.time_taken,
            'progress': round(progress, 2),
            'is_resuming': True,
            'result_id': result.pk,
        }
        return Response(data)


class SaveResultView(CreateAPIView):
    serializer_class = SaveResultInputSerializer
    lookup_field = 'id'
    lookup_url_kwarg = 'test_id'

    def get_queryset(self):
        # Solo necesitamos verificar que el test existe
        return Test.objects.all()

    def create(self, request, *args, **kwargs):
        # Verificar que el test existe
        try:
            test = Test.objects.get(id=kwargs['test_id'])
        except Test.DoesNotExist:
            return Response({'error': 'test no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        # Validar input
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        status_val = data.get('status')
        answers = data.get('answers', {})
        time_taken = data.get('time_taken', 0)

        user = request.user

        # Buscar resultado existente en progreso
        result = Result.objects.filter(user=user, test=test, status='in_progress').first()

        # Calcular puntuación si está completado
        correct_count = 0
        wrong_count = 0
        if status_val == 'completed' and answers:
            correct_count, wrong_count = calculate_score(answers, test.id)

        # Preparar datos
        answers_json = json.dumps(answers) if answers else ''

        if result:
            # Actualizar existente
            result.status = status_val
            result.time_taken = time_taken
            result.updated_at = timezone.now()
            if status_val == 'completed':
                result.correct_answers = correct_count
                result.wrong_answers = wrong_count
            if answers:
                result.answers = answers_json
            result.save()
        else:
            # Crear nuevo
            result = Result.objects.create(
                user=user,
                test=test,
                status=status_val,
                time_taken=time_taken,
                correct_answers=correct_count,
                wrong_answers=wrong_count,
                answers=answers_json
            )

        total_answers = len(answers)
        score_percentage = (correct_count / total_answers * 100) if total_answers > 0 else 0

        return Response({
            'message': 'Resultado guardado exitosamente',
            'result_id': result.pk,
            'test_id': result.test_id,
            'status': result.status,
            'correct_answers': result.correct_answers,
            'wrong_answers': result.wrong_answers,
            'total': total_answers,
            'time_taken': result.time_taken,
            'score_percentage': round(score_percentage, 2)
        })


class DeleteTestProgressView(DestroyAPIView):
    lookup_field = 'id'
    lookup_url_kwarg = 'test_id'

    def get_queryset(self):
        # Solo eliminamos resultados en progreso del usuario para el test específico
        return Result.objects.filter(user=self.request.user, status='in_progress')

    def destroy(self, request, *args, **kwargs):
        deleted_count, _ = self.get_queryset().filter(test_id=kwargs['test_id']).delete()
        if deleted_count > 0:
            return Response({'message': 'Progreso eliminado'})
        return Response({'message': 'No se encontró progreso para eliminar'}, status=status.HTTP_404_NOT_FOUND)


class NextQuestionView(GenericAPIView):
    lookup_field = 'id'
    lookup_url_kwarg = 'test_id'

    def get_queryset(self):
        return Test.objects.all()

    def get(self, request, *args, **kwargs):
        test = self.get_object()
        user = request.user

        # Obtener resultado existente
        result = Result.objects.filter(user=user, test=test).exclude(status='completed').first()

        # Obtener IDs de preguntas respondidas
        answered_question_ids = set()
        if result and result.answers:
            try:
                saved_answers = json.loads(result.answers) if isinstance(result.answers, str) else result.answers
                answered_question_ids = set(int(qid) for qid in saved_answers.keys())
            except (json.JSONDecodeError, ValueError):
                pass

        total_questions = Question.objects.filter(test=test).count()

        # Verificar si completó todas
        if len(answered_question_ids) >= total_questions:
            return Response({
                'message': 'todas_las_preguntas_respondidas',
                'is_completed': True,
                'answered_count': len(answered_question_ids),
                'total_questions': total_questions,
                'progress': 100.0
            })

        # Obtener siguiente pregunta
        questions_query = Question.objects.filter(test=test)
        if answered_question_ids:
            questions_query = questions_query.exclude(id__in=answered_question_ids)

        question = questions_query.prefetch_related('answers').order_by('id').first()

        if not question:
            return Response({'error': 'no se encontró pregunta sin responder'}, status=status.HTTP_404_NOT_FOUND)

        # Calcular número de pregunta
        question_number = Question.objects.filter(test=test, id__lte=question.pk).count()
        question_serializer = QuestionWithAnswersSerializer(question)
        progress = (len(answered_question_ids) / total_questions * 100) if total_questions > 0 else 0

        return Response({
            'question': question_serializer.data,
            'question_number': question_number,
            'total_questions': total_questions,
            'is_completed': False,
            'answered_count': len(answered_question_ids),
            'progress': round(progress, 2)
        })
    

def calculate_score(answers, test_id):
    """Calcula la puntuación de un test (optimizado)"""
    if not answers:
        return 0, 0

    # Obtener todas las respuestas correctas de una sola consulta
    correct_answers = Answer.objects.filter(
        question__test_id=test_id,
        is_correct=True
    ).select_related('question').values_list('question_id', 'id')
    
    correct_map = {q_id: a_id for q_id, a_id in correct_answers}
    
    correct_count = 0
    wrong_count = 0
    
    for question_id, user_answer_id in answers.items():
        try:
            q_id = int(question_id)
            u_answer_id = int(user_answer_id)
            if correct_map.get(q_id) == u_answer_id:
                correct_count += 1
            else:
                wrong_count += 1
        except (ValueError, TypeError):
            wrong_count += 1
    
    return correct_count, wrong_count




# Vistas para Administración

class AdminTestListView(ListAPIView):
    permission_classes = [IsAuthenticated, IsAdminUser]
    queryset = Test.objects.annotate(
        question_count=Count('questions')
    ).select_related('created_by')
    serializer_class = TestListSerializer
    pagination_class = CustomPagination
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = TestFilter
    ordering_fields = ['id', 'title', 'main_topic', 'sub_topic', 'level', 'is_active', 'created_at', 'updated_at']
    ordering = ['-created_at']

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        # Añadir filtros disponibles
        main_topics = get_main_topics()
        levels = Test.LEVEL_CHOICES
        # Obtener subtemas si se filtra por main_topic
        sub_topics = []
        main_topic = request.GET.get('main_topic')
        if main_topic:
            sub_topics = get_sub_topics(main_topic)

        response.data['available_filters'] = {
            'main_topics': main_topics,
            'sub_topics': sub_topics,
            'levels': levels,
            'statuses': ['Activo', 'Inactivo'],
        }
        response.data['stats'] = {
            'total_unfiltered': Test.objects.count(),
            'total_filtered': self.paginator.page.paginator.count,
        }
        return response


class AdminTestCreateView(CreateAPIView):
    permission_classes = [IsAuthenticated, IsAdminUser]
    serializer_class = TestCreateUpdateSerializer

    def perform_create(self, serializer):
        with transaction.atomic():
            test = serializer.save()
            # Actualizar temas
            try:
                insert_or_update_topic(test.main_topic, test.sub_topic, test.specific_topic, is_predefined=False)
                invalidate_topics_cache()
            except Exception as e:
                logger.warning(f"No se pudo guardar nuevo tema: {str(e)}")


class AdminTestUpdateView(UpdateAPIView):
    permission_classes = [IsAuthenticated, IsAdminUser]
    queryset = Test.objects.all()
    serializer_class = TestCreateUpdateSerializer
    lookup_field = 'id'
    lookup_url_kwarg = 'test_id'

    def perform_update(self, serializer):
        with transaction.atomic():
            test = serializer.save()
            # Actualizar temas
            try:
                insert_or_update_topic(test.main_topic, test.sub_topic, test.specific_topic, is_predefined=False)
                invalidate_topics_cache()
                delete_orphaned_topics()
            except Exception as e:
                logger.warning(f"No se pudo actualizar temas: {str(e)}")


class AdminTestDeleteView(DestroyAPIView):
    permission_classes = [IsAuthenticated, IsAdminUser]
    queryset = Test.objects.all()
    lookup_field = 'id'
    lookup_url_kwarg = 'test_id'

    def perform_destroy(self, instance):
        with transaction.atomic():
            # Eliminar resultados asociados
            Result.objects.filter(test_id=instance.id).delete()
            # Eliminar invitaciones asociadas (si existen)
            try:
                from apps.invitations.models import TestInvitation
                TestInvitation.objects.filter(test_id=instance.id).delete()
            except ImportError:
                pass
            # Eliminar test (preguntas y respuestas en cascada)
            instance.delete()
            # Limpiar temas huérfanos
            try:
                delete_orphaned_topics()
                invalidate_topics_cache()
            except Exception as e:
                logger.warning(f"No se pudieron eliminar topics huérfanos: {str(e)}")


