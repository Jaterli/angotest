export interface UserQuota {
  id: number;
  user_id: number;
  user__username?: string;
  user__email?: string;
  month_year: string;
  max_requests: number;
  used_requests: number;
  created_at: string;
  updated_at: string;
}

export interface QuotaFilter {
  page: number;
  page_size: number;
  ordering?: string;
  order_dir: 'asc' | 'desc';
  
  // Filtros
  search?: string;
  user_id?: number;
  month_year: string;
  min_usage: string;
  min_requests?: number;
  max_requests?: number;
  
  // Filtros de fecha
  start_date?: string;
  end_date?: string;
  
  // Estado de cuota
  quota_status?: 'normal' | 'warning' | 'critical' | 'exceeded';
}

export interface QuotaResponse {
  data: UserQuota[];
  pagination: {
    total_filtered: number;
    total_pages: number;
    page: number;
    page_size: number;
    has_more: boolean;
  };
}

export interface CreateQuotaInput {
  user_id: number;
  month_year: string;
  max_requests: number;
}

export interface UpdateQuotaInput {
  max_requests?: number;
  used_requests?: number;
}

export interface QuotaSummary {
  user_id: number;
  username: string;
  email: string;
  current_month_quota: UserQuota | null;
  average_monthly_usage: number;
  total_requests_year: number;
  months_with_quota: number;
}