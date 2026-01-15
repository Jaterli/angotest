// ====== Modelos para Administración de Resultados ======

export interface AdminResultResponse {
  id: number;
  user_id: number;
  test_id: number;
  correct_answers: number;
  wrong_answers: number;
  total_questions: number;
  score: number;
  time_taken: number;
  status: 'in_progress' | 'completed' | 'abandoned';
  answers?: string;
  started_at: string;
  updated_at: string;
  
  // Datos del usuario
  user_username: string;
  user_email: string;
  user_first_name?: string;
  user_last_name?: string;
  user_role: string;
  
  // Datos del test
  test_title: string;
  test_description?: string;
  test_main_topic: string;
  test_sub_topic: string;
  test_specific_topic: string;
  test_level: string;
  test_created_by: number;
  test_created_at: string;
  test_is_active: boolean;
}

export interface AdminResultsFilter {
  page?: number;
  page_size?: number;
  
  // Filtros por usuario
  user_id?: number;
  user_role?: string;
  user_email?: string;
  user_username?: string;
  
  // Filtros por test
  test_id?: number;
  test_title?: string;
  test_main_topic?: string;
  test_sub_topic?: string;
  test_level?: string;
  test_created_by?: number;
  test_is_active?: boolean;
  
  // Filtros por resultado
  status?: string;
  min_score?: number;
  max_score?: number;
  
  // Fechas
  start_date?: string;
  end_date?: string;
  
  // Ordenamiento
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  
  // Búsqueda
  search?: string;
}

export interface AdminResultsResponse {
  results: AdminResultResponse[];
  current_page: number;
  page_size: number;
  available_filters?: {
    main_topics: string[];
    levels: string[];
    statuses: string[];
    roles: string[];
  };
}

export interface AdminResultsFullResponse {
  success: boolean;
  data: AdminResultsResponse;
  filters_applied: any;
  stats: {
    total_results: number;
    total_results_with_filters: number;
  };
}


export interface AdminResultsStats {
  total_results: number;
  average_score?: number;
  total_time_spent?: number;
  completion_rate?: number;
}