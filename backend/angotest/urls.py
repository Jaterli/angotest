# angotest/urls.py
from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [

    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),

    path('django-admin/', admin.site.urls),   
    path('api/admin/', include('apps.admin_panel.urls')),   
    path('api/auth/', include('apps.accounts.urls')),
    path('api/user/', include('apps.accounts.user_urls')),
    path('api/test/', include('apps.test.urls')),
    path('api/results/', include('apps.results.urls')),
    path('api/invitations/', include('apps.invitations.urls')),
    path('api/ai-requests/', include('apps.ai.urls')),
    path('api/shared/', include('apps.shared.urls')),

]