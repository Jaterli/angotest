# results/urls.py
from django.urls import path
from .views import (
    IncorrectAnswersView,
    ResultsListView,
    ResultsUserView,
    ResultUserDetailView,
    ResultDetailView,
    DeleteResultView,
    DeleteResultsBulkView,
    ResultStatsView,
    ExportResultsCSVView,
)
#from . import _views

urlpatterns = [


    # Usuarios (públicos)
    path('<int:result_id>/incorrect-answers/', IncorrectAnswersView.as_view(), name='incorrect_answers'),

    # Administración
    path('', ResultsListView.as_view(), name='get_results_list'),
    path('user/<int:user_id>/', ResultsUserView.as_view(), name='admin_user_results'),
    path('<int:result_id>/user/<int:user_id>/', ResultUserDetailView.as_view(), name='admin_user_result_details'),
    path('<int:result_id>/delete/', DeleteResultView.as_view(), name='delete_result'),
    path('bulk-delete/', DeleteResultsBulkView.as_view(), name='delete_results_bulk'),
    path('stats/', ResultStatsView.as_view(), name='get_result_stats'),
    path('<int:result_id>/', ResultDetailView.as_view(), name='get_result_detail'),
    path('export-csv/', ExportResultsCSVView.as_view(), name='export_results_csv'),


    # # Usuarios o compartido
    # path('<int:result_id>/incorrect-answers/', _views.get_incorrect_answers, name='incorrect_answers'),

    # # # Admin
    # path('', _views.get_results_list, name='get_results_list'),
    # path('user/<int:user_id>/', _views.get_user_results, name='admin_user_results'),
    # path('<int:result_id>/user/<int:user_id>/', _views.get_user_result_details, name='admin_user_result_details'),
    # path('<int:result_id>/delete/', _views.delete_result, name='delete_result'),
    # path('bulk-delete/', _views.delete_results_bulk, name='delete_results_bulk'),
    # path('stats/', _views.get_result_stats, name='get_result_stats'),
    # path('<int:result_id>/', _views.get_result_detail, name='get_result_detail'),
    # path('export-csv/', _views.export_results_csv, name='export_results_csv'),
]