# apps/accounts/user_management_service.py
"""
Servicio para centralizar la lógica de transferencia de datos y
eliminación/anonimización de usuarios.

Se centraliza la lógica de DeactivateAccountView y AdminDeleteUserView aquí para que
ambas vistas queden delgadas y el comportamiento sea consistente.
"""
from django.db import transaction
from django.utils import timezone

from apps.admin_panel.utils import SystemConfigManager
from apps.results.models import Result
from apps.test.models import Test
from .models import User


class ContainerUserError(Exception):
    """Se lanza cuando no se puede resolver el usuario contenedor."""
    def __init__(self, payload):
        self.payload = payload
        super().__init__(payload.get('error', 'Container user error'))


class UserManagementService:

    @staticmethod
    def get_container_user():
        """
        Obtiene el usuario contenedor desde la configuración del sistema.
        Retorna (container_user, error_dict). error_dict es None si todo ok.
        """
        from apps.admin_panel.models import SystemConfig

        raw_value = SystemConfigManager.get_value(key='CONTAINER_USER_ID')
        if raw_value is None:
            return None, {
                'error': 'La configuración "CONTAINER_USER_ID" no está definida',
                'message': 'Por favor, asegúrate de que la configuración de '
                           '"CONTAINER_USER_ID" esté presente en el sistema.'
            }

        try:
            container_user_id = int(raw_value)
        except (TypeError, ValueError):
            return None, {
                'error': 'La configuración "CONTAINER_USER_ID" tiene un valor inválido',
                'message': 'El valor configurado no es un ID de usuario numérico válido.'
            }

        try:
            container_user = User.objects.get(id=container_user_id)
        except User.DoesNotExist:
            return None, {
                'error': f'El usuario contenedor con ID {container_user_id} no existe',
                'message': 'Por favor, asegúrate de que el usuario especificado existe '
                           'o actualiza la configuración de "CONTAINER_USER_ID".'
            }

        return container_user, None

    @classmethod
    def _validate_deletable(cls, user):
        """
        Valida reglas comunes antes de anonimizar/eliminar un usuario:
        - no eliminar al único admin activo
        - no eliminar al usuario contenedor
        Lanza ValueError con un mensaje de error de negocio, o
        ContainerUserError si la configuración del contenedor falla.
        """
        if user.role == 'admin':
            admin_count = User.objects.filter(role='admin', is_active=True).count()
            if admin_count <= 1:
                raise ValueError('No se puede eliminar el único administrador activo')

        container_user, error = cls.get_container_user()
        if container_user is None:
            raise ContainerUserError(error)

        if user.id == container_user.pk:
            raise ValueError('No se puede eliminar el usuario contenedor')

        return container_user

    @classmethod
    @transaction.atomic
    def anonymize_and_transfer(cls, user):
        """
        Usado para la auto-baja (DeactivateAccountView).
        Anonimiza al usuario y transfiere sus tests/resultados al
        usuario contenedor, en lugar de borrarlo físicamente
        (para preservar integridad referencial del histórico).
        """
        container_user = cls._validate_deletable(user)

        from apps.admin_panel.models import UserQuota
        from apps.invitations.models import TestInvitation

        Test.objects.filter(created_by=user.id).update(created_by=container_user.pk)
        Result.objects.filter(user_id=user.id).update(user_id=container_user.pk)
        UserQuota.objects.filter(user_id=user.id).delete()
        TestInvitation.objects.filter(invited_by_id=user.id).delete()

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

        return user

    @classmethod
    @transaction.atomic
    def transfer_and_delete(cls, user):
        """
        Usado para el borrado por administrador (AdminDeleteUserView).
        Transfiere tests/resultados al usuario contenedor y elimina
        físicamente al usuario.

        Retorna un dict con la info del resultado de la operación.
        """
        container_user = cls._validate_deletable(user)

        from apps.invitations.models import TestInvitation
        from .models import PasswordResetToken

        PasswordResetToken.objects.filter(user_id=user.id).delete()
        transferred_tests = Test.objects.filter(created_by=user.id).update(created_by=container_user.pk)
        transferred_results = Result.objects.filter(user_id=user.id).update(user_id=container_user.pk)
        TestInvitation.objects.filter(invited_by_id=user.id).delete()
        TestInvitation.objects.filter(guest_user_id=user.id).update(guest_user=None)

        deleted_user_id = user.pk
        deleted_username = user.username
        user.delete()

        return {
            'deleted_user_id': deleted_user_id,
            'deleted_username': deleted_username,
            'transferred_to_user_id': container_user.pk,
            'transferred_to_username': container_user.username,
            'transferred_tests': transferred_tests,
            'transferred_results': transferred_results,
        }