export interface InvitationResponse {
  id: number;
  test_id: number;
  test_title: string;
  invited_by: number;
  inviter_name: string;
  message: string;
  token: string;
  is_used: boolean;
  is_guest: boolean;
  guest_user_id?: number;
  guest_name?: string;
  expires_at: string;
  created_at: string;
  status: 'active' | 'used' | 'expired';
  invitation_url: string;
}

export interface InvitationsFilter {
  page: number;
  page_size: number;
  ordering: string;
  order_dir?: 'asc' | 'desc';
  
  // Filtros
  search?: string;
  test_id?: number;
  invited_by?: number;
  is_used?: boolean;
  is_guest?: boolean;
  status?: string;
  
  // Fechas
  start_date?: string;
  end_date?: string;
}

export interface InvitationsResponse {
  data: InvitationResponse[];
  pagination: {
    page: number;
    page_size: number;
    total_filtered: number;
    total_pages: number;
    has_more: boolean;
  };
  stats: InvitationsStats;
}

export interface InvitationsStats {
  total_filtered: number;
  total_unfiltered: number;
}
