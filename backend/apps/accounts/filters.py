import django_filters
from django.db.models import Q, Count, Value, FloatField, F, Case, When
from django.db.models.functions import Coalesce, Cast
from .models import User
from apps.results.models import Result

class UserFilter(django_filters.FilterSet):
    role = django_filters.ChoiceFilter(choices=User.ROLE_CHOICES, field_name='role')
    search = django_filters.CharFilter(method='filter_search')
    registered_after = django_filters.DateFilter(field_name='registered_at', lookup_expr='gte')
    registered_before = django_filters.DateFilter(field_name='registered_at', lookup_expr='lte')
    min_tests_completed = django_filters.NumberFilter(method='filter_min_tests')
    is_active = django_filters.BooleanFilter(field_name='is_active')

    class Meta:
        model = User
        fields = ['role', 'is_active', 'search', 'registered_after', 'registered_before']

    def filter_search(self, queryset, name, value):
        return queryset.filter(
            Q(username__icontains=value) |
            Q(email__icontains=value) |
            Q(first_name__icontains=value) |
            Q(last_name__icontains=value)
        )

    def filter_min_tests(self, queryset, name, value):
        # Anotar tests completados y filtrar
        return queryset.annotate(
            completed_tests=Count('results', filter=Q(results__status='completed'))
        ).filter(completed_tests__gte=value)