export interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  address?: string;
  country?: string;
  birth_date?: string; // o Date
  role: string;
  created_at: string; // o Date
}

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

export interface UsersStatsResponse {
  users: UserStats[];
  total_users: number;
  total_pages: number;
  current_page: number;
  page_size: number;
  has_more: boolean;
  filters?: {
    role?: string;
    search?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
  };
}

// Interfaz para los filtros de usuarios
export interface UsersStatsFilters {
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  role?: string;
  search?: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  address?: string;
  country: string;
  birth_date: string; // o Date
  role?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface UserUpdateData {
  first_name: string;
  last_name: string;
  phone: string;
  address: string;
  country: string;
  birth_date: string;
}

export interface ChangePasswordData {
  current_password: string;
  new_password: string;
}
