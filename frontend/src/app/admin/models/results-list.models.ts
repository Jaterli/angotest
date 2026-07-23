// ====== Modelos para Administración de Resultados ======

export interface AdminResult {
  id: number;
  user_id: number;
  test_id: number;
  correct_answers: number;
  wrong_answers: number;
  total_questions: number;
  score: number;
  time_taken: number;
  status: 'in_progress' | 'completed' | 'expired';
  answers?: string;
  started_at: string;
  updated_at: string;
  
  // Datos del usuario
  user__username: string;
  user__email: string;
  user__first_name?: string;
  user__last_name?: string;
  user__role: string;
  
  // Datos del test
  test__title: string;
  test__description?: string;
  test__main_topic: string;
  test__sub_topic: string;
  test__specific_topic: string;
  test__level: string;
  test__created_by: number;
  test__created_at: string;
  test__is_active: boolean;
}

export interface AdminResultsFilter {
  // Filtros por usuario
  user__role?: string;

  // Filtros por test
  test__main_topic?: string;
  test__sub_topic?: string;
  test__level?: string;
  test__created_by?: number;
  test__is_active?: boolean;

  // Filtros por resultado
  status?: string;
  started_at?: string;
  updated_at?: string;
  min_score?: number;
  max_score?: number;

  page: number;
  page_size: number;
  search?: string;
  ordering: string;
  order_dir?: 'asc' | 'desc';
}


export interface AdminResultsResponse {
  data: AdminResult[];
  stats: ResultsStats;
  pagination: ResultsPagination;
  available_filters: ResultsAvailableFilters
}

export interface ResultsStats {
  average_score: number;
  total_filtered: number;
  total_unfiltered: number;
  total_time_spent: number;
}

export interface ResultsAvailableFilters {
    main_topics: string[]; 
    levels?: string[];
    statuses?: string[];
    roles: string[];
}

interface ResultsPagination {
  total_filtered: number;
  total_unfiltered: number;
  total_pages: number;
  current_page: number;
  page_size: number;
  has_more: boolean;
}