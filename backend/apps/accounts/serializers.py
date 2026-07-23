# apps/accounts/serializers.py
from rest_framework import serializers # type: ignore
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
    # phone = serializers.CharField()
    # address = serializers.CharField()
    # country = serializers.CharField()
    # birth_date = serializers.DateField()
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