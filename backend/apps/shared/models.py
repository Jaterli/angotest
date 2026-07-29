# shared/models.py
from django.db import models
from django.core.cache import cache
from django.db.models import Count
import logging

CACHE_KEY_PREFIXES = {
    'topics_hierarchy': 'topics_hierarchy_',
    'main_topics': 'main_topics_',
    'sub_topics': 'sub_topics_',
    'specific_topics': 'specific_topics_',
    'topic_hierarchy_full': 'topic_hierarchy_full',
    'topic_statistics': 'topic_statistics'
}


logger = logging.getLogger(__name__)

class Topic(models.Model):
    """Modelo para almacenar la jerarquía de temas"""
    main_topic = models.CharField(max_length=200, db_index=True)
    sub_topic = models.CharField(max_length=200, db_index=True)
    specific_topic = models.CharField(max_length=200, db_index=True)
    is_predefined = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'topics'
        unique_together = ['main_topic', 'sub_topic', 'specific_topic']
        indexes = [
            models.Index(fields=['main_topic']),
            models.Index(fields=['main_topic', 'sub_topic']),
            models.Index(fields=['main_topic', 'sub_topic', 'specific_topic']),
        ]
    
    def __str__(self):
        return f"{self.main_topic} > {self.sub_topic} > {self.specific_topic}"


# Funciones auxiliares para el manejo de caché
def get_topics_cache_key(include_predefined=True):
    return f"topics_hierarchy_{include_predefined}"


def get_main_topics_cache_key():
    return "main_topics_list"


def invalidate_topics_cache():
    """Invalida todas las cachés relacionadas con temas"""
    # Para LocMemCache, eliminamos claves específicas que conocemos
    known_keys = [
        "topics_hierarchy_True",
        "topics_hierarchy_False",
        "main_topics_list", 
        "topic_hierarchy_full",
        "topic_statistics"
    ]
    
    for key in known_keys:
        cache.delete(key)
    
    logger.info("Topics cache invalidated")


def get_topics(include_predefined=True, force_refresh=False):
    """Obtiene la jerarquía completa de temas en formato anidado"""
    cache_key = get_topics_cache_key(include_predefined)
    
    if not force_refresh:
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data
    
    # Construir jerarquía en formato anidado
    queryset = Topic.objects.all()
    if not include_predefined:
        queryset = queryset.filter(is_predefined=False)
    
    # Estructura anidada: {main_topic: {sub_topic: [specific_topics]}}
    hierarchy = {}
    for topic in queryset:
        if topic.main_topic not in hierarchy:
            hierarchy[topic.main_topic] = {}
        if topic.sub_topic not in hierarchy[topic.main_topic]:
            hierarchy[topic.main_topic][topic.sub_topic] = []
        if topic.specific_topic not in hierarchy[topic.main_topic][topic.sub_topic]:
            hierarchy[topic.main_topic][topic.sub_topic].append(topic.specific_topic)
    
    # Ordenar para consistencia
    ordered_hierarchy = {}
    for main_topic in sorted(hierarchy.keys()):
        ordered_hierarchy[main_topic] = {}
        for sub_topic in sorted(hierarchy[main_topic].keys()):
            ordered_hierarchy[main_topic][sub_topic] = sorted(hierarchy[main_topic][sub_topic])
    
    # Cache por 1 hora
    cache.set(cache_key, ordered_hierarchy, 3600)
    return ordered_hierarchy


def get_main_topics():
    """Obtiene solo los temas principales"""
    cache_key = get_main_topics_cache_key()
    cached_data = cache.get(cache_key)
    if cached_data is not None:
        return cached_data
    
    main_topics = Topic.objects.values_list('main_topic', flat=True).distinct().order_by('main_topic')
    result = list(main_topics)
    
    cache.set(cache_key, result, 3600)
    return result

def get_sub_topics(main_topic):
    """Obtiene subtemas de un tema principal"""
    cache_key = f"sub_topics_{main_topic}"
    cached_data = cache.get(cache_key)
    if cached_data is not None:
        return cached_data
    
    sub_topics = Topic.objects.filter(main_topic=main_topic)\
        .values_list('sub_topic', flat=True)\
        .distinct()\
        .order_by('sub_topic')
    result = list(sub_topics)
    
    cache.set(cache_key, result, 3600)
    return result

def get_specific_topics(main_topic, sub_topic):
    """Obtiene temas específicos"""
    cache_key = f"specific_topics_{main_topic}_{sub_topic}"
    cached_data = cache.get(cache_key)
    if cached_data is not None:
        return cached_data
    
    specific_topics = Topic.objects.filter(
        main_topic=main_topic,
        sub_topic=sub_topic
    ).values_list('specific_topic', flat=True).order_by('specific_topic')
    result = list(specific_topics)
    
    cache.set(cache_key, result, 3600)
    return result

def get_topic_hierarchy():
    """Obtiene la estructura jerárquica completa"""
    cache_key = "topic_hierarchy_full"
    cached_data = cache.get(cache_key)
    if cached_data is not None:
        return cached_data
    
    hierarchy = []
    main_topics = get_main_topics()
    
    for main_topic in main_topics:
        main_topic_dict = {
            'main_topic': main_topic,
            'sub_topics': []
        }
        sub_topics = get_sub_topics(main_topic)
        
        for sub_topic in sub_topics:
            sub_topic_dict = {
                'sub_topic': sub_topic,
                'specific_topics': get_specific_topics(main_topic, sub_topic)
            }
            main_topic_dict['sub_topics'].append(sub_topic_dict)
        
        hierarchy.append(main_topic_dict)
    
    cache.set(cache_key, hierarchy, 3600)
    return hierarchy

def insert_or_update_topic(main_topic, sub_topic, specific_topic, is_predefined=False):
    """Inserta o actualiza un tema"""
    obj, created = Topic.objects.update_or_create(
        main_topic=main_topic,
        sub_topic=sub_topic,
        specific_topic=specific_topic,
        defaults={'is_predefined': is_predefined}
    )
    # Invalidar caché al modificar temas
    invalidate_topics_cache()
    return obj, created

def delete_orphaned_topics():
    """Elimina temas que no están siendo usados por ningún test"""
    from apps.test.models import Test  # Importación diferida para evitar circular import
    
    # Obtener todos los temas únicos usados en tests
    used_topics = Test.objects.values_list(
        'main_topic', 'sub_topic', 'specific_topic'
    ).distinct()
    
    used_topic_set = set()
    for main, sub, specific in used_topics:
        used_topic_set.add((main, sub, specific))
    
    # Eliminar temas que no están en uso y no son predefinidos
    all_topics = Topic.objects.filter(is_predefined=False)
    deleted_count = 0
    
    for topic in all_topics:
        key = (topic.main_topic, topic.sub_topic, topic.specific_topic)
        if key not in used_topic_set:
            topic.delete()
            deleted_count += 1
    
    if deleted_count > 0:
        invalidate_topics_cache()
    
    return deleted_count

def validate_and_suggest_topics(main_topic, sub_topic, specific_topic):
    """Valida una combinación de temas y sugiere alternativas"""
    # Verificar si la combinación exacta existe
    exists = Topic.objects.filter(
        main_topic=main_topic,
        sub_topic=sub_topic,
        specific_topic=specific_topic
    ).exists()
    
    if exists:
        return True, []
    
    # Generar sugerencias
    suggestions = {
        'main_topics': [],
        'sub_topics': [],
        'specific_topics': []
    }
    
    # Sugerencias para tema principal (si no existe)
    if not Topic.objects.filter(main_topic=main_topic).exists():
        similar_main = Topic.objects.filter(
            main_topic__icontains=main_topic
        ).values_list('main_topic', flat=True).distinct()[:5]
        suggestions['main_topics'] = list(similar_main)
    
    # Sugerencias para subtema (si el tema principal existe pero el subtema no)
    if Topic.objects.filter(main_topic=main_topic).exists() and not Topic.objects.filter(main_topic=main_topic, sub_topic=sub_topic).exists():
        similar_sub = Topic.objects.filter(
            main_topic=main_topic,
            sub_topic__icontains=sub_topic
        ).values_list('sub_topic', flat=True).distinct()[:5]
        suggestions['sub_topics'] = list(similar_sub)
    
    # Sugerencias para tema específico
    if Topic.objects.filter(main_topic=main_topic, sub_topic=sub_topic).exists() and not Topic.objects.filter(
        main_topic=main_topic, sub_topic=sub_topic, specific_topic=specific_topic
    ).exists():
        similar_specific = Topic.objects.filter(
            main_topic=main_topic,
            sub_topic=sub_topic,
            specific_topic__icontains=specific_topic
        ).values_list('specific_topic', flat=True).distinct()[:5]
        suggestions['specific_topics'] = list(similar_specific)
    
    return False, suggestions

def get_topic_statistics():
    """Obtiene estadísticas de temas"""
    cache_key = "topic_statistics"
    cached_data = cache.get(cache_key)
    if cached_data is not None:
        return cached_data
    
    stats = {
        'total_topics': Topic.objects.count(),
        'total_main_topics': Topic.objects.values('main_topic').distinct().count(),
        'total_sub_topics': Topic.objects.values('main_topic', 'sub_topic').distinct().count(),
        'predefined_topics': Topic.objects.filter(is_predefined=True).count(),
        'user_created_topics': Topic.objects.filter(is_predefined=False).count(),
        'most_used_topics': [],
        'topics_by_main': {}
    }
    
    # Temas más usados en tests (requiere importación diferida)
    from apps.test.models import Test
    
    most_used = Test.objects.values('main_topic', 'sub_topic', 'specific_topic')\
        .annotate(count=Count('id'))\
        .order_by('-count')[:10]
    
    stats['most_used_topics'] = list(most_used)
    
    # Distribución por tema principal
    main_topics_dist = Test.objects.values('main_topic')\
        .annotate(count=Count('id'))\
        .order_by('-count')
    
    stats['topics_by_main'] = list(main_topics_dist)
    
    cache.set(cache_key, stats, 3600)
    return stats

