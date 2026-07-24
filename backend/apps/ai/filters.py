import django_filters # type: ignore
from .models import AIRequestLog

class AIRequestLogFilter(django_filters.FilterSet):
    status = django_filters.ChoiceFilter(choices=[
        ('pending', 'Pendiente'),
        ('completed', 'Completado'),
        ('failed', 'Fallido'),
    ])
    generation_mode = django_filters.ChoiceFilter(choices=[
        ('guided', 'Guiado'),
        ('prompt', 'Libre'),
    ])
    level = django_filters.CharFilter(field_name='level')
    created_after = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    created_before = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')

    class Meta:
        model = AIRequestLog
        fields = ['status', 'generation_mode', 'level']