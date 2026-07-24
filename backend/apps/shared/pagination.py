from rest_framework.pagination import PageNumberPagination # type: ignore
from rest_framework.response import Response # type: ignore

class CustomPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

    def get_paginated_response(self, data):
        return Response({
            'data': data,
            'pagination': {
                'total_filtered': self.page.paginator.count,
                'total_pages': self.page.paginator.num_pages,
                'current_page': self.page.number,
                'page_size': self.page.paginator.per_page,
                'has_more': self.page.has_next(),
            },
            'stats': {
                'total_filtered': self.page.paginator.count,
                'total_unfiltered': {},
                'total_by_level': {},
            },
            'available_filters': {
                'main_topics': [],
            }
        })