from rest_framework import serializers # type: ignore
from .models import UserQuota, SystemConfig
from apps.accounts.models import User

class UserQuotaSerializer(serializers.ModelSerializer):
    user__username = serializers.CharField(source='user.username', read_only=True)
    user__email = serializers.CharField(source='user.email', read_only=True)
    remaining_requests = serializers.SerializerMethodField()
    usage_percentage = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()

    class Meta:
        model = UserQuota
        fields = [
            'id', 'user_id', 'user__username', 'user__email', 'month_year',
            'max_requests', 'used_requests', 'remaining_requests',
            'usage_percentage', 'status', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_remaining_requests(self, obj):
        return obj.remaining_requests

    def get_usage_percentage(self, obj):
        return obj.usage_percentage

    def get_status(self, obj):
        return obj.status


class UserQuotaCreateSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()
    month_year = serializers.CharField(max_length=7)
    max_requests = serializers.IntegerField(min_value=1)

    def validate_month_year(self, value):
        import re
        if not re.match(r'^\d{4}-\d{2}$', value):
            raise serializers.ValidationError("Formato debe ser YYYY-MM")
        return value


class UserQuotaUpdateSerializer(serializers.Serializer):
    max_requests = serializers.IntegerField(min_value=1, required=False)
    used_requests = serializers.IntegerField(min_value=0, required=False)


class SystemConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemConfig
        fields = ['id', 'key', 'value', 'description', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']