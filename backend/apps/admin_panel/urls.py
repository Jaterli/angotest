# apps/admin_panel/urls.py
from django.urls import path
from .views import (
    AdminUserQuotaListView,
    AdminUserQuotaDetailView,
    AdminUserQuotaByUserView,
    AdminUserQuotaMonthsView,
    AdminCreateUserQuotaView,
    AdminUpdateUserQuotaView,
    AdminDeleteUserQuotaView,
    AdminDeleteQuotasBulkView,
    AdminQuotaStatsView,
    AdminExportQuotasCSVView,
    AdminSystemConfigListView,
    AdminSystemConfigByKeyView,
    AdminDefaultSystemConfigsView,
    AdminCreateSystemConfigView,
    AdminUpdateSystemConfigView,
    AdminDeleteSystemConfigView,
    AdminDashboardView,
    AdminDashboardActivitySummaryView,
    AdminDashboardPerformanceMetricsView,
    AdminTestDetailedStatsView,
    AdminUserDetailedStatsView,
)

urlpatterns = [
    # Endpoints de Cuotas de Usuario
    path('quotas/', AdminUserQuotaListView.as_view(), name='admin_get_user_quotas'),
    path('quotas/stats/', AdminQuotaStatsView.as_view(), name='admin_quota_stats'),
    path('quotas/create/', AdminCreateUserQuotaView.as_view(), name='admin_create_quota'),
    path('quotas/bulk-delete/', AdminDeleteQuotasBulkView.as_view(), name='admin_delete_quotas_bulk'),
    path('quotas/export/csv/', AdminExportQuotasCSVView.as_view(), name='admin_export_quotas_csv'),
    path('quotas/<int:quota_id>/update/', AdminUpdateUserQuotaView.as_view(), name='admin_update_quota'),
    path('quotas/<int:quota_id>/delete/', AdminDeleteUserQuotaView.as_view(), name='admin_delete_quota'),
    path('quotas/<int:quota_id>/', AdminUserQuotaDetailView.as_view(), name='admin_get_quota_detail'),  # opcional
    path('users/<int:user_id>/quotas/', AdminUserQuotaByUserView.as_view(), name='admin_get_user_quota'),
    path('users/<int:user_id>/quota-months/', AdminUserQuotaMonthsView.as_view(), name='admin_user_quota_months'),

    # Endpoints de Configuración del Sistema
    path('system-configs/', AdminSystemConfigListView.as_view(), name='admin_get_system_configs'),
    path('system-configs/default/', AdminDefaultSystemConfigsView.as_view(), name='admin_get_default_system_configs'),
    path('system-configs/create/', AdminCreateSystemConfigView.as_view(), name='admin_create_system_config'),
    path('system-configs/key/<str:key>/', AdminSystemConfigByKeyView.as_view(), name='admin_get_system_config_by_key'),
    path('system-configs/<int:config_id>/update/', AdminUpdateSystemConfigView.as_view(), name='admin_update_system_config'),
    path('system-configs/<int:config_id>/delete/', AdminDeleteSystemConfigView.as_view(), name='admin_delete_system_config'),

    # Endpoints del Dashboard
    path('dashboard/', AdminDashboardView.as_view(), name='admin_dashboard'),
    path('dashboard/activity-summary/', AdminDashboardActivitySummaryView.as_view(), name='dashboard_activity_summary'),
    path('dashboard/performance-metrics/', AdminDashboardPerformanceMetricsView.as_view(), name='dashboard_performance_metrics'),
    path('dashboard/tests/<int:test_id>/stats/', AdminTestDetailedStatsView.as_view(), name='test_detailed_stats'),
    path('dashboard/users/<int:user_id>/stats/', AdminUserDetailedStatsView.as_view(), name='user_detailed_stats'),
]