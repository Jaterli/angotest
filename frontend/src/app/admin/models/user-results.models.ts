// ========================================
// Request Types
// ========================================

import { User } from "../../shared/models/user.models";

export interface UserResultsRequest {
  page?: number;
  page_size?: number;
  status?: 'all' | 'completed' | 'in_progress';
  sort_by?: 'started_at' | 'updated_at' | 't_created_at' | 'title' | 'level' | 'average_score' | 'time_taken';
  sort_order?: 'asc' | 'desc';
  search?: string;
  level?: string;
  main_topic?: string;
  sub_topic?: string;
  from_date?: string; // Formato: YYYY-MM-DD
  to_date?: string;   // Formato: YYYY-MM-DD
}

// ========================================
// Response Types
// ========================================

export interface UserResultItem {
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
  test_title: string;
  test_description?: string;
  test_main_topic: string;
  test_sub_topic: string;
  test_specific_topic: string;
  test_level: string;
  test_created_at: string;       // ISO date string
  
  // Additional
  answered_count: number;        // Número de preguntas respondidas
}

export interface UserResultsStats {
  total_results: number;            // Total de resultados en el sistema (sin filtros)
  total_filtered_results: number;   // Resultados después de aplicar filtros
  completed_tests: number;
  in_progress_tests: number;
  average_score: number;            // Porcentaje promedio
  total_time_spent: number;         // En segundos
  total_questions_answered: number;
  total_correct_answers: number;
}

export interface UserResultsResponse {
  user: User;
  results: UserResultItem[];
  filters_applied: UserResultsRequest;
  available_filters: {
    main_topics: string[];
    levels: string[];
    statuses: Array<'all' | 'completed' | 'in_progress'>;
  };
  stats: UserResultsStats;
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

export interface UserResultDetailsResponse {
  result: UserResultDetail;
  user: UserDetail;
  test: TestDetail;
  questions: QuestionDetail[];
  score_details: ScoreDetails;
  total_questions: number;
}