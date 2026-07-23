import django_filters # type: ignore
from django.db.models import Q, F, ExpressionWrapper, IntegerField
from .models import UserQuota

class UserQuotaFilter(django_filters.FilterSet):
    search = django_filters.CharFilter(method='filter_search')
    user_id = django_filters.NumberFilter(field_name='user_id')
    month_year = django_filters.CharFilter(field_name='month_year')
    min_usage = django_filters.NumberFilter(method='filter_min_usage')
    min_requests = django_filters.NumberFilter(field_name='max_requests', lookup_expr='gte')
    max_requests = django_filters.NumberFilter(field_name='max_requests', lookup_expr='lte')
    start_date = django_filters.DateFilter(field_name='created_at', lookup_expr='gte')
    end_date = django_filters.DateFilter(field_name='created_at', lookup_expr='lte')

    class Meta:
        model = UserQuota
        fields = ['user_id', 'month_year', 'min_requests', 'max_requests', 'start_date', 'end_date']

    def filter_search(self, queryset, name, value):
        return queryset.filter(
            Q(user__username__icontains=value) |
            Q(user__email__icontains=value) |
            Q(user__id__icontains=value)
        )

    def filter_min_usage(self, queryset, name, value):
        # usage % = used_requests / max_requests * 100
        return queryset.filter(max_requests__gt=0).annotate(
            usage_pct=ExpressionWrapper(
                F('used_requests') * 100 / F('max_requests'),
                output_field=IntegerField()
            )
        ).filter(usage_pct__gte=value)
    


class SystemConfigFilter(django_filters.FilterSet):
    search = django_filters.CharFilter(method='filter_search')

    def filter_search(self, queryset, name, value):
        return queryset.filter(
            Q(key__icontains=value) |
            Q(value__icontains=value) |
            Q(description__icontains=value)
        )    