# apps/accounts/views.py 
from rest_framework.generics import CreateAPIView, RetrieveAPIView, UpdateAPIView, DestroyAPIView, ListAPIView # type: ignore
from rest_framework.permissions import IsAuthenticated, AllowAny # type: ignore
from rest_framework.response import Response # type: ignore
from rest_framework import status # type: ignore
from rest_framework.views import APIView # type: ignore
from django_filters.rest_framework import DjangoFilterBackend # type: ignore
from rest_framework.filters import OrderingFilter # type: ignore
from django.db.models import Count, Avg, Q, F, FloatField, Case, When, Value
from django.db.models.functions import Coalesce, Cast
from django.contrib.auth.hashers import make_password, check_password
from django.utils import timezone
from datetime import timedelta, datetime
from django.db import transaction
import secrets
import logging
from .models import User, PasswordResetToken
from .serializers import (
    UserSerializer, UserProfileSerializer, UserUpdateSerializer,
    UserWithStatsSerializer, RegisterSerializer, LoginSerializer,
    ForgotPasswordSerializer, ResetPasswordSerializer
)
from .filters import UserFilter
from apps.shared.pagination import CustomPagination
from apps.results.models import Result
from apps.test.models import Test
from apps.admin_panel.utils import SystemConfigManager

logger = logging.getLogger(__name__)


# ===========================================================================
# Autenticación (públicos)
# ===========================================================================

class RegisterView(CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        user = User(
            username=data['username'],
            email=data['email'],
            password=make_password(data['password']),
            first_name=data.get('first_name', ''),
            last_name=data.get('last_name', ''),
            phone=data.get('phone', ''),
            address=data.get('address', ''),
            country=data['country'],
            birth_date=data['birth_date'],
        )
        user.save()

        return Response({'user': UserSerializer(user).data}, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        password = serializer.validated_data['password']

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'error': 'Credenciales inválidas'}, status=status.HTTP_401_UNAUTHORIZED)

        if not check_password(password, user.password):
            return Response({'error': 'Credenciales inválidas'}, status=status.HTTP_401_UNAUTHORIZED)

        if not user.is_active:
            return Response({'error': 'Cuenta desactivada'}, status=status.HTTP_401_UNAUTHORIZED)

        # Generar token JWT (tu función)
        from .views import generate_jwt_token, set_auth_cookie
        token = generate_jwt_token(user, False)

        response = Response({
            'user': UserSerializer(user).data,
            'message': 'Login exitoso',
            'access_token': token,
            'token_type': 'Bearer'
        })
        set_auth_cookie(response, user, False)
        return response


class CheckAuthView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        from .views import get_token_from_request, get_user_from_token
        token = get_token_from_request(request)
        if not token:
            return Response({'authenticated': False})

        user = get_user_from_token(token)
        if not user or not user.is_active:
            return Response({'authenticated': False})

        return Response({
            'authenticated': True,
            'user': UserSerializer(user).data
        })


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        response = Response({'message': 'Sesión cerrada exitosamente'})
        response.delete_cookie('auth_token', path='/')
        return response


class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'message': 'Si el email existe, se ha enviado un enlace de recuperación'})

        token = secrets.token_hex(32)
        reset_token = PasswordResetToken(
            user=user,
            token=token,
            used=False,
            expires_at=timezone.now() + timedelta(hours=24)
        )
        reset_token.save()

        # Construir enlace
        scheme = "https" if request.is_secure() else "http"
        reset_link = f"{scheme}://{settings.SITE_URL}/reset-password?token={token}"
        logger.info(f"Password reset link for {user.email}: {reset_link}")

        # Enviar email
        send_password_reset_email(user.email, reset_link)

        response_data = {'message': 'Si el email existe, se ha enviado un enlace de recuperación'}
        if getattr(settings, 'ENV', 'development') == 'development':
            response_data['reset_link'] = reset_link
        return Response(response_data)


class ValidateResetTokenView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        token = request.GET.get('token')
        if not token:
            return Response({'error': 'Token requerido'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            token_record = PasswordResetToken.objects.get(
                token=token,
                used=False,
                expires_at__gt=timezone.now()
            )
            return Response({'valid': True, 'message': 'Token válido'})
        except PasswordResetToken.DoesNotExist:
            return Response({'valid': False, 'error': 'Token inválido o expirado'}, status=status.HTTP_400_BAD_REQUEST)


class ResetPasswordWithTokenView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        token = serializer.validated_data['token']
        new_password = serializer.validated_data['new_password']

        try:
            token_record = PasswordResetToken.objects.select_related('user').get(
                token=token,
                used=False,
                expires_at__gt=timezone.now()
            )
        except PasswordResetToken.DoesNotExist:
            return Response({'error': 'Token inválido o expirado'}, status=status.HTTP_400_BAD_REQUEST)

        user = token_record.user
        user.password = make_password(new_password)
        user.save(update_fields=['password'])
        token_record.used = True
        token_record.save(update_fields=['used'])

        return Response({'message': 'Contraseña actualizada exitosamente'})


# ===========================================================================
# Perfil de usuario (autenticado)
# ===========================================================================

class ProfileView(RetrieveAPIView, UpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserProfileSerializer

    def get_object(self):
        return self.request.user

    def get(self, request, *args, **kwargs):
        user = self.get_object()
        serializer = self.get_serializer(user)
        return Response({'user': serializer.data})

    def put(self, request, *args, **kwargs):
        user = self.get_object()
        serializer = UserUpdateSerializer(user, data=request.data, partial=False)
        serializer.is_valid(raise_exception=True)

        # Validar username único
        username = serializer.validated_data.get('username')
        if username and User.objects.filter(username=username).exclude(id=user.id).exists():
            return Response({'error': 'El nombre de usuario ya está en uso'}, status=status.HTTP_400_BAD_REQUEST)

        # Validar birth_date
        birth_date = serializer.validated_data.get('birth_date')
        if birth_date:
            # Ya validado por el serializer
            pass

        serializer.save()
        return Response({
            'message': 'Perfil actualizado correctamente',
            'user': UserProfileSerializer(user).data
        })


class UpdateEmailPasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        data = request.data
        current_password = data.get('current_password')
        new_email = data.get('new_email', '').lower()
        new_password = data.get('new_password', '')

        if not new_email and not new_password:
            return Response({'error': 'Debe proporcionar al menos un nuevo email o contraseña'}, status=status.HTTP_400_BAD_REQUEST)

        if not check_password(current_password, user.password):
            return Response({'error': 'Contraseña actual incorrecta'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            if new_email:
                if '@' not in new_email or '.' not in new_email:
                    return Response({'error': 'Email inválido'}, status=status.HTTP_400_BAD_REQUEST)
                if User.objects.filter(email=new_email).exclude(id=user.id).exists():
                    return Response({'error': 'El email ya está en uso'}, status=status.HTTP_400_BAD_REQUEST)
                user.email = new_email

            if new_password:
                if len(new_password) < 6:
                    return Response({'error': 'La nueva contraseña debe tener al menos 6 caracteres'}, status=status.HTTP_400_BAD_REQUEST)
                user.password = make_password(new_password)

            user.save()

        message = "Email y contraseña actualizados correctamente" if new_email and new_password else \
                  "Email actualizado correctamente" if new_email else \
                  "Contraseña actualizada correctamente"
        return Response({'message': message, 'user': UserProfileSerializer(user).data})


class UpdateGuestProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        if user.role != 'guest':
            return Response({'error': 'Esta función solo está disponible para usuarios guest'}, status=status.HTTP_400_BAD_REQUEST)

        data = request.data
        required_fields = ['username', 'email', 'first_name', 'last_name', 'country', 'birth_date', 'new_password']
        for field in required_fields:
            if not data.get(field):
                return Response({'error': f'{field} es requerido'}, status=status.HTTP_400_BAD_REQUEST)

        username = data['username'].strip()
        email = data['email'].strip().lower()
        first_name = data['first_name'].strip()
        last_name = data['last_name'].strip()
        country = data['country'].strip()
        birth_date_str = data['birth_date']
        new_password = data['new_password']

        # Validaciones
        if len(username) < 3 or len(username) > 30:
            return Response({'error': 'Username debe tener entre 3 y 30 caracteres'}, status=status.HTTP_400_BAD_REQUEST)
        if '@' not in email or '.' not in email:
            return Response({'error': 'Email inválido'}, status=status.HTTP_400_BAD_REQUEST)
        if len(new_password) < 6:
            return Response({'error': 'La contraseña debe tener al menos 6 caracteres'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            birth_date = datetime.strptime(birth_date_str, '%Y-%m-%d').date()
        except ValueError:
            return Response({'error': 'Formato de fecha inválido. Use YYYY-MM-DD'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username=username).exclude(id=user.id).exists():
            return Response({'error': 'El nombre de usuario ya está en uso'}, status=status.HTTP_400_BAD_REQUEST)
        if User.objects.filter(email=email).exclude(id=user.id).exists():
            return Response({'error': 'El email ya está en uso'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            user.username = username
            user.email = email
            user.first_name = first_name
            user.last_name = last_name
            user.phone = data.get('phone', '')
            user.address = data.get('address', '')
            user.country = country
            user.birth_date = birth_date
            user.role = 'user'
            user.password = make_password(new_password)
            user.save()

        return Response({
            'message': 'Perfil actualizado correctamente. Ahora eres un usuario permanente.',
            'user': UserProfileSerializer(user).data
        })


class DeactivateAccountView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        user = request.user
        data = request.data
        current_password = data.get('current_password')
        confirm_text = data.get('confirm_text', '')

        expected_text = "CONFIRMAR ELIMINAR CUENTA"
        if confirm_text != expected_text:
            return Response({'error': f'Debes escribir "{expected_text}" para confirmar'}, status=status.HTTP_400_BAD_REQUEST)

        if not check_password(current_password, user.password):
            return Response({'error': 'Contraseña actual incorrecta'}, status=status.HTTP_400_BAD_REQUEST)

        # Verificar que no sea el único admin
        if user.role == 'admin':
            admin_count = User.objects.filter(role='admin', is_active=True).count()
            if admin_count <= 1:
                return Response({'error': 'No se puede eliminar el único administrador activo'}, status=status.HTTP_400_BAD_REQUEST)

        # Obtener usuario contenedor
        container_user, error = get_container_user()
        if container_user is None:
            return Response(error, status=status.HTTP_400_BAD_REQUEST)

        if user.id == container_user.pk:
            return Response({'error': 'No se puede eliminar el usuario contenedor'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            # Transferir tests y resultados
            Test.objects.filter(created_by=user.id).update(created_by=container_user.pk)
            Result.objects.filter(user_id=user.id).update(user_id=container_user.pk)
            # Eliminar cuotas
            from apps.admin_panel.models import UserQuota
            UserQuota.objects.filter(user_id=user.id).delete()
            # Eliminar invitaciones enviadas
            from apps.invitations.models import TestInvitation
            TestInvitation.objects.filter(invited_by_id=user.id).delete()
            # Anonimizar
            user.username = f"del_{user.username}_{user.id}"
            email_local = user.email.split('@')[0] if '@' in user.email else user.username
            user.email = f"{email_local}_{user.id}@deleted.local"
            user.role = 'deleted'
            user.first_name = 'Deleted'
            user.last_name = 'User'
            user.phone = ''
            user.address = ''
            user.country = ''
            user.birth_date = None
            user.is_active = False
            user.deleted_at = timezone.now()
            user.save()

        # Cerrar sesión
        from django.contrib.auth import logout as django_logout
        django_logout(request)
        response = Response({'message': 'Tu cuenta ha sido cerrada correctamente.'})
        response.delete_cookie('auth_token', path='/')
        return response


# ===========================================================================
# Dashboard y Rankings (autenticado)
# ===========================================================================

class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.accounts.services import DataService
        data_service = DataService()
        personal_data = data_service.get_personal_data(request.user.id)
        level_data = data_service.get_personal_level_data(request.user.id)
        total_active_users = data_service.get_active_users_count()
        return Response({
            'personal_data': personal_data,
            'level_data': level_data,
            'total_active_users': total_active_users
        })


class RankingsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.accounts.services import DataService
        limit = min(max(int(request.GET.get('limit', 10)), 1), 50)
        data_service = DataService()

        response = {
            'top_by_tests': data_service.get_top_by_metric('top_by_tests', limit),
            'top_by_avg_time_taken_per_question': {
                'all_attempts': data_service.get_top_by_avg_time('all', limit),
                'first_attempt': data_service.get_top_by_avg_time('first', limit)
            },
            'top_by_accuracy': {
                'all_attempts': data_service.get_top_by_accuracy('all', limit),
                'first_attempt': data_service.get_top_by_accuracy('first', limit)
            },
            'top_by_questions_answered': {
                'all_attempts': data_service.get_top_by_questions_answered('all', limit),
                'first_attempt': data_service.get_top_by_questions_answered('first', limit)
            },
            'top_by_levels': {},
            'top_by_levels_accuracy': {},
            'current_user_positions': data_service.get_user_all_ranking_positions(request.user.id),
            'min_tests_for_ranking': int(SystemConfigManager.get_value(key='MIN_TESTS_FOR_RANKING'))
        }

        for level, value in Test.LEVEL_CHOICES:
            response['top_by_levels'][level] = data_service.get_top_by_metric('top_by_level', limit, level)
            response['top_by_levels_accuracy'][level] = data_service.get_top_by_metric('top_by_levels_accuracy', limit, level)

        return Response(response)


# ===========================================================================
# Administración de usuarios (admin)
# ===========================================================================

class AdminUserListView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserWithStatsSerializer
    pagination_class = CustomPagination
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = UserFilter
    ordering_fields = ['id', 'username', 'email', 'role', 'registered_at', 'login_at', 'tests_completed', 'average_score']
    ordering = ['-registered_at']

    def get_queryset(self):

        queryset = User.objects.annotate(
            tests_completed=Coalesce(Count('results', filter=Q(results__status='completed')), Value(0)),
            tests_in_progress=Coalesce(Count('results', filter=Q(results__status='in_progress')), Value(0)),
            average_score=Coalesce(
                Avg(Case(
                    When(results__status='completed', then=Cast(
                        F('results__correct_answers') * 100.0 / (F('results__correct_answers') + F('results__wrong_answers')),
                        FloatField()
                    )),
                    default=Value(0.0),
                    output_field=FloatField()
                )),
                Value(0.0)
            ),
            total_tests_taken=Coalesce(Count('results'), Value(0))
        )
        return queryset

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        total_filtered = queryset.count()
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            response = self.get_paginated_response(serializer.data)
        else:
            serializer = self.get_serializer(queryset, many=True)
            response = Response(serializer.data)

        # Añadir estadísticas adicionales
        response.data['stats'] = {
            'total_unfiltered': User.objects.count(),
            'total_filtered': total_filtered,
        }
        return response


class AdminUserDetailView(RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    queryset = User.objects.all()
    serializer_class = UserSerializer
    lookup_field = 'id'
    lookup_url_kwarg = 'user_id'


class AdminUserProfileView(RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    queryset = User.objects.all()
    serializer_class = UserProfileSerializer
    lookup_field = 'id'
    lookup_url_kwarg = 'user_id'


class AdminDeleteUserView(DestroyAPIView):
    permission_classes = [IsAuthenticated]
    queryset = User.objects.all()
    lookup_field = 'id'
    lookup_url_kwarg = 'user_id'

    def destroy(self, request, *args, **kwargs):
        user = self.get_object()
        if user.role == 'admin':
            admin_count = User.objects.filter(role='admin', is_active=True).count()
            if admin_count <= 1:
                return Response({'error': 'No se puede eliminar el único administrador activo'}, status=status.HTTP_400_BAD_REQUEST)

        # Verificar usuario contenedor
        container_user, error = get_container_user()
        if container_user is None:
            return Response(error, status=status.HTTP_400_BAD_REQUEST)

        if user.id == container_user.pk:
            return Response({'error': 'No se puede eliminar el usuario contenedor'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            # Transferir datos
            PasswordResetToken.objects.filter(user_id=user.id).delete()
            from apps.test.models import Test
            transferred_tests = Test.objects.filter(created_by=user.id).update(created_by=container_user.pk)
            transferred_results = Result.objects.filter(user_id=user.id).update(user_id=container_user.pk)
            from apps.invitations.models import TestInvitation
            TestInvitation.objects.filter(invited_by_id=user.id).delete()
            TestInvitation.objects.filter(guest_user_id=user.id).update(guest_user=None)
            user.delete()

        return Response({
            'message': 'Usuario eliminado permanentemente',
            'deleted_user_id': user.pk,
            'deleted_username': user.username,
            'transferred_to_user_id': container_user.pk,
            'transferred_to_username': container_user.username,
            'transferred_tests': transferred_tests,
            'transferred_results': transferred_results
        })
    


from django.conf import settings
import jwt # type: ignore

def get_user_from_token(token):
    """Obtiene el usuario a partir del token JWT"""
    try:
        secret = settings.JWT_SECRET
        if not secret:
            return None
        
        payload = jwt.decode(token, secret, algorithms=['HS256'])
        user_id = payload.get('user_id')
        
        if not user_id:
            return None
        
        # Usar only() para mejorar rendimiento
        return User.objects.only('id', 'email', 'username', 'role', 'is_active').filter(id=user_id).first()
        
    except jwt.InvalidTokenError:
        return None    
    

def generate_jwt_token(user, is_guest=False):
    """Genera un token JWT para el usuario"""
    secret = settings.JWT_SECRET
    if not secret:
        raise ValueError("JWT_SECRET no configurado en el entorno")
    
    payload = {
        'user_id': user.id,
        'role': user.role,
        'is_guest': is_guest,
        'exp': timezone.now() + timedelta(hours=24),
        'iat': timezone.now(),
    }
    
    return jwt.encode(payload, secret, algorithm='HS256')


def set_auth_cookie(response, user, is_guest=False):
    """Configura la cookie de autenticación"""
    try:
        token = generate_jwt_token(user, is_guest)
        
        # Actualizar login_at
        user.login_at = timezone.now()
        user.save(update_fields=['login_at'])
        
        # Configuración de la cookie
        is_production = getattr(settings, 'ENV', 'development') == 'production'
        
        response.set_cookie(
            'auth_token',
            token,
            max_age=24 * 60 * 60,
            path='/',
            domain=None,
            secure=is_production,
            httponly=True,
            samesite='Strict' if is_production else 'Lax'
        )
        
        logger.info(f"Setting auth cookie | secure={is_production} | env={settings.ENV}")
        
    except Exception as e:
        logger.error(f"Error setting auth cookie: {str(e)}")
        raise


def get_token_from_request(request):
    """Extrae el token de Authorization header o cookie"""
    auth_header = request.headers.get('Authorization', '')
    if auth_header.startswith('Bearer '):
        return auth_header[7:]

    return request.COOKIES.get('auth_token')


def get_container_user():
    """
    Obtiene el usuario contenedor desde la configuración.
    Retorna (container_user, error_message)
    """
    from apps.admin_panel.models import SystemConfig
    
    try:
        container_user_id = int(SystemConfigManager.get_value(key='CONTAINER_USER_ID'))
        container_user = User.objects.get(id=container_user_id)
        return container_user, None
    except User.DoesNotExist:
        return None, {
            'error': f'El usuario contenedor con ID {container_user_id} no existe',
            'message': 'Por favor, asegúrate de que el usuario especificado existe o actualiza la configuración de "CONTAINER_USER_ID".'
        }
    except SystemConfig.DoesNotExist:
        return None, {
            'error': 'La configuración "CONTAINER_USER_ID" no está definida',
            'message': 'Por favor, asegúrate de que la configuración de "CONTAINER_USER_ID" esté presente en el sistema.'
        }
    


# ============== RECUPERACIÓN DE CONTRASEÑA ==============

def send_password_reset_email(to_email, reset_link):
    """Envía email de recuperación de contraseña"""
    from django.template.loader import render_to_string
    from django.core.mail import send_mail

    subject = 'Recuperación de contraseña'
    html_message = render_to_string('reset-password.html', {
        'reset_link': reset_link,
        'expires_in': '24 horas'
    })
    plain_message = f"""
    Para restablecer tu contraseña, haz clic en el siguiente enlace:
    {reset_link}
    
    Este enlace expirará en 24 horas.
    
    Si no solicitaste este cambio, ignora este mensaje.
    """
    
    send_mail(
        subject,
        plain_message,
        settings.DEFAULT_FROM_EMAIL,
        [to_email],
        html_message=html_message,
        fail_silently=False
    )    