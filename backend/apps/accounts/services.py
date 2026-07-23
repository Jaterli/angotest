# users/services.py
from django.db.models import Count, Sum, Q, F, Value, OuterRef, Subquery
from django.db.models.functions import Coalesce
from django.contrib.auth import get_user_model
from apps.results.models import Result
from apps.test.models import Test
from apps.admin_panel.utils import SystemConfigManager

User = get_user_model()

# Tipos de métricas
METRIC_TESTS_COUNT = 'completed_tests'
METRIC_AVG_TIME = 'time'
METRIC_ACCURACY = 'accuracy'
METRIC_QUESTIONS_ANSWERED = 'questions_answered'


class DataService:
    """Servicio para obtener datos estadísticos del usuario y comunidad"""

    @staticmethod
    def get_min_tests_for_ranking():
        """Obtiene el valor mínimo de tests para ranking de forma dinámica"""
        system_config = int(SystemConfigManager.get_value(key='MIN_TESTS_FOR_RANKING'))
        return system_config

    # ------------------------------------------------------------------
    # Helpers internos reutilizados por varias funciones públicas
    # ------------------------------------------------------------------

    def _get_first_attempt_ids(self, user_id=None, level=None, user_id__in=None):
        """
        Devuelve un queryset (values_list de ids) con el ID del primer
        intento completado de cada test, opcionalmente filtrado por
        usuario (único o lista) y/o nivel.

        Único punto de verdad para la definición de "primer intento":
        el resultado 'completed' con el 'updated_at' más antiguo para
        cada combinación (user_id, test_id).
        """
        first_attempt_subquery = Result.objects.filter(
            status='completed',
            user_id=OuterRef('user_id'),
            test_id=OuterRef('test_id')
        ).order_by('updated_at').values('id')[:1]

        base_qs = Result.objects.filter(status='completed')

        if user_id is not None:
            base_qs = base_qs.filter(user_id=user_id)
        if user_id__in is not None:
            base_qs = base_qs.filter(user_id__in=user_id__in)
        if level is not None:
            base_qs = base_qs.filter(test__level=level)

        return base_qs.filter(id=Subquery(first_attempt_subquery)).values_list('id', flat=True)

    def _build_base_query(self, attempt_type, level=None):
        """
        Construye la query base de Result (status='completed', opcionalmente
        filtrada por nivel y por "primer intento") junto con la subquery de
        total de tests completados por usuario (todos los intentos, para
        aplicar el mínimo de tests requerido en rankings).

        Reutilizado por las funciones de "top" y de "posición".
        """
        total_tests_filter = Q(status='completed', user_id=OuterRef('user_id'))
        if level:
            total_tests_filter &= Q(test__level=level)

        total_tests_subquery = Result.objects.filter(
            total_tests_filter
        ).values('user_id').annotate(
            total_tests=Count('test_id', distinct=True)
        ).values('total_tests')

        query = Result.objects.filter(status='completed')
        if level:
            query = query.filter(test__level=level)

        if attempt_type == 'first':
            first_attempt_subquery = Result.objects.filter(
                status='completed',
                user_id=OuterRef('user_id'),
                test_id=OuterRef('test_id')
            ).order_by('updated_at').values('id')[:1]
            query = query.filter(id=Subquery(first_attempt_subquery))

        return query, total_tests_subquery

    # ------------------------------------------------------------------
    # Estadísticas personales
    # ------------------------------------------------------------------

    def get_personal_data(self, user_id):
        """Obtiene estadísticas personales del usuario"""

        first_attempt_ids = self._get_first_attempt_ids(user_id=user_id)

        # Todos los intentos
        all_attempts = Result.objects.filter(
            user_id=user_id,
            status='completed'
        ).aggregate(
            tests_count=Count('test_id', distinct=True),
            total_correct=Coalesce(Sum('correct_answers'), Value(0)),
            total_wrong=Coalesce(Sum('wrong_answers'), Value(0)),
            total_time=Coalesce(Sum('time_taken'), Value(0)),
            total_questions=Coalesce(Sum(F('correct_answers') + F('wrong_answers')), Value(0))
        )

        # Primeros intentos
        first_attempt_data = Result.objects.filter(
            id__in=first_attempt_ids
        ).aggregate(
            tests_count=Count('test_id', distinct=True),
            total_correct=Coalesce(Sum('correct_answers'), Value(0)),
            total_wrong=Coalesce(Sum('wrong_answers'), Value(0)),
            total_time=Coalesce(Sum('time_taken'), Value(0)),
            total_questions=Coalesce(Sum(F('correct_answers') + F('wrong_answers')), Value(0))
        )

        # Contar estados
        status_counts = Result.objects.filter(user_id=user_id).aggregate(
            total_completed=Count('id', filter=Q(status='completed')),
            total_in_progress=Count('id', filter=Q(status='in_progress')),
            total_expired=Count('id', filter=Q(status='expired'))
        )

        return {
            'completed_tests': status_counts['total_completed'],
            'in_progress_tests': status_counts['total_in_progress'],
            'expired_tests': status_counts['total_expired'],
            'all_attempts': {
                'tests_count': all_attempts['tests_count'],
                'total_correct': all_attempts['total_correct'],
                'total_wrong': all_attempts['total_wrong'],
                'total_time_taken': all_attempts['total_time'],
                'total_questions_answered': all_attempts['total_questions'],
            },
            'first_attempt': {
                'tests_count': first_attempt_data['tests_count'],
                'total_correct': first_attempt_data['total_correct'],
                'total_wrong': first_attempt_data['total_wrong'],
                'total_time_taken': first_attempt_data['total_time'],
                'total_questions_answered': first_attempt_data['total_questions'],
            }
        }

    def get_personal_level_data(self, user_id):
        """Obtiene estadísticas por nivel del usuario"""

        first_attempt_ids = self._get_first_attempt_ids(user_id=user_id)

        all_by_level = Result.objects.filter(
            user_id=user_id,
            status='completed'
        ).values('test__level').annotate(
            tests_count=Count('test_id', distinct=True),
            questions_count=Coalesce(Sum(F('correct_answers') + F('wrong_answers')), Value(0)),
            total_correct=Coalesce(Sum('correct_answers'), Value(0)),
            total_wrong=Coalesce(Sum('wrong_answers'), Value(0)),
            total_time_taken=Coalesce(Sum('time_taken'), Value(0))
        )

        first_by_level = Result.objects.filter(
            id__in=first_attempt_ids
        ).values('test__level').annotate(
            tests_count=Count('test_id', distinct=True),
            questions_count=Coalesce(Sum(F('correct_answers') + F('wrong_answers')), Value(0)),
            total_correct=Coalesce(Sum('correct_answers'), Value(0)),
            total_wrong=Coalesce(Sum('wrong_answers'), Value(0)),
            total_time_taken=Coalesce(Sum('time_taken'), Value(0))
        )

        all_map = {row['test__level']: row for row in all_by_level}
        first_map = {row['test__level']: row for row in first_by_level}

        empty_row = {
            'tests_count': 0, 'questions_count': 0,
            'total_correct': 0, 'total_wrong': 0, 'total_time_taken': 0
        }

        from apps.test.models import Test
        level_data = {}
        for level, value in Test.LEVEL_CHOICES:
            all_stats = all_map.get(level, empty_row)
            first_stats = first_map.get(level, empty_row)

            level_data[level] = {
                'first_attempt': {
                    'tests_count': first_stats['tests_count'],
                    'questions_count': first_stats['questions_count'],
                    'total_correct': first_stats['total_correct'],
                    'total_wrong': first_stats['total_wrong'],
                    'total_time_taken': first_stats['total_time_taken'],
                },
                'all_attempts': {
                    'tests_count': all_stats['tests_count'],
                    'questions_count': all_stats['questions_count'],
                    'total_correct': all_stats['total_correct'],
                    'total_wrong': all_stats['total_wrong'],
                    'total_time_taken': all_stats['total_time_taken'],
                }
            }

        return level_data

    # ------------------------------------------------------------------
    # Usuarios activos / top rankings
    # ------------------------------------------------------------------

    def get_active_users_count(self):
        """Obtiene usuarios con al menos MIN_TESTS_FOR_RANKING tests diferentes completados"""

        return Result.objects.filter(
            status='completed'
        ).values('user_id').annotate(
            test_count=Count('test_id', distinct=True)
        ).filter(test_count__gte=self.get_min_tests_for_ranking()).count()

    def get_top_by_metric(self, metric, limit=10, level=None, min_tests=None):
        """Obtiene top por métrica específica"""

        if min_tests is None:
            min_tests = self.get_min_tests_for_ranking()

        if metric == 'top_by_tests':
            return self._get_top_by_tests(limit, min_tests)
        elif metric == 'top_by_level':
            return self._get_top_by_level(level, limit, min_tests)
        elif metric == 'top_by_levels_accuracy':
            return self._get_top_by_levels_accuracy_optimized(level, limit, min_tests)
        return []

    def _get_top_by_tests(self, limit, min_tests):
        """Obtiene top por cantidad de tests completados"""
        results = Result.objects.filter(
            status='completed'
        ).values('user_id', 'user__username').annotate(
            value=Count('test_id', distinct=True)
        ).filter(value__gt=min_tests).order_by('-value')[:limit]

        return [{'user_id': item['user_id'], 'username': item['user__username'],
                 'value': item['value'], 'rank': idx + 1}
                for idx, item in enumerate(results)]

    def _get_top_by_level(self, level, limit, min_tests):
        """Obtiene top por nivel"""
        results = Result.objects.filter(
            status='completed',
            test__level=level
        ).values('user_id', 'user__username').annotate(
            value=Count('test_id', distinct=True)
        ).filter(value__gt=min_tests).order_by('-value')[:limit]

        return [{'user_id': item['user_id'], 'username': item['user__username'],
                 'value': item['value'], 'rank': idx + 1}
                for idx, item in enumerate(results)]

    def _get_top_by_levels_accuracy_optimized(self, level, limit, min_tests):
        """
        Obtiene top por precisión por nivel
        """
        first_attempt_ids = self._get_first_attempt_ids(level=level)

        results = Result.objects.filter(
            id__in=first_attempt_ids
        ).values('user_id', 'user__username').annotate(
            total_correct=Sum('correct_answers'),
            total_questions=Sum(F('correct_answers') + F('wrong_answers'))
        ).filter(
            total_questions__gt=0
        ).annotate(
            value=F('total_correct') * 100.0 / F('total_questions')
        ).filter(
            value__gt=0
        ).order_by('-value')[:limit]

        return [{'user_id': item['user_id'], 'username': item['user__username'],
                 'value': float(item['value']), 'rank': idx + 1}
                for idx, item in enumerate(results)]

    def get_top_by_avg_time(self, attempt_type='all', limit=10):
        """Obtiene top por tiempo promedio por pregunta"""

        min_tests = self.get_min_tests_for_ranking()
        query, total_tests_subquery = self._build_base_query(attempt_type)

        results = query.values('user_id', 'user__username').annotate(
            total_time=Sum('time_taken'),
            total_questions=Sum(F('correct_answers') + F('wrong_answers')),
            total_tests=Subquery(total_tests_subquery)
        ).filter(
            total_questions__gt=0,
            total_tests__gte=min_tests
        ).annotate(
            value=F('total_time') * 1.0 / F('total_questions')
        ).order_by('value')[:limit]

        return [{'user_id': item['user_id'], 'username': item['user__username'],
                'value': float(item['value']), 'rank': idx + 1}
                for idx, item in enumerate(results)]

    def get_top_by_accuracy(self, attempt_type='all', limit=10):
        """Obtiene top por precisión"""

        min_tests = self.get_min_tests_for_ranking()
        query, total_tests_subquery = self._build_base_query(attempt_type)

        results = query.values('user_id', 'user__username').annotate(
            total_correct=Sum('correct_answers'),
            total_questions=Sum(F('correct_answers') + F('wrong_answers')),
            total_tests=Subquery(total_tests_subquery)
        ).filter(
            total_questions__gt=0,
            total_tests__gte=min_tests
        ).annotate(
            value=F('total_correct') * 100.0 / F('total_questions')
        ).order_by('-value')[:limit]

        return [{'user_id': item['user_id'], 'username': item['user__username'],
                'value': float(item['value']), 'rank': idx + 1}
                for idx, item in enumerate(results)]

    def get_top_by_questions_answered(self, attempt_type='all', limit=10):
        """Obtiene top por preguntas respondidas"""

        min_tests = self.get_min_tests_for_ranking()
        query, total_tests_subquery = self._build_base_query(attempt_type)

        results = query.values('user_id', 'user__username').annotate(
            value=Coalesce(Sum(F('correct_answers') + F('wrong_answers')), Value(0)),
            total_tests=Subquery(total_tests_subquery),
        ).filter(
            value__gt=0,
            total_tests__gte=min_tests
        ).order_by('-value')[:limit]

        return [{'user_id': item['user_id'], 'username': item['user__username'],
                'value': item['value'], 'rank': idx + 1}
                for idx, item in enumerate(results)]


    # ------------------------------------------------------------------
    # Posición del usuario en cada métrica
    # ------------------------------------------------------------------

    def get_ranking_position_by_metric(self, user_id, metric_type, attempt_type='all', level=None):
        """Obtiene la posición del usuario en una métrica específica"""

        if metric_type == METRIC_TESTS_COUNT:
            return self._get_position_tests_count(user_id)
        elif metric_type == METRIC_AVG_TIME:
            return self._get_position_avg_time_optimized(user_id, attempt_type)
        elif metric_type == METRIC_ACCURACY:
            return self._get_position_accuracy_optimized(user_id, attempt_type)
        elif metric_type == METRIC_QUESTIONS_ANSWERED:
            return self._get_position_questions_answered_optimized(user_id, attempt_type)
        elif metric_type == 'level_accuracy' and level:
            return self._get_position_level_accuracy_optimized(user_id, level)

        return 0

    def _get_position_tests_count(self, user_id):
        """Obtiene posición por cantidad de tests"""
        user_tests = Result.objects.filter(
            user_id=user_id,
            status='completed'
        ).values('test_id').distinct().count()

        if user_tests == 0:
            return 0

        higher_count = Result.objects.filter(
            status='completed'
        ).values('user_id').annotate(
            test_count=Count('test_id', distinct=True)
        ).filter(
            test_count__gt=user_tests
        ).exclude( 
            user_id=user_id
        ).count()

        return higher_count + 1

    def _get_position_avg_time_optimized(self, user_id, attempt_type):
        """Obtiene posición por tiempo promedio"""

        min_tests = self.get_min_tests_for_ranking()
        query, total_tests_subquery = self._build_base_query(attempt_type)

        user_avg = query.filter(user_id=user_id).values('user_id').annotate(
            total_time=Sum('time_taken'),
            total_questions=Sum(F('correct_answers') + F('wrong_answers')),
            total_tests=Subquery(total_tests_subquery)
        ).filter(
            total_questions__gt=0,
            total_tests__gte=min_tests
        ).annotate(
            avg_time=F('total_time') * 1.0 / F('total_questions')
        ).order_by('user_id').first()
        
        if not user_avg or user_avg['avg_time'] is None:
            return 0

        lower_count = query.values('user_id').annotate(
            total_time=Sum('time_taken'),
            total_questions=Sum(F('correct_answers') + F('wrong_answers')),
            total_tests=Subquery(total_tests_subquery)
        ).filter(
            total_questions__gt=0,
            total_tests__gte=min_tests
        ).annotate(
            avg_time=F('total_time') * 1.0 / F('total_questions')
        ).filter(
            avg_time__lt=user_avg['avg_time'],
        ).exclude( 
            user_id=user_id
        ).count()

        return lower_count + 1

    def _get_position_accuracy_optimized(self, user_id, attempt_type):
        """Obtiene posición por precisión"""

        min_tests = self.get_min_tests_for_ranking()
        query, total_tests_subquery = self._build_base_query(attempt_type)

        user_acc = query.filter(user_id=user_id).values('user_id').annotate(
            total_correct=Sum('correct_answers'),
            total_questions=Sum(F('correct_answers') + F('wrong_answers')),
            total_tests=Subquery(total_tests_subquery)
        ).filter(
            total_questions__gt=0,
            total_tests__gte=min_tests
        ).annotate(
            accuracy=F('total_correct') * 100.0 / F('total_questions')
        ).order_by('user_id').first()

        if not user_acc or user_acc['accuracy'] is None:
            return 0
        
        higher_count = query.values('user_id').annotate(
            total_correct=Sum('correct_answers'),
            total_questions=Sum(F('correct_answers') + F('wrong_answers')),
            total_tests=Subquery(total_tests_subquery)
        ).filter(
            total_questions__gt=0,
            total_tests__gte=min_tests,
        ).annotate(
            accuracy=F('total_correct') * 100.0 / F('total_questions')
        ).filter(
            accuracy__gt=user_acc['accuracy']
        ).exclude( 
            user_id=user_id
        ).count()

        return higher_count + 1
        

    def _get_position_questions_answered_optimized(self, user_id, attempt_type):
        """Obtiene posición por preguntas respondidas"""

        min_tests = self.get_min_tests_for_ranking()
        query, total_tests_subquery = self._build_base_query(attempt_type)

        user_stats = query.filter(user_id=user_id).values('user_id').annotate(
            total=Coalesce(Sum(F('correct_answers') + F('wrong_answers')), Value(0)),
            total_tests=Subquery(total_tests_subquery)
        ).order_by('user_id').first()

        if not user_stats or user_stats['total'] == 0:
            return 0

        user_questions = user_stats['total']

        higher_count = query.values('user_id').annotate(
            total=Coalesce(Sum(F('correct_answers') + F('wrong_answers')), Value(0)),
            total_tests=Subquery(total_tests_subquery)
        ).filter(
            total__gt=user_questions,
            total_tests__gte=min_tests
        ).exclude( 
            user_id=user_id
        ).count()

        return higher_count + 1

    def _get_position_level_accuracy_optimized(self, user_id, level):
        """Obtiene posición por precisión por nivel"""

        first_attempt_ids = self._get_first_attempt_ids(level=level)

        user_stats = Result.objects.filter(
            id__in=first_attempt_ids,
            user_id=user_id
        ).values('user_id').annotate(
            total_correct=Sum('correct_answers'),
            total_questions=Sum(F('correct_answers') + F('wrong_answers'))
        ).filter(total_questions__gt=0).order_by('user_id').first()

        if not user_stats:
            return 0

        user_accuracy = user_stats['total_correct'] / user_stats['total_questions'] * 100

        higher_count = Result.objects.filter(
            id__in=first_attempt_ids
        ).values('user_id').annotate(
            total_correct=Sum('correct_answers'),
            total_questions=Sum(F('correct_answers') + F('wrong_answers'))
        ).filter(
            total_questions__gt=0
        ).annotate(
            accuracy=F('total_correct') * 100.0 / F('total_questions')
        ).filter(
            accuracy__gt=user_accuracy
        ).exclude( 
            user_id=user_id
        ).count()

        return higher_count + 1

    def get_user_all_ranking_positions(self, user_id):
        """Obtiene todas las posiciones del usuario en una sola llamada"""

        positions = {
            'total_active_users': 0,
            'completed_tests': 0,
            'all_attempts': {
                'avg_time_taken_per_question': 0,
                'accuracy': 0,
                'questions_answered': 0
            },
            'first_attempt': {
                'avg_time_taken_per_question': 0,
                'accuracy': 0,
                'questions_answered': 0
            },
            'levels': {},
        }

        positions['total_active_users'] = self.get_active_users_count()
        positions['completed_tests'] = self._get_position_tests_count(user_id)

        positions['all_attempts']['avg_time_taken_per_question'] = self._get_position_avg_time_optimized(user_id, 'all')
        positions['all_attempts']['accuracy'] = self._get_position_accuracy_optimized(user_id, 'all')
        positions['all_attempts']['questions_answered'] = self._get_position_questions_answered_optimized(user_id, 'all')

        positions['first_attempt']['avg_time_taken_per_question'] = self._get_position_avg_time_optimized(user_id, 'first')
        positions['first_attempt']['accuracy'] = self._get_position_accuracy_optimized(user_id, 'first')
        positions['first_attempt']['questions_answered'] = self._get_position_questions_answered_optimized(user_id, 'first')

        for level, value in Test.LEVEL_CHOICES:
            positions['levels'][level] = {
                'accuracy': self._get_position_level_accuracy_optimized(user_id, level)
            }

        return positions