from rest_framework.generics import (
    ListAPIView, RetrieveAPIView, CreateAPIView,
    UpdateAPIView, DestroyAPIView
)
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter
from django.db.models import Count, Sum, Avg, F, Q, ExpressionWrapper, IntegerField
from django.utils import timezone
from datetime import datetime, timedelta
import csv
import json
import logging

# drf-spectacular imports
from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiExample

from .models import UserQuota, SystemConfig
from .filters import UserQuotaFilter, SystemConfigFilter
from .serializers import (
    UserQuotaSerializer, UserQuotaCreateSerializer,
    UserQuotaUpdateSerializer, SystemConfigSerializer,
    # nuevos serializers de respuesta
    UserQuotaCreateResponseSerializer,
    UserQuotaUpdateResponseSerializer,
    UserQuotaDeleteResponseSerializer,
    BulkDeleteResponseSerializer,
    QuotaStatsResponseSerializer,
    QuotaByUserResponseSerializer,
    SystemConfigByKeyResponseSerializer,
    DefaultSystemConfigsResponseSerializer,
    DashboardResponseSerializer,
    ActivitySummaryResponseSerializer,
    PerformanceMetricsResponseSerializer,
    TestDetailedStatsResponseSerializer,
    UserDetailedStatsResponseSerializer,
)
from apps.accounts.models import User
from apps.test.models import Test
from apps.results.models import Result
from apps.shared.pagination import CustomPagination

logger = logging.getLogger(__name__)


# ===========================================================================
# User Quota views
# ===========================================================================

class AdminUserQuotaListView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserQuotaSerializer
    pagination_class = CustomPagination
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = UserQuotaFilter
    ordering_fields = ['id', 'user_id', 'user__username', 'month_year', 'max_requests', 'used_requests', 'created_at', 'updated_at']
    ordering = ['-month_year']

    def get_queryset(self):
        return UserQuota.objects.select_related('user')

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        response.data['available_filters'] = {
            'total_quotas': UserQuota.objects.count(),
            'available_months': list(
                UserQuota.objects.values_list('month_year', flat=True)
                .distinct().order_by('-month_year')[:12]
            ) or [datetime.now().strftime('%Y-%m')],
            'available_statuses': ['normal', 'warning', 'critical', 'exceeded'],
        }
        return response


class AdminUserQuotaDetailView(RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserQuotaSerializer
    lookup_field = 'id'
    lookup_url_kwarg = 'quota_id'

    def get_queryset(self):
        return UserQuota.objects.select_related('user')


@extend_schema(
    summary="Obtener cuota de un usuario específico",
    description="Devuelve la cuota del usuario para un mes dado (o la más reciente si no se especifica)",
    responses={
        200: OpenApiResponse(description="Cuota encontrada", response=QuotaByUserResponseSerializer),
        404: OpenApiResponse(description="Cuota no encontrada"),
    }
)
class AdminUserQuotaByUserView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserQuotaSerializer

    def get_queryset(self):
        user_id = self.kwargs['user_id']
        return UserQuota.objects.select_related('user').filter(user_id=user_id)

    def list(self, request, *args, **kwargs):
        user_id = self.kwargs['user_id']
        month_year = request.GET.get('month_year')
        queryset = self.get_queryset()
        if month_year:
            queryset = queryset.filter(month_year=month_year)
        else:
            queryset = queryset.order_by('-month_year')
        serializer = self.get_serializer(queryset, many=True)
        if not queryset.exists():
            return Response({'error': 'cuota no encontrada'}, status=status.HTTP_404_NOT_FOUND)
        # Devolvemos el primer elemento (o None si no hay)
        return Response({'quota': serializer.data[0] if serializer.data else None})


class AdminUserQuotaMonthsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id):
        months = list(
            UserQuota.objects.filter(user_id=user_id)
            .values_list('month_year', flat=True)
            .distinct()
            .order_by('-month_year')
        )
        return Response({'months': months})


@extend_schema(
    summary="Crear una nueva cuota de usuario",
    request=UserQuotaCreateSerializer,
    responses={
        201: OpenApiResponse(description="Cuota creada", response=UserQuotaCreateResponseSerializer),
        404: OpenApiResponse(description="Usuario no encontrado"),
        409: OpenApiResponse(description="Ya existe una cuota para ese usuario y mes"),
        400: OpenApiResponse(description="Datos inválidos"),
    }
)
class AdminCreateUserQuotaView(CreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserQuotaCreateSerializer
    # No usamos el CreateAPIView por defecto porque personalizamos la respuesta

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user_id = serializer.validated_data['user_id']
        month_year = serializer.validated_data['month_year']
        max_requests = serializer.validated_data['max_requests']

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'error': 'usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        if UserQuota.objects.filter(user_id=user_id, month_year=month_year).exists():
            return Response({'error': 'ya existe una cuota para este usuario y mes'}, status=status.HTTP_409_CONFLICT)

        quota = UserQuota.objects.create(
            user=user,
            month_year=month_year,
            max_requests=max_requests,
            used_requests=0,
        )

        return Response({
            'quota': UserQuotaSerializer(quota).data,
            'message': 'Cuota creada exitosamente'
        }, status=status.HTTP_201_CREATED)


@extend_schema(
    summary="Actualizar una cuota existente",
    request=UserQuotaUpdateSerializer,
    responses={
        200: OpenApiResponse(description="Cuota actualizada", response=UserQuotaUpdateResponseSerializer),
        400: OpenApiResponse(description="Datos inválidos"),
        404: OpenApiResponse(description="Cuota no encontrada"),
    }
)
class AdminUpdateUserQuotaView(UpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserQuotaUpdateSerializer
    lookup_field = 'id'
    lookup_url_kwarg = 'quota_id'

    def get_queryset(self):
        return UserQuota.objects.select_related('user')

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)

        if 'max_requests' in serializer.validated_data:
            instance.max_requests = serializer.validated_data['max_requests']
        if 'used_requests' in serializer.validated_data:
            instance.used_requests = serializer.validated_data['used_requests']

        instance.save()
        return Response({
            'quota': UserQuotaSerializer(instance).data,
            'message': 'Cuota actualizada exitosamente'
        })


@extend_schema(
    summary="Eliminar una cuota",
    responses={
        200: OpenApiResponse(description="Cuota eliminada", response=UserQuotaDeleteResponseSerializer),
        404: OpenApiResponse(description="Cuota no encontrada"),
    }
)
class AdminDeleteUserQuotaView(DestroyAPIView):
    permission_classes = [IsAuthenticated]
    queryset = UserQuota.objects.all()
    lookup_field = 'id'
    lookup_url_kwarg = 'quota_id'
    serializer_class = None  # Para que drf-spectacular no intente obtener un serializer

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        deleted_data = {'id': instance.pk, 'user_id': instance.user.id, 'month_year': instance.month_year}
        instance.delete()
        return Response({'message': 'Cuota eliminada exitosamente', 'deleted': deleted_data})


@extend_schema(
    summary="Eliminar múltiples cuotas",
    request=OpenApiExample(
        name="BulkDelete",
        value={"ids": [1, 2, 3]},
        request_only=True,
    ),
    responses={
        200: OpenApiResponse(description="Cuotas eliminadas", response=BulkDeleteResponseSerializer),
        400: OpenApiResponse(description="Datos inválidos"),
        404: OpenApiResponse(description="Alguna cuota no existe"),
    }
)
class AdminDeleteQuotasBulkView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return Response({'error': 'Invalid JSON'}, status=status.HTTP_400_BAD_REQUEST)

        ids = data.get('ids', [])
        if not ids or not isinstance(ids, list):
            return Response({'error': 'Se requiere una lista de IDs con al menos un elemento'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            ids = [int(v) for v in ids]
        except (ValueError, TypeError):
            return Response({'error': 'Los IDs deben ser números enteros'}, status=status.HTTP_400_BAD_REQUEST)

        existing_count = UserQuota.objects.filter(id__in=ids).count()
        if existing_count != len(ids):
            return Response({
                'error': 'una o más cuotas no existen',
                'found': existing_count,
                'requested': len(ids),
            }, status=status.HTTP_404_NOT_FOUND)

        deleted_count, _ = UserQuota.objects.filter(id__in=ids).delete()
        return Response({
            'message': 'Cuotas eliminadas exitosamente',
            'deleted_count': deleted_count,
            'deleted_ids': ids
        })


@extend_schema(
    summary="Estadísticas de cuotas",
    responses={200: OpenApiResponse(description="Estadísticas", response=QuotaStatsResponseSerializer)}
)
class AdminQuotaStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        annotated = UserQuota.objects.filter(max_requests__gt=0).annotate(
            usage_pct=ExpressionWrapper(
                F('used_requests') * 100 / F('max_requests'),
                output_field=IntegerField()
            )
        )

        stats = {
            'total_users_with_quota': UserQuota.objects.values('user_id').distinct().count(),
            'total_requests_allowed': UserQuota.objects.aggregate(total=Sum('max_requests'))['total'] or 0,
            'total_requests_used': UserQuota.objects.aggregate(total=Sum('used_requests'))['total'] or 0,
            'users_exceeding_quota': UserQuota.objects.filter(
                used_requests__gt=F('max_requests')
            ).values('user_id').distinct().count(),
            'users_critical': annotated.filter(
                usage_pct__gte=80, usage_pct__lt=100
            ).values('user_id').distinct().count(),
            'users_warning': annotated.filter(
                usage_pct__gte=50, usage_pct__lt=80
            ).values('user_id').distinct().count(),
        }

        current_month = datetime.now().strftime('%Y-%m')
        current_month_agg = UserQuota.objects.filter(month_year=current_month).aggregate(
            total_requests=Sum('max_requests'),
            used_requests=Sum('used_requests'),
        )

        monthly_stats = list(
            UserQuota.objects.values('month_year').annotate(
                total_requests=Sum('max_requests'),
                used_requests=Sum('used_requests'),
                user_count=Count('user_id', distinct=True),
            ).order_by('-month_year')[:12]
        )

        top_users = list(
            UserQuota.objects.select_related('user').values(
                'user_id', 'user__username', 'user__email'
            ).annotate(
                total_used=Sum('used_requests'),
                total_allowed=Sum('max_requests'),
            ).order_by('-total_used')[:10]
        )

        return Response({
            'stats': stats,
            'current_month': {
                'month': current_month,
                'total_requests': current_month_agg['total_requests'] or 0,
                'used_requests': current_month_agg['used_requests'] or 0,
            },
            'monthly_stats': [
                {
                    'month': item['month_year'],
                    'total_requests': item['total_requests'] or 0,
                    'used_requests': item['used_requests'] or 0,
                    'user_count': item['user_count'],
                    'usage_percentage': int(
                        (item['used_requests'] or 0) * 100 / (item['total_requests'] or 1)
                    ),
                }
                for item in monthly_stats
            ],
            'top_users': [
                {
                    'user_id': item['user_id'],
                    'username': item['user__username'],
                    'email': item['user__email'],
                    'total_used': item['total_used'],
                    'total_allowed': item['total_allowed'],
                    'usage_percentage': int(
                        item['total_used'] * 100 / (item['total_allowed'] or 1)
                    ),
                }
                for item in top_users
            ],
            'timestamp': datetime.now().isoformat(),
        })


@extend_schema(
    summary="Exportar cuotas a CSV",
    responses={
        200: OpenApiResponse(description="Archivo CSV", response={'type': 'string', 'format': 'binary'}),
    }
)
class AdminExportQuotasCSVView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        search = request.GET.get('search', '')
        month_year = request.GET.get('month_year')

        qs = UserQuota.objects.select_related('user')
        if search:
            qs = qs.filter(
                Q(user__username__icontains=search) | Q(user__email__icontains=search)
            )
        if month_year:
            qs = qs.filter(month_year=month_year)

        response = Response(content_type='text/csv; charset=utf-8')
        response['Content-Disposition'] = 'attachment; filename="user_quotas_export.csv"'
        response.write('\ufeff')

        writer = csv.writer(response)
        writer.writerow(['ID', 'Usuario ID', 'Usuario', 'Email', 'Mes/Año',
                         'Máx. Solicitudes', 'Usadas', 'Restantes', 'Uso (%)', 'Estado',
                         'Creada', 'Actualizada'])
        for quota in qs:
            writer.writerow([
                quota.pk, quota.user.id, quota.user.username, quota.user.email,
                quota.month_year, quota.max_requests, quota.used_requests,
                quota.remaining_requests, quota.usage_percentage, quota.status,
                quota.created_at.isoformat(), quota.updated_at.isoformat(),
            ])
        return response


# ===========================================================================
# System Config views
# ===========================================================================

class AdminSystemConfigListView(ListAPIView):
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = SystemConfigFilter
    ordering_fields = ['key', 'value', 'description', 'created_at', 'updated_at']
    ordering = ['-created_at']

    queryset = SystemConfig.objects.all()
    serializer_class = SystemConfigSerializer


@extend_schema(
    summary="Obtener configuración por clave",
    description="Devuelve el valor como entero (o error si no existe)",
    responses={
        200: OpenApiResponse(description="Valor encontrado", response=SystemConfigByKeyResponseSerializer),
        404: OpenApiResponse(description="Clave no encontrada"),
    }
)
class AdminSystemConfigByKeyView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, key):
        try:
            config = SystemConfig.objects.get(key=key)
            return Response(int(config.value))
        except SystemConfig.DoesNotExist:
            # Fallback a settings.SYSTEM_CONFIG
            from django.conf import settings
            if hasattr(settings, 'SYSTEM_CONFIG') and key in settings.SYSTEM_CONFIG:
                return Response(int(settings.SYSTEM_CONFIG[key]))
            return Response({'error': 'Configuración no encontrada'}, status=status.HTTP_404_NOT_FOUND)


@extend_schema(
    summary="Obtener configuraciones por defecto",
    description="Lista las configuraciones definidas en settings.SYSTEM_CONFIG y su existencia en BD",
    responses={200: OpenApiResponse(description="Lista de configuraciones", response=DefaultSystemConfigsResponseSerializer)}
)
class AdminDefaultSystemConfigsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from django.conf import settings
        existing_keys = set(SystemConfig.objects.values_list('key', flat=True))
        configs = []
        for key, value in settings.SYSTEM_CONFIG.items():
            configs.append({
                'key': key,
                'value': str(value),
                'exists_in_db': key in existing_keys
            })
        return Response(configs)


class AdminCreateSystemConfigView(CreateAPIView):
    permission_classes = [IsAuthenticated]
    queryset = SystemConfig.objects.all()
    serializer_class = SystemConfigSerializer

    def create(self, request, *args, **kwargs):
        try:
            data = json.loads(request.body) if isinstance(request.body, bytes) else request.data
        except:
            data = request.data

        if not data.get('key'):
            return Response({'error': 'key es requerido'}, status=status.HTTP_400_BAD_REQUEST)
        if data.get('value') is None:
            return Response({'error': 'value es requerido'}, status=status.HTTP_400_BAD_REQUEST)

        key = data['key'].strip()
        if SystemConfig.objects.filter(key=key).exists():
            return Response({'error': 'La clave ya existe'}, status=status.HTTP_409_CONFLICT)

        config = SystemConfig.objects.create(
            key=key,
            value=data['value'],
            description=data.get('description', '').strip(),
        )
        return Response(SystemConfigSerializer(config).data, status=status.HTTP_201_CREATED)


class AdminUpdateSystemConfigView(UpdateAPIView):
    permission_classes = [IsAuthenticated]
    queryset = SystemConfig.objects.all()
    serializer_class = SystemConfigSerializer
    lookup_field = 'id'
    lookup_url_kwarg = 'config_id'

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        try:
            data = json.loads(request.body) if isinstance(request.body, bytes) else request.data
        except:
            data = request.data

        if not any(field in data for field in ('key', 'value', 'description')):
            return Response({'error': 'No hay campos para actualizar'}, status=status.HTTP_400_BAD_REQUEST)

        if 'key' in data and data['key']:
            new_key = data['key'].strip()
            if new_key != instance.key:
                if SystemConfig.objects.filter(key=new_key).exclude(id=instance.id).exists():
                    return Response({'error': 'La clave ya existe en otro registro'}, status=status.HTTP_409_CONFLICT)
                instance.key = new_key

        if 'value' in data and data['value'] is not None:
            instance.value = data['value']

        if 'description' in data:
            instance.description = data['description'].strip()

        instance.save()
        return Response(SystemConfigSerializer(instance).data)


class AdminDeleteSystemConfigView(DestroyAPIView):
    permission_classes = [IsAuthenticated]
    queryset = SystemConfig.objects.all()
    serializer_class = SystemConfigSerializer
    lookup_field = 'id'
    lookup_url_kwarg = 'config_id'


# ===========================================================================
# Dashboard views
# ===========================================================================

@extend_schema(
    summary="Dashboard administrativo",
    description="Obtiene métricas generales: totales, tests destacados, listas de usuarios",
    responses={200: OpenApiResponse(description="Datos del dashboard", response=DashboardResponseSerializer)}
)
class AdminDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')
        limit = int(request.GET.get('limit', 10))
        if limit < 1 or limit > 50:
            limit = 10

        return Response({
            'totals': self._get_dashboard_totals(start_date, end_date),
            'top_tests': self._get_top_tests_lists(start_date, end_date, limit),
            'user_lists': self._get_user_lists(start_date, end_date, limit),
        })

    def _parse_date(self, date_str, fmt='%Y-%m-%d'):
        try:
            return datetime.strptime(date_str, fmt).date()
        except (ValueError, TypeError):
            return None

    def _get_dashboard_totals(self, start_date=None, end_date=None):
        user_filters = Q()
        result_filters = Q()
        test_filters = Q()

        start = self._parse_date(start_date)
        end = self._parse_date(end_date)

        if start:
            user_filters &= Q(registered_at__date__gte=start)
            result_filters &= Q(started_at__date__gte=start)
            test_filters &= Q(created_at__date__gte=start)
        if end:
            user_filters &= Q(registered_at__date__lte=end)
            result_filters &= Q(started_at__date__lte=end)
            test_filters &= Q(created_at__date__lte=end)

        result_agg = Result.objects.filter(result_filters).aggregate(
            completed=Count('id', filter=Q(status='completed')),
            in_progress=Count('id', filter=Q(status='in_progress')),
            expired=Count('id', filter=Q(status='expired')),
        )

        test_agg = Test.objects.filter(test_filters).aggregate(
            total=Count('id'),
            inactive=Count('id', filter=Q(is_active=False)),
            advanced=Count('id', filter=Q(level='Avanzado')),
            intermediate=Count('id', filter=Q(level='Intermedio')),
            beginner=Count('id', filter=Q(level='Principiante')),
        )

        active_users = (
            User.objects.filter(user_filters, results__status='completed')
            .annotate(test_count=Count('results'))
            .filter(test_count__gte=5)
            .distinct()
            .count()
        )

        return {
            'total_users': User.objects.filter(user_filters).count(),
            'active_users': active_users,
            'completed_tests': result_agg['completed'],
            'in_progress_tests': result_agg['in_progress'],
            'expired_tests': result_agg['expired'],
            'total_tests': test_agg['total'],
            'inactive_tests': test_agg['inactive'],
            'advanced_tests': test_agg['advanced'],
            'intermediate_tests': test_agg['intermediate'],
            'beginner_tests': test_agg['beginner'],
        }

    def _get_top_tests_lists(self, start_date=None, end_date=None, limit=10):
        result_date_filter = Q()
        if start := self._parse_date(start_date):
            result_date_filter &= Q(results__started_at__date__gte=start)
        if end := self._parse_date(end_date):
            result_date_filter &= Q(results__started_at__date__lte=end)

        result_qs_filter = Q(status='completed')
        if start:
            result_qs_filter &= Q(started_at__date__gte=start)
        if end:
            result_qs_filter &= Q(started_at__date__lte=end)

        # Most completed
        most_completed = (
            Test.objects.annotate(
                completed_count=Count('results', filter=Q(results__status='completed') & result_date_filter)
            ).order_by('-completed_count').values('id', 'title', 'completed_count')[:limit]
        )

        # Most in-progress
        most_incomplete = (
            Test.objects.annotate(
                in_progress_count=Count('results', filter=Q(results__status='in_progress') & result_date_filter)
            ).order_by('-in_progress_count').values('id', 'title', 'in_progress_count')[:limit]
        )

        # Most expired
        most_expired = (
            Test.objects.annotate(
                expired_count=Count('results', filter=Q(results__status='expired') & result_date_filter)
            ).order_by('-expired_count').values('id', 'title', 'expired_count')[:limit]
        )

        # Least started
        least_started_oldest = (
            Test.objects.annotate(
                attempt_count=Count('results', filter=result_date_filter)
            ).order_by('attempt_count', 'created_at')
            .values('id', 'title', 'attempt_count', 'created_at')[:limit]
        )

        # Accuracy & time
        completed_results = Result.objects.filter(result_qs_filter)
        accuracy_time_agg = (
            completed_results
            .values('test_id', 'test__title')
            .annotate(
                total_correct=Sum('correct_answers'),
                total_wrong=Sum('wrong_answers'),
                total_attempts=Count('id'),
                avg_time=Avg('time_taken'),
            )
        )

        accuracy_data = []
        time_data = []
        for item in accuracy_time_agg:
            total_q = (item['total_correct'] or 0) + (item['total_wrong'] or 0)
            acc = round((item['total_correct'] or 0) * 100 / total_q, 2) if total_q else 0.0
            avg_t = round(float(item['avg_time'] or 0), 2)
            base = {'id': item['test_id'], 'title': item['test__title'], 'total_attempts': item['total_attempts']}
            accuracy_data.append({**base, 'accuracy_rate': acc})
            time_data.append({**base, 'avg_time': avg_t})

        accuracy_data.sort(key=lambda x: x['accuracy_rate'], reverse=True)
        time_data.sort(key=lambda x: x['avg_time'], reverse=True)

        return {
            'most_completed': [
                {'id': t['id'], 'title': t['title'], 'count': t['completed_count']}
                for t in most_completed
            ],
            'most_incomplete': [
                {'id': t['id'], 'title': t['title'], 'count': t['in_progress_count']}
                for t in most_incomplete
            ],
            'most_expired': [
                {'id': t['id'], 'title': t['title'], 'count': t['expired_count']}
                for t in most_expired
            ],
            'least_started_oldest': [
                {'id': t['id'], 'title': t['title'], 'attempt_count': t['attempt_count'],
                 'date': t['created_at'].isoformat()}
                for t in least_started_oldest
            ],
            'highest_accuracy': accuracy_data[:limit],
            'lowest_accuracy': sorted(accuracy_data, key=lambda x: x['accuracy_rate'])[:limit],
            'highest_avg_time': time_data[:limit],
            'lowest_avg_time': sorted(time_data, key=lambda x: x['avg_time'])[:limit],
        }

    def _get_user_lists(self, start_date=None, end_date=None, limit=10):
        user_filters = Q()
        if start := self._parse_date(start_date):
            user_filters &= Q(registered_at__date__gte=start)
        if end := self._parse_date(end_date):
            user_filters &= Q(registered_at__date__lte=end)

        new_users = (
            User.objects.filter(user_filters)
            .order_by('-registered_at')
            .values('id', 'username', 'role')[:limit]
        )

        most_active = (
            User.objects.annotate(
                completed_count=Count('results', filter=Q(results__status='completed'))
            ).filter(completed_count__gt=0)
            .order_by('-completed_count')
            .values('id', 'username', 'role', 'completed_count')[:limit]
        )

        least_active_oldest = (
            User.objects.annotate(
                completed_count=Count('results', filter=Q(results__status='completed'))
            ).filter(completed_count=0)
            .order_by('registered_at')
            .values('id', 'username', 'role', 'registered_at')[:limit]
        )

        recent_login = (
            User.objects.filter(login_at__isnull=False)
            .order_by('-login_at')
            .values('id', 'username', 'role', 'login_at')[:limit]
        )

        oldest_login = (
            User.objects.filter(login_at__isnull=False)
            .order_by('login_at')
            .values('id', 'username', 'role', 'login_at')[:limit]
        )

        return {
            'new_users_by_month': [
                {'id': u['id'], 'username': u['username'], 'role': u['role'], 'count': 1}
                for u in new_users
            ],
            'most_active_users': [
                {'id': u['id'], 'username': u['username'], 'role': u['role'], 'count': u['completed_count']}
                for u in most_active
            ],
            'least_active_oldest': [
                {'id': u['id'], 'username': u['username'], 'role': u['role'],
                 'date': u['registered_at'].isoformat()}
                for u in least_active_oldest
            ],
            'recent_login': [
                {'id': u['id'], 'username': u['username'], 'role': u['role'],
                 'date': u['login_at'].isoformat()}
                for u in recent_login
            ],
            'oldest_login': [
                {'id': u['id'], 'username': u['username'], 'role': u['role'],
                 'date': u['login_at'].isoformat()}
                for u in oldest_login
            ],
        }


@extend_schema(
    summary="Resumen de actividad diaria",
    description="Muestra resultados, usuarios y tests por día en los últimos 30 días",
    responses={200: OpenApiResponse(description="Actividad diaria", response=ActivitySummaryResponseSerializer)}
)
class AdminDashboardActivitySummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        end = timezone.now().date()
        start = end - timedelta(days=30)

        # Results
        results_qs = (
            Result.objects
            .filter(started_at__date__gte=start, started_at__date__lte=end)
            .values('started_at__date', 'status')
            .annotate(cnt=Count('id'))
        )
        results_by_day = {}
        for row in results_qs:
            d = row['started_at__date'].isoformat()
            bucket = results_by_day.setdefault(d, {'total': 0, 'completed': 0, 'in_progress': 0, 'expired': 0})
            bucket['total'] += row['cnt']
            bucket[row['status']] = bucket.get(row['status'], 0) + row['cnt']

        # New users
        users_qs = (
            User.objects
            .filter(registered_at__date__gte=start, registered_at__date__lte=end)
            .values('registered_at__date')
            .annotate(cnt=Count('id'))
        )
        users_by_day = {row['registered_at__date'].isoformat(): row['cnt'] for row in users_qs}

        # New tests
        tests_qs = (
            Test.objects
            .filter(created_at__date__gte=start, created_at__date__lte=end)
            .values('created_at__date')
            .annotate(cnt=Count('id'))
        )
        tests_by_day = {row['created_at__date'].isoformat(): row['cnt'] for row in tests_qs}

        daily_results, daily_users, daily_tests = [], [], []
        current = start
        while current <= end:
            d = current.isoformat()
            bucket = results_by_day.get(d, {})
            daily_results.append({
                'date': d,
                'total': bucket.get('total', 0),
                'completed': bucket.get('completed', 0),
                'in_progress': bucket.get('in_progress', 0),
                'expired': bucket.get('expired', 0),
            })
            daily_users.append({'date': d, 'count': users_by_day.get(d, 0)})
            daily_tests.append({'date': d, 'count': tests_by_day.get(d, 0)})
            current += timedelta(days=1)

        return Response({
            'daily_results': daily_results,
            'daily_users': daily_users,
            'daily_tests': daily_tests,
            'start_date': start.isoformat(),
            'end_date': end.isoformat(),
        })


@extend_schema(
    summary="Métricas de rendimiento globales",
    description="Tasa de finalización, precisión, tiempo promedio, distribución por nivel y rol",
    responses={200: OpenApiResponse(description="Métricas de rendimiento", response=PerformanceMetricsResponseSerializer)}
)
class AdminDashboardPerformanceMetricsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        agg = Result.objects.aggregate(
            total=Count('id'),
            completed=Count('id', filter=Q(status='completed')),
            total_correct=Sum('correct_answers', filter=Q(status='completed')),
            total_answers=Sum(
                F('correct_answers') + F('wrong_answers'),
                filter=Q(status='completed'),
            ),
            avg_time=Avg('time_taken', filter=Q(status='completed')),
        )

        total = agg['total'] or 0
        completed = agg['completed'] or 0
        completion_rate = (completed / total * 100) if total else 0

        total_answers = agg['total_answers'] or 0
        overall_accuracy = (
            (agg['total_correct'] or 0) / total_answers * 100 if total_answers else 0
        )

        level_distribution = list(Test.objects.values('level').annotate(count=Count('id')))
        role_distribution = list(User.objects.values('role').annotate(count=Count('id')))

        return Response({
            'completion_rate': round(completion_rate, 2),
            'overall_accuracy': round(overall_accuracy, 2),
            'average_time_minutes': round((agg['avg_time'] or 0) / 60, 2),
            'level_distribution': level_distribution,
            'role_distribution': role_distribution,
        })


@extend_schema(
    summary="Estadísticas detalladas de un test",
    responses={
        200: OpenApiResponse(description="Estadísticas del test", response=TestDetailedStatsResponseSerializer),
        404: OpenApiResponse(description="Test no encontrado"),
    }
)
class AdminTestDetailedStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, test_id):
        try:
            test = Test.objects.get(id=test_id)
        except Test.DoesNotExist:
            return Response({'error': 'Test no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        all_results = Result.objects.filter(test_id=test_id)
        agg = all_results.aggregate(
            total=Count('id'),
            completed=Count('id', filter=Q(status='completed')),
            in_progress=Count('id', filter=Q(status='in_progress')),
            expired=Count('id', filter=Q(status='expired')),
            avg_correct=Avg('correct_answers', filter=Q(status='completed')),
            avg_wrong=Avg('wrong_answers', filter=Q(status='completed')),
            avg_time=Avg('time_taken', filter=Q(status='completed')),
        )

        avg_correct = agg['avg_correct'] or 0
        avg_wrong = agg['avg_wrong'] or 0
        total_avg = avg_correct + avg_wrong
        avg_accuracy = (avg_correct / total_avg * 100) if total_avg else 0

        total = agg['total'] or 0
        completed = agg['completed'] or 0
        completion_rate = (completed / total * 100) if total else 0

        return Response({
            'test_title': test.title,
            'test_level': test.level,
            'topic_hierarchy': {
                'main_topic': test.main_topic,
                'sub_topic': test.sub_topic,
                'specific_topic': test.specific_topic,
            },
            'total_attempts': total,
            'completed_attempts': completed,
            'in_progress_attempts': agg['in_progress'] or 0,
            'expired_attempts': agg['expired'] or 0,
            'avg_accuracy': round(avg_accuracy, 2),
            'avg_time': round(agg['avg_time'] or 0, 2),
            'completion_rate': round(completion_rate, 2),
        })


@extend_schema(
    summary="Estadísticas detalladas de un usuario",
    responses={
        200: OpenApiResponse(description="Estadísticas del usuario", response=UserDetailedStatsResponseSerializer),
        404: OpenApiResponse(description="Usuario no encontrado"),
    }
)
class AdminUserDetailedStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        agg = Result.objects.filter(user_id=user_id).aggregate(
            total=Count('id'),
            completed=Count('id', filter=Q(status='completed')),
            in_progress=Count('id', filter=Q(status='in_progress')),
            expired=Count('id', filter=Q(status='expired')),
            avg_correct=Avg('correct_answers', filter=Q(status='completed')),
            avg_wrong=Avg('wrong_answers', filter=Q(status='completed')),
            avg_time=Avg('time_taken', filter=Q(status='completed')),
        )

        avg_correct = agg['avg_correct'] or 0
        avg_wrong = agg['avg_wrong'] or 0
        total_avg = avg_correct + avg_wrong
        avg_accuracy = (avg_correct / total_avg * 100) if total_avg else 0

        completed_results = Result.objects.filter(user_id=user_id, status='completed')
        favorite_topic = (
            completed_results.values('test__main_topic')
            .annotate(count=Count('id'))
            .order_by('-count')
            .first()
        )
        favorite_level = (
            completed_results.values('test__level')
            .annotate(count=Count('id'))
            .order_by('-count')
            .first()
        )

        recent_activity = (
            Result.objects.filter(user_id=user_id)
            .select_related('test')
            .order_by('-started_at')[:10]
        )

        recent_list = []
        for result in recent_activity:
            total_ans = result.correct_answers + result.wrong_answers
            accuracy = (
                round(result.correct_answers / total_ans * 100, 2)
                if total_ans and result.status == 'completed' else 0
            )
            recent_list.append({
                'test_title': result.test.title,
                'status': result.status,
                'accuracy': accuracy,
                'time_taken': result.time_taken,
                'started_at': result.started_at.isoformat(),
            })

        return Response({
            'user_info': {
                'username': user.username,
                'email': user.email,
                'registered_at': user.registered_at.isoformat() if user.registered_at else None,
                'last_login': user.login_at.isoformat() if user.login_at else None,
                'role': user.role,
            },
            'test_stats': {
                'total_tests': agg['total'] or 0,
                'completed_tests': agg['completed'] or 0,
                'in_progress_tests': agg['in_progress'] or 0,
                'expired_tests': agg['expired'] or 0,
                'avg_accuracy': round(avg_accuracy, 2),
                'avg_time_per_test': round(agg['avg_time'] or 0, 2),
                'favorite_topic': favorite_topic['test__main_topic'] if favorite_topic else 'N/A',
                'favorite_level': favorite_level['test__level'] if favorite_level else 'N/A',
            },
            'recent_activity': recent_list,
        })