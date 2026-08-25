# apps/accounts/serializers.py
from datetime import datetime

from rest_framework import serializers
from .models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'phone',
                  'address', 'country', 'birth_date', 'role', 'login_at',
                  'registered_at', 'is_active']


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'phone',
                  'address', 'country', 'birth_date', 'role', 'registered_at', 'login_at']


class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'first_name', 'last_name', 'phone', 'address', 'country', 'birth_date']


class UserWithStatsSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    username = serializers.CharField()
    email = serializers.CharField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    role = serializers.CharField()
    registered_at = serializers.DateTimeField()
    login_at = serializers.DateTimeField()
    tests_completed = serializers.IntegerField()
    tests_in_progress = serializers.IntegerField()
    average_score = serializers.FloatField()
    total_tests_taken = serializers.IntegerField()


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(min_length=3, max_length=50)
    email = serializers.EmailField()
    password = serializers.CharField(min_length=6, write_only=True)
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)
    phone = serializers.CharField(required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)
    country = serializers.CharField()
    birth_date = serializers.DateField()

    def validate(self, data):
        if User.objects.filter(email=data['email']).exists():
            raise serializers.ValidationError({'error': 'El email ya está registrado'})
        if User.objects.filter(username=data['username']).exists():
            raise serializers.ValidationError({'error': 'El nombre de usuario ya está en uso'})
        return data


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()


class ResetPasswordSerializer(serializers.Serializer):
    token = serializers.CharField()
    new_password = serializers.CharField(min_length=6, write_only=True)
    confirm_password = serializers.CharField(min_length=6, write_only=True)

    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Las contraseñas no coinciden'})
        return data


# ------------------------------------------------------------------
# Serializers para vistas que antes validaban manualmente en la vista
# ------------------------------------------------------------------

class UpdateEmailPasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_email = serializers.EmailField(required=False, allow_blank=True)
    new_password = serializers.CharField(required=False, allow_blank=True, min_length=6, write_only=True)

    def validate(self, data):
        new_email = data.get('new_email', '')
        new_password = data.get('new_password', '')
        if not new_email and not new_password:
            raise serializers.ValidationError('Debe proporcionar al menos un nuevo email o contraseña')
        return data

    def validate_new_email(self, value):
        # normaliza a minúsculas, igual que el comportamiento original
        return value.lower() if value else value


class UpdateGuestProfileSerializer(serializers.Serializer):
    username = serializers.CharField(min_length=3, max_length=30)
    email = serializers.EmailField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    phone = serializers.CharField(required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)
    country = serializers.CharField()
    birth_date = serializers.CharField()  # se parsea manualmente para dar el mismo mensaje de error
    new_password = serializers.CharField(min_length=6, write_only=True)

    def validate_email(self, value):
        return value.strip().lower()

    def validate_username(self, value):
        return value.strip()

    def validate_first_name(self, value):
        return value.strip()

    def validate_last_name(self, value):
        return value.strip()

    def validate_country(self, value):
        return value.strip()

    def validate_birth_date(self, value):
        try:
            return datetime.strptime(value, '%Y-%m-%d').date()
        except ValueError:
            raise serializers.ValidationError('Formato de fecha inválido. Use YYYY-MM-DD')


class DeactivateAccountSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    confirm_text = serializers.CharField()

    EXPECTED_TEXT = "CONFIRMAR ELIMINAR CUENTA"

    def validate_confirm_text(self, value):
        if value != self.EXPECTED_TEXT:
            raise serializers.ValidationError(f'Debes escribir "{self.EXPECTED_TEXT}" para confirmar')
        return value


# ------------------------------------------------------------------
# Serializers para respuestas personalizadas (documentación OpenAPI)
# ------------------------------------------------------------------

class DeleteUserResponseSerializer(serializers.Serializer):
    """Serializer para la respuesta de eliminación de usuario"""
    message = serializers.CharField()
    deleted_user_id = serializers.IntegerField()
    deleted_username = serializers.CharField()
    transferred_to_user_id = serializers.IntegerField()
    transferred_to_username = serializers.CharField()
    transferred_tests = serializers.IntegerField()
    transferred_results = serializers.IntegerField()


class LoginResponseSerializer(serializers.Serializer):
    user = UserSerializer()
    message = serializers.CharField()
    access_token = serializers.CharField()
    token_type = serializers.CharField()


class CheckAuthResponseSerializer(serializers.Serializer):
    authenticated = serializers.BooleanField()
    user = UserSerializer(required=False)


class RegisterResponseSerializer(serializers.Serializer):
    user = UserSerializer()


class ProfileGetResponseSerializer(serializers.Serializer):
    user = UserProfileSerializer()


class ProfileUpdateResponseSerializer(serializers.Serializer):
    message = serializers.CharField()
    user = UserProfileSerializer()


class UpdateEmailPasswordResponseSerializer(serializers.Serializer):
    message = serializers.CharField()
    user = UserProfileSerializer()


class UpdateGuestProfileResponseSerializer(serializers.Serializer):
    message = serializers.CharField()
    user = UserProfileSerializer()


class DeactivateAccountResponseSerializer(serializers.Serializer):
    message = serializers.CharField()


class ForgotPasswordResponseSerializer(serializers.Serializer):
    message = serializers.CharField()
    reset_link = serializers.CharField(required=False)


class ValidateResetTokenResponseSerializer(serializers.Serializer):
    valid = serializers.BooleanField()
    message = serializers.CharField()


class ResetPasswordResponseSerializer(serializers.Serializer):
    message = serializers.CharField()


class LogoutResponseSerializer(serializers.Serializer):
    message = serializers.CharField()


class DashboardResponseSerializer(serializers.Serializer):
    personal_data = serializers.JSONField()
    level_data = serializers.JSONField()
    total_active_users = serializers.IntegerField()


class RankingEntrySerializer(serializers.Serializer):
    """Entrada genérica de ranking (usuario + métrica). Ajustar campos
    si DataService devuelve una forma distinta."""
    user_id = serializers.IntegerField()
    username = serializers.CharField()
    value = serializers.FloatField()


class AttemptScopedRankingSerializer(serializers.Serializer):
    all_attempts = RankingEntrySerializer(many=True)
    first_attempt = RankingEntrySerializer(many=True)


class RankingsResponseSerializer(serializers.Serializer):
    top_by_tests = RankingEntrySerializer(many=True)
    top_by_avg_time_taken_per_question = AttemptScopedRankingSerializer()
    top_by_accuracy = AttemptScopedRankingSerializer()
    top_by_questions_answered = AttemptScopedRankingSerializer()
    top_by_levels = serializers.DictField(child=RankingEntrySerializer(many=True))
    top_by_levels_accuracy = serializers.DictField(child=RankingEntrySerializer(many=True))
    current_user_positions = serializers.JSONField()
    min_tests_for_ranking = serializers.IntegerField()