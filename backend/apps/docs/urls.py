# docs/urls.py
from django.urls import path
from . import views

app_name = 'docs'  # Importante para usar 'docs:nombre_vista'

urlpatterns = [
    path('', views.user_index, name='user_index'),
    path('guide/', views.user_guide, name='user_guide'),
    # Rutas para administración
    path('admin/', views.admin_index, name='admin_index'),
    path('admin/guide/', views.admin_guide, name='admin_guide'),
]