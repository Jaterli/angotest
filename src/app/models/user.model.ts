// user.model.ts
export interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  address?: string;
  birth_date?: string; // o Date
  role: string;
  created_at: string; // o Date
}