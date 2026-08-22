# docs/views.py
from django.shortcuts import render

# Vistas de documentación de usuarios
def user_index(request):
    return render(request, 'user/user_index.html')

def user_guide(request):
    return render(request, 'user/user_guide.html')

# Vistas de documentación de administradores
def admin_index(request):
    return render(request, 'admin/admin_index.html')

def admin_guide(request):
    return render(request, 'admin/admin_guide.html')