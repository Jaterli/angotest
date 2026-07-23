import django_filters # type: ignore
from django.db.models import Q
from .models import Result

class ResultsListFilter(django_filters.FilterSet):
    user_id = django_filters.NumberFilter(field_name='user_id')
    user_role = django_filters.CharFilter(field_name='user__role')
    user_email = django_filters.CharFilter(field_name='user__email', lookup_expr='icontains')
    user_username = django_filters.CharFilter(field_name='user__username', lookup_expr='icontains')

    test_id = django_filters.NumberFilter(field_name='test_id')
    test_title = django_filters.CharFilter(field_name='test__title', lookup_expr='icontains')
    test_main_topic = django_filters.CharFilter(field_name='test__main_topic')
    test_sub_topic = django_filters.CharFilter(field_name='test__sub_topic')
    test_specific_topic = django_filters.CharFilter(field_name='test__specific_topic')
    test_level = django_filters.CharFilter(field_name='test__level')
    test_created_by = django_filters.NumberFilter(field_name='test__created_by')

    status = django_filters.CharFilter(field_name='status')
    min_score = django_filters.NumberFilter(method='filter_min_score')
    max_score = django_filters.NumberFilter(method='filter_max_score')

    started_at = django_filters.DateFilter(field_name='started_at', lookup_expr='gte')
    updated_at = django_filters.DateFilter(field_name='started_at', lookup_expr='lte')

    search = django_filters.CharFilter(method='filter_search')

    class Meta:
        model = Result
        fields = [
            'user_id', 'user_role', 'user_email', 'user_username',
            'test_id', 'test_title', 'test_main_topic', 'test_sub_topic',
            'test_specific_topic', 'test_level', 'test_created_by',
            'status', 'started_at', 'updated_at', 'search'
        ]

    def filter_search(self, queryset, name, value):
        return queryset.filter(
            Q(user__username__icontains=value) |
            Q(user__first_name__icontains=value) |
            Q(user__last_name__icontains=value) |
            Q(user__email__icontains=value) |
            Q(test__title__icontains=value) |
            Q(test__main_topic__icontains=value) |
            Q(test__sub_topic__icontains=value)
        )

    def filter_min_score(self, queryset, name, value):
        # Anotamos score y filtramos
        from django.db.models import Case, When, Value, FloatField, F
        from django.db.models.functions import Coalesce, Round
        return queryset.annotate(
            score=Case(
                When(
                    status='completed',
                    then=Coalesce(
                        Round(F('correct_answers') * 100.0 / (F('correct_answers') + F('wrong_answers')), 2),
                        Value(0.0)
                    )
                ),
                default=Value(0.0),
                output_field=FloatField()
            )
        ).filter(score__gte=value)

    def filter_max_score(self, queryset, name, value):
        from django.db.models import Case, When, Value, FloatField, F
        from django.db.models.functions import Coalesce, Round
        return queryset.annotate(
            score=Case(
                When(
                    status='completed',
                    then=Coalesce(
                        Round(F('correct_answers') * 100.0 / (F('correct_answers') + F('wrong_answers')), 2),
                        Value(0.0)
                    )
                ),
                default=Value(0.0),
                output_field=FloatField()
            )
        ).filter(score__lte=value)


class UserResultsFilter(django_filters.FilterSet):
    level = django_filters.CharFilter(field_name='test__level')
    main_topic = django_filters.CharFilter(field_name='test__main_topic')
    sub_topic = django_filters.CharFilter(field_name='test__sub_topic')
    from_date = django_filters.DateFilter(field_name='started_at', lookup_expr='gte')
    to_date = django_filters.DateFilter(field_name='started_at', lookup_expr='lte')

    status = django_filters.CharFilter(field_name='status')
    min_score = django_filters.NumberFilter(method='filter_min_score')
    max_score = django_filters.NumberFilter(method='filter_max_score')

    started_at = django_filters.DateFilter(field_name='started_at', lookup_expr='gte')
    updated_at = django_filters.DateFilter(field_name='started_at', lookup_expr='lte')

    search = django_filters.CharFilter(method='filter_search')

    class Meta:
        model = Result
        fields = ['status', 'level', 'main_topic', 'sub_topic', 'from_date', 'to_date']

    def filter_search(self, queryset, name, value):
        return queryset.filter(
            Q(test__title__icontains=value) |
            Q(test__description__icontains=value)
        )

    def filter_min_score(self, queryset, name, value):
        # Anotamos score y filtramos
        from django.db.models import Case, When, Value, FloatField, F
        from django.db.models.functions import Coalesce, Round
        return queryset.annotate(
            score=Case(
                When(
                    status='completed',
                    then=Coalesce(
                        Round(F('correct_answers') * 100.0 / (F('correct_answers') + F('wrong_answers')), 2),
                        Value(0.0)
                    )
                ),
                default=Value(0.0),
                output_field=FloatField()
            )
        ).filter(score__gte=value)

    def filter_max_score(self, queryset, name, value):
        from django.db.models import Case, When, Value, FloatField, F
        from django.db.models.functions import Coalesce, Round
        return queryset.annotate(
            score=Case(
                When(
                    status='completed',
                    then=Coalesce(
                        Round(F('correct_answers') * 100.0 / (F('correct_answers') + F('wrong_answers')), 2),
                        Value(0.0)
                    )
                ),
                default=Value(0.0),
                output_field=FloatField()
            )
        ).filter(score__lte=value)
