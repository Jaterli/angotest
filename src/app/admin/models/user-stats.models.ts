export interface UserStats {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  address: string;
  country: string;
  birth_date: string;
  role: string;
  created_at: string;
  
  // Estadísticas
  tests_completed: number;
  tests_in_progress: number;
  tests_not_started: number;
  average_score: number;
  total_tests_taken: number;
}

// Interfaz para los filtros de usuarios
export interface UsersStatsFilters {
  page?: number;
  page_size?: number;
  current_page?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  role?: string;
  search?: string;
}


export interface UserStatsFullResponse {
  users: UserStats[];
  filters: UsersStatsFilters;
  stats: {
    total_users: number;
    total_filtered_users: number;
  };    
}