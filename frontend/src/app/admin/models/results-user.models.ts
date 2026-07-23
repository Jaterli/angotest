// ========================================
// Request Types
// ========================================

import { User } from "../../shared/models/user.models";

export interface ResultsUserFilters {
  page: number;
  page_size: number;
  status?: 'all' | 'completed' | 'in_progress';
  max_score?: number;
  min_score?: number;
  search?: string;
  ordering?: string;
  order_dir: string;  
  test__level?: string;
  test__main_topic?: string;
  started_at?: string;
  updated_at?: string
  from_date?: string; // Formato: YYYY-MM-DD
  to_date?: string;   // Formato: YYYY-MM-DD
}

// ========================================
// Response Types
// ========================================

export interface ResultUsertItem {
  // Result info
  id: number;                    // result_id en la BD
  test_id: number;
  correct_answers: number;
  wrong_answers: number;
  total_questions: number;
  score: number;                 // Porcentaje redondeado a 1 decimal
  time_taken: number;            // En segundos
  status: 'completed' | 'in_progress';
  started_at: string;            // ISO date string
  updated_at: string;            // ISO date string
  
  // Test info
  test__title: string;
  test__description?: string;
  test__main_topic: string;
  test__sub_topic: string;
  test__specific_topic: string;
  test__level: string;
  test__created_at: string;       // ISO date string
  
  // Additional
  answered_count: number;        // Número de preguntas respondidas
}

export interface ResultsUserStats {
  total_unfiltered: number;       // Total de resultados en el sistema (sin filtros)
  total_filtered: number;   // Resultados después de aplicar filtros
  completed_tests: number;
  in_progress_tests: number;
  average_score: number;            // Porcentaje promedio
  total_time_spent: number;         // En segundos
  total_questions_answered: number;
  total_correct_answers: number;
}

interface ResultsUserPagination {
  total_filtered: number;
  total_unfiltered: number;
  total_pages: number;
  current_page: number;
  page_size: number;
  has_more: boolean;
}

export interface ResultsUserResponse {
  user: User;
  data: ResultUsertItem[];
  pagination: ResultsUserPagination;
  available_filters: {
    main_topics: string[];
    levels: string[];
    statuses: Array<'all' | 'completed' | 'in_progress'>;
  };
  stats: ResultsUserStats;
}

// ========================================
// Detail View Types (para GetUserResultDetails)
// ========================================

export interface UserResultDetail {
  id: number;
  user_id: number;
  test_id: number;
  correct_answers: number;
  wrong_answers: number;
  time_taken: number;
  status: 'completed' | 'in_progress';
  answered_questions: Record<number, number>; // question_id: answer_id
  started_at: string;
  updated_at: string;
}

export interface UserDetail {
  id: number;
  username: string;
  role: 'user' | 'admin';
  email: string;
  first_name: string | null;
  last_name: string | null;
}

export interface TestDetail {
  id: number;
  title: string;
  description: string | null;
  main_topic: string;
  sub_topic: string;
  specific_topic: string;
  level: string;
  created_at: string;
}

export interface AnswerDetail {
  id: number;
  answer_text: string;
  is_correct: boolean;
}

export interface QuestionDetail {
  id: number;
  question_text: string;
  answers: AnswerDetail[];
}

export interface ScoreDetails {
  correct: number;
  wrong: number;
  score_percentage: number;
}

export interface ResultUserDetailsResponse {
  result: UserResultDetail;
  user: UserDetail;
  test: TestDetail;
  questions: QuestionDetail[];
  score_details: ScoreDetails;
  total_questions: number;
}