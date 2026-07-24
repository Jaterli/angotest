# apps/accounts/serializers.py
from rest_framework import serializers
from .models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 
                  'phone', 'address', 'country', 'birth_date', 'role', 
                  'login_at', 'registered_at', 'is_active']

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name',
                  'phone', 'address', 'country', 'birth_date', 'role', 'registered_at', 'login_at']

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
            raise serializers.ValidationError({'email': 'El email ya está registrado'})
        if User.objects.filter(username=data['username']).exists():
            raise serializers.ValidationError({'username': 'El nombre de usuario ya está en uso'})
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

class RankingsResponseSerializer(serializers.Serializer):
    # Estructura compleja, se documenta con ejemplo en la vista
    pass