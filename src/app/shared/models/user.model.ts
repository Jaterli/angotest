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
  login_at?: string; // o Date
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

// export interface AuthResponse {
//   token: string;
//   user: User;
// }

export interface UserUpdateData {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  address: string;
  country: string;
  birth_date: string;
}

export interface UpdateEmailPassword {
  current_password: string;
  new_email?: string;
  new_password?: string;
}
