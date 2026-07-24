from rest_framework import serializers
from .models import UserQuota, SystemConfig
from apps.accounts.models import User

# Serializers existentes
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


# ------------------------------------------------------------------
# Serializers para respuestas personalizadas (documentación OpenAPI)
# ------------------------------------------------------------------

class UserQuotaCreateResponseSerializer(serializers.Serializer):
    quota = UserQuotaSerializer()
    message = serializers.CharField()


class UserQuotaUpdateResponseSerializer(serializers.Serializer):
    quota = UserQuotaSerializer()
    message = serializers.CharField()


class UserQuotaDeleteResponseSerializer(serializers.Serializer):
    message = serializers.CharField()
    deleted = serializers.DictField()


class BulkDeleteResponseSerializer(serializers.Serializer):
    message = serializers.CharField()
    deleted_count = serializers.IntegerField()
    deleted_ids = serializers.ListField(child=serializers.IntegerField())


class QuotaStatsResponseSerializer(serializers.Serializer):
    stats = serializers.DictField()
    current_month = serializers.DictField()
    monthly_stats = serializers.ListField(child=serializers.DictField())
    top_users = serializers.ListField(child=serializers.DictField())
    timestamp = serializers.CharField()


class QuotaByUserResponseSerializer(serializers.Serializer):
    quota = UserQuotaSerializer(allow_null=True)


class SystemConfigByKeyResponseSerializer(serializers.Serializer):
    value = serializers.IntegerField(required=False)
    error = serializers.CharField(required=False)


class DefaultSystemConfigItemSerializer(serializers.Serializer):
    key = serializers.CharField()
    value = serializers.CharField()
    exists_in_db = serializers.BooleanField()


class DefaultSystemConfigsResponseSerializer(serializers.Serializer):
    configs = DefaultSystemConfigItemSerializer(many=True)


class DashboardTotalsSerializer(serializers.Serializer):
    total_users = serializers.IntegerField()
    active_users = serializers.IntegerField()
    completed_tests = serializers.IntegerField()
    in_progress_tests = serializers.IntegerField()
    expired_tests = serializers.IntegerField()
    total_tests = serializers.IntegerField()
    inactive_tests = serializers.IntegerField()
    advanced_tests = serializers.IntegerField()
    intermediate_tests = serializers.IntegerField()
    beginner_tests = serializers.IntegerField()


class TopTestItemSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    title = serializers.CharField()
    count = serializers.IntegerField(required=False)
    attempt_count = serializers.IntegerField(required=False)
    date = serializers.CharField(required=False)


class AccuracyTimeItemSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    title = serializers.CharField()
    total_attempts = serializers.IntegerField()
    accuracy_rate = serializers.FloatField(required=False)
    avg_time = serializers.FloatField(required=False)


class TopTestsListsSerializer(serializers.Serializer):
    most_completed = TopTestItemSerializer(many=True)
    most_incomplete = TopTestItemSerializer(many=True)
    most_expired = TopTestItemSerializer(many=True)
    least_started_oldest = TopTestItemSerializer(many=True)
    highest_accuracy = AccuracyTimeItemSerializer(many=True)
    lowest_accuracy = AccuracyTimeItemSerializer(many=True)
    highest_avg_time = AccuracyTimeItemSerializer(many=True)
    lowest_avg_time = AccuracyTimeItemSerializer(many=True)


class UserListItemSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    username = serializers.CharField()
    role = serializers.CharField()
    count = serializers.IntegerField(required=False)
    date = serializers.CharField(required=False)


class UserListsSerializer(serializers.Serializer):
    new_users_by_month = UserListItemSerializer(many=True)
    most_active_users = UserListItemSerializer(many=True)
    least_active_oldest = UserListItemSerializer(many=True)
    recent_login = UserListItemSerializer(many=True)
    oldest_login = UserListItemSerializer(many=True)


class DashboardResponseSerializer(serializers.Serializer):
    totals = DashboardTotalsSerializer()
    top_tests = TopTestsListsSerializer()
    user_lists = UserListsSerializer()


class DailyResultItemSerializer(serializers.Serializer):
    date = serializers.CharField()
    total = serializers.IntegerField()
    completed = serializers.IntegerField()
    in_progress = serializers.IntegerField()
    expired = serializers.IntegerField()


class DailyCountItemSerializer(serializers.Serializer):
    date = serializers.CharField()
    count = serializers.IntegerField()


class ActivitySummaryResponseSerializer(serializers.Serializer):
    daily_results = DailyResultItemSerializer(many=True)
    daily_users = DailyCountItemSerializer(many=True)
    daily_tests = DailyCountItemSerializer(many=True)
    start_date = serializers.CharField()
    end_date = serializers.CharField()


class PerformanceMetricsResponseSerializer(serializers.Serializer):
    completion_rate = serializers.FloatField()
    overall_accuracy = serializers.FloatField()
    average_time_minutes = serializers.FloatField()
    level_distribution = serializers.ListField(child=serializers.DictField())
    role_distribution = serializers.ListField(child=serializers.DictField())


class TestDetailedStatsResponseSerializer(serializers.Serializer):
    test_title = serializers.CharField()
    test_level = serializers.CharField()
    topic_hierarchy = serializers.DictField()
    total_attempts = serializers.IntegerField()
    completed_attempts = serializers.IntegerField()
    in_progress_attempts = serializers.IntegerField()
    expired_attempts = serializers.IntegerField()
    avg_accuracy = serializers.FloatField()
    avg_time = serializers.FloatField()
    completion_rate = serializers.FloatField()


class UserInfoSerializer(serializers.Serializer):
    username = serializers.CharField()
    email = serializers.CharField()
    registered_at = serializers.CharField(allow_null=True)
    last_login = serializers.CharField(allow_null=True)
    role = serializers.CharField()


class TestStatsSerializer(serializers.Serializer):
    total_tests = serializers.IntegerField()
    completed_tests = serializers.IntegerField()
    in_progress_tests = serializers.IntegerField()
    expired_tests = serializers.IntegerField()
    avg_accuracy = serializers.FloatField()
    avg_time_per_test = serializers.FloatField()
    favorite_topic = serializers.CharField()
    favorite_level = serializers.CharField()


class RecentActivityItemSerializer(serializers.Serializer):
    test_title = serializers.CharField()
    status = serializers.CharField()
    accuracy = serializers.FloatField()
    time_taken = serializers.IntegerField()
    started_at = serializers.CharField()


class UserDetailedStatsResponseSerializer(serializers.Serializer):
    user_info = UserInfoSerializer()
    test_stats = TestStatsSerializer()
    recent_activity = RecentActivityItemSerializer(many=True)