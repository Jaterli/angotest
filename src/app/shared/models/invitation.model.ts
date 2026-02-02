// invitation.model.ts
export interface TestInvitation {
  id: number;
  test_id: number;
  invited_by: number;
  message?: string;
  token: string;
  is_used: boolean;
  is_guest: boolean;
  guest_user_id?: number;
  expires_at: string;
  created_at: string;
  test?: TestInfo;
  inviter?: UserInfo;
  guest_user?: UserInfo;
}

export interface CreateInvitationInput {
  test_id: number;
  message: string;
}

export interface CheckInvitationResponse {
  invitation: TestInvitation;
  test: TestInfo;
  inviter: UserInfo;
  result?: Result;
  result_status?: string;
  options: {
    can_start_authenticated?: boolean;
    can_start_as_guest?: boolean;
    can_resume_test?: boolean;
    can_view_results?: boolean;
    can_login_to_start?: boolean;
    can_login_to_resume?: boolean;
    can_login_to_view?: boolean;
    can_start_with_authenticated?: boolean;
    will_update_guest_user?: boolean;
  };
  message: string;
  is_authenticated: boolean;
  current_user_id?: number;
}

export interface AcceptInvitationResponse {
  test_id: number;
  invitation_id: number;
  user_id: number;
  is_guest: boolean;
  transferred_from_guest?: boolean;
  auto_authenticated?: boolean;
  message: string;
}

export interface GuestAcceptResponse {
  test_id: number;
  user: UserInfo;
  is_guest: boolean;
}

// Interfaces auxiliares
export interface TestInfo {
  id: number;
  title: string;
  description: string;
  main_topic: string;
  sub_topic: string;
  specific_topic: string;
  level: string;
}

export interface UserInfo {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  created_at: string;
}

export interface Result {
  id: number;
  user_id: number;
  test_id: number;
  correct_answers: number;
  wrong_answers: number;
  time_taken: number;
  status: string;
  started_at: string;
  updated_at: string;
}