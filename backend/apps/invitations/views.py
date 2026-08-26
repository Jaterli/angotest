# apps/invitations/views.py
from rest_framework.generics import CreateAPIView, ListAPIView, DestroyAPIView
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter
from django.db import transaction
from django.utils import timezone
from django.db.models import Count, Q
from django.db.models.functions import TruncDate
from datetime import timedelta
import json
import logging

from .models import TestInvitation
from .serializers import (
    InvitationListSerializer,
    InvitationCreateSerializer,
    InvitationAcceptSerializer,
)
from .filters import InvitationFilter
from .pagination import InvitationPagination
from apps.accounts.models import User
from apps.results.models import Result

logger = logging.getLogger(__name__)


# ===========================================================================
# Endpoints públicos (con autenticación opcional)
# ===========================================================================

class CheckInvitationView(APIView):
    """Verificar estado de una invitación"""
    permission_classes = []  # Público

    def get(self, request):
        token = request.GET.get('token')
        if not token:
            return Response({'error': 'token de invitación requerido'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            invitation = TestInvitation.objects.select_related(
                'test', 'invited_by', 'guest_user'
            ).get(token=token, expires_at__gt=timezone.now())
        except TestInvitation.DoesNotExist:
            return Response({'error': 'invitación no válida o expirada'}, status=status.HTTP_404_NOT_FOUND)

        # Preparar respuesta
        data = {
            'invitation': InvitationListSerializer(invitation).data,
            'test': {
                'id': invitation.test.id,
                'title': invitation.test.title,
                'description': invitation.test.description,
                'main_topic': invitation.test.main_topic,
                'sub_topic': invitation.test.sub_topic,
                'specific_topic': invitation.test.specific_topic,
                'level': invitation.test.level,
            },
            'inviter': {
                'id': invitation.invited_by.id,
                'username': invitation.invited_by.username,
                'email': invitation.invited_by.email,
                'first_name': invitation.invited_by.first_name,
                'last_name': invitation.invited_by.last_name,
                'full_name': f"{invitation.invited_by.first_name} {invitation.invited_by.last_name}".strip(),
            },
            'is_authenticated': request.user.is_authenticated,
            'current_user_id': request.user.id if request.user.is_authenticated else 0,
        }

        # Incluir resultado existente si procede
        if invitation.guest_user:
            result_user_id = invitation.guest_user.id
        elif request.user.is_authenticated:
            result_user_id = request.user.id
        else:
            result_user_id = None

        if result_user_id:
            existing_result = Result.objects.filter(
                user_id=result_user_id,
                test_id=invitation.test.id,
            ).order_by('-updated_at').first()

            if existing_result:
                data['result'] = {
                    'id': existing_result.pk,
                    'status': existing_result.status,
                    'score': existing_result.score_percentage,
                    'started_at': existing_result.started_at.isoformat(),
                    'completed_at': existing_result.updated_at.isoformat(),
                    'updated_at': existing_result.updated_at.isoformat(),
                }

        return Response(data)


class AcceptInvitationView(APIView):
    """Aceptar una invitación"""
    permission_classes = []  # Público, pero maneja autenticación

    def post(self, request):
        token = request.GET.get('token')
        if not token:
            return Response({'error': 'token de invitación requerido'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = InvitationAcceptSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({'error': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        as_guest = serializer.validated_data.get('as_guest', False)

        try:
            invitation = TestInvitation.objects.select_related(
                'test', 'invited_by', 'guest_user'
            ).get(token=token, expires_at__gt=timezone.now())
        except TestInvitation.DoesNotExist:
            return Response({'error': 'invitación no válida o expirada'}, status=status.HTTP_404_NOT_FOUND)

        current_user = request.user if request.user.is_authenticated else None
        current_user_id = current_user.id if current_user else 0

        response_data = {
            'test_id': invitation.test.id,
            'invitation_id': invitation.pk,
        }
        authenticated_user = None

        # --- Caso A: ya hay guest_user asignado ---
        if invitation.guest_user:
            guest_user_id = invitation.guest_user.pk

            # A1: el usuario autenticado ES el guest
            if current_user_id == guest_user_id:
                invitation.is_used = True
                if invitation.is_guest and current_user and current_user.role == 'user':
                    invitation.is_guest = False
                invitation.save()
                authenticated_user = current_user
                response_data.update({
                    'user_id': current_user_id,
                    'is_guest': invitation.is_guest,
                    'message': 'Continuando con tu usuario',
                })

            # A2: usuario autenticado diferente con role 'user'
            elif current_user and current_user.role == 'user':
                with transaction.atomic():
                    transferred = self._transfer_guest_results(guest_user_id, current_user_id, invitation.test.id)
                    invitation.guest_user = current_user
                    invitation.is_guest = False
                    invitation.is_used = True
                    invitation.save()
                authenticated_user = current_user
                response_data.update({
                    'user_id': current_user_id,
                    'is_guest': False,
                    'transferred_from_guest': True,
                    'message': 'Test asignado a tu cuenta',
                })

            # A3: no autenticado – re-autenticar al guest existente
            else:
                try:
                    guest_user = User.objects.get(id=guest_user_id)
                except User.DoesNotExist:
                    return Response({'error': 'Usuario guest no encontrado', 'requires_login': True}, status=status.HTTP_404_NOT_FOUND)

                invitation.is_used = True
                invitation.save()
                authenticated_user = guest_user
                response_data.update({
                    'user_id': guest_user_id,
                    'is_guest': invitation.is_guest,
                    'auto_authenticated': True,
                    'message': 'Autenticado automáticamente como usuario invitado',
                })

        # --- Caso B: no hay guest_user asignado ---
        else:
            # B1: usuario autenticado
            if current_user:
                with transaction.atomic():
                    invitation.guest_user = current_user
                    invitation.is_guest = (current_user.role == 'guest')
                    invitation.is_used = True
                    invitation.save()
                authenticated_user = current_user
                response_data.update({
                    'user_id': current_user_id,
                    'is_guest': invitation.is_guest,
                    'message': 'Test asignado a tu cuenta',
                })

            # B2: crear guest
            elif as_guest:
                with transaction.atomic():
                    guest_user = self._create_guest_user()
                    invitation.guest_user = guest_user
                    invitation.is_guest = True
                    invitation.is_used = True
                    invitation.save()
                authenticated_user = guest_user
                response_data.update({
                    'user_id': guest_user.pk,
                    'is_guest': True,
                    'auto_authenticated': True,
                    'message': 'Cuenta de invitado creada',
                })

            # B3: requiere login
            else:
                return Response({
                    'error': 'Inicia sesión para aceptar la invitación',
                    'requires_login': True,
                }, status=status.HTTP_401_UNAUTHORIZED)

        # --- Crear respuesta y establecer cookie ---
        response = Response(response_data)

        if authenticated_user:
            from apps.accounts.views import set_auth_cookie, generate_jwt_token
            from apps.accounts.serializers import UserSerializer

            set_auth_cookie(
                response,
                authenticated_user,
                is_guest=(authenticated_user.role == 'guest')
            )
            jwt_token = generate_jwt_token(
                authenticated_user,
                is_guest=(authenticated_user.role == 'guest'),
            )
            response_data['access_token'] = jwt_token
            response_data['token_type'] = 'Bearer'
            response_data['user'] = UserSerializer(authenticated_user).data
            response.data = response_data

        return response

    def _transfer_guest_results(self, guest_user_id, new_user_id, test_id):
        updated = Result.objects.filter(
            user_id=guest_user_id,
            test_id=test_id,
        ).update(user_id=new_user_id)

        if not Result.objects.filter(user_id=guest_user_id).exists():
            User.objects.filter(id=guest_user_id).delete()

        return updated

    def _create_guest_user(self):
        from django.contrib.auth.hashers import make_password
        import secrets

        timestamp = timezone.now().strftime("%Y%m%d%H%M%S")
        username = f"guest_{timestamp}_{secrets.token_hex(4)}"
        temp_password = secrets.token_hex(8)

        return User.objects.create(
            username=username,
            email=f"{username}@guest.temp",
            password=make_password(temp_password),
            first_name="Invitado",
            role="guest",
            birth_date=timezone.now().date().replace(year=timezone.now().year - 18),
        )


# ===========================================================================
# Endpoints de usuario autenticado
# ===========================================================================

class CreateInvitationView(CreateAPIView):
    """Crear una nueva invitación"""
    permission_classes = [IsAuthenticated]
    serializer_class = InvitationCreateSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        test_id = serializer.validated_data['test_id']
        message = serializer.validated_data.get('message', '')

        from apps.test.models import Test
        try:
            test = Test.objects.get(id=test_id, is_active=True)
        except Test.DoesNotExist:
            return Response({'error': 'test no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        invitation = TestInvitation.objects.create(
            test=test,
            invited_by=request.user,
            message=message or '',
        )

        return Response({
            'invitation': InvitationListSerializer(invitation).data,
            'invitation_url': invitation.invitation_url,
            'message': 'Invitación creada exitosamente',
        }, status=status.HTTP_201_CREATED)


# ===========================================================================
# Endpoints de administración
# ===========================================================================

class AdminInvitationListView(ListAPIView):
    """Obtener todas las invitaciones con filtros y paginación"""
    permission_classes = [IsAdminUser]
    serializer_class = InvitationListSerializer
    pagination_class = InvitationPagination
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = InvitationFilter
    ordering_fields = ['id', 'test__title', 'invited_by', 'is_used', 'is_guest', 'expires_at', 'created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        return TestInvitation.objects.select_related(
            'test', 'invited_by', 'guest_user'
        )

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        return response


class AdminDeleteInvitationView(DestroyAPIView):
    """Eliminar una invitación específica"""
    permission_classes = [IsAdminUser]
    queryset = TestInvitation.objects.all()
    lookup_field = 'id'
    lookup_url_kwarg = 'invitation_id'

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.is_used and not instance.is_expired:
            return Response({'error': 'No se puede eliminar una invitación usada hasta que no expire'}, status=status.HTTP_400_BAD_REQUEST)
        instance.delete()
        return Response({'message': 'Invitación eliminada exitosamente', 'id': instance.pk})


class AdminDeleteInvitationsBulkView(APIView):
    """Eliminar múltiples invitaciones"""
    permission_classes = [IsAdminUser]

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

        used_count = TestInvitation.objects.filter(id__in=ids, is_used=True).count()
        if used_count > 0:
            return Response({
                'error': 'una o más invitaciones ya están usadas y no pueden ser eliminadas'
            }, status=status.HTTP_400_BAD_REQUEST)

        deleted_count, _ = TestInvitation.objects.filter(id__in=ids).delete()
        return Response({
            'message': 'Invitaciones eliminadas exitosamente',
            'deleted_count': deleted_count,
            'deleted_ids': ids,
        })


class AdminInvitationStatsView(APIView):
    """Obtener estadísticas de invitaciones"""
    permission_classes = [IsAdminUser]

    def get(self, request):
        now = timezone.now()
        thirty_days_ago = now - timedelta(days=30)
        seven_days_ago = now - timedelta(days=7)

        agg = TestInvitation.objects.aggregate(
            total=Count('id'),
            active=Count('id', filter=Q(is_used=False, expires_at__gt=now)),
            used=Count('id', filter=Q(is_used=True)),
            expired=Count('id', filter=Q(expires_at__lte=now)),
            with_guest=Count('id', filter=Q(guest_user__isnull=False)),
        )

        stats = {
            'total': agg['total'],
            'active': agg['active'],
            'used': agg['used'],
            'expired': agg['expired'],
            'with_guest': agg['with_guest'],
        }

        test_stats = list(
            TestInvitation.objects.values('test__id', 'test__title')
            .annotate(count=Count('id'))
            .order_by('-count')[:10]
        )

        user_stats = list(
            TestInvitation.objects.values('invited_by__id', 'invited_by__username', 'invited_by__email')
            .annotate(count=Count('id'))
            .order_by('-count')[:10]
        )

        daily_stats = list(
            TestInvitation.objects.filter(created_at__gte=thirty_days_ago)
            .annotate(day=TruncDate('created_at'))
            .values('day')
            .annotate(
                total=Count('id'),
                active=Count('id', filter=Q(is_used=False, expires_at__gt=now)),
                used=Count('id', filter=Q(is_used=True)),
                expired=Count('id', filter=Q(expires_at__lte=now)),
            )
            .order_by('day')
        )

        daily_last_7 = [d for d in daily_stats if d['day'] and d['day'] >= seven_days_ago.date()]

        return Response({
            'stats': stats,
            'by_test': test_stats,
            'by_user': user_stats,
            'daily_last_30_days': [
                {'date': d['day'].isoformat(), 'count': d['total']}
                for d in daily_stats if d['day']
            ],
            'status_over_time': {
                'last_7_days': [
                    {
                        'date': d['day'].isoformat(),
                        'total': d['total'],
                        'active': d['active'],
                        'used': d['used'],
                        'expired': d['expired'],
                    }
                    for d in daily_last_7 if d['day']
                ],
                'last_30_days': [
                    {
                        'date': d['day'].isoformat(),
                        'total': d['total'],
                        'active': d['active'],
                        'used': d['used'],
                        'expired': d['expired'],
                    }
                    for d in daily_stats if d['day']
                ],
            },
            'timestamp': now.isoformat(),
        })