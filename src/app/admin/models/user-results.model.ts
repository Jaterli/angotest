export interface UserResultDetail {
  result_id: number;
  test_id: number;
  title: string;
  description: string;
  main_topic: string;
  sub_topic: string;
  specific_topic: string;
  level: string;
  total_questions: number;
  correct_answers: number;
  wrong_answers: number;
  score: number;
  time_taken: number;
  status: 'completed' | 'in_progress' | 'abandoned';
  created_at: string;
  updated_at: string;
  test_date: string;
}

export interface UserResultsFilters {
  page?: number;
  page_size?: number;
  status?: 'all' | 'completed' | 'in_progress';
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  search?: string;
  level?: string;
  main_topic?: string;
  sub_topic?: string;
  from_date?: string;
  to_date?: string;
}

export interface UserResultsResponse {
  results: UserResultDetail[];
  total_results: number;
  total_pages: number;
  current_page: number;
  page_size: number;
  has_more: boolean;
  
  stats: {
    total_tests: number;
    completed_tests: number;
    in_progress_tests: number;
    average_score: number;
    total_time_spent: number;
    total_questions_answered: number;
    total_correct_answers: number;
  };
  
  filters: {
    status?: string;
    level?: string;
    main_topic?: string;
    sub_topic?: string;
    from_date?: string;
    to_date?: string;
    search?: string;
    sort_by: string;
    sort_order: string;
  };
}

export interface UserResultsData {
  user: {
    id: number;
    username: string;
    email: string;
    first_name?: string;
    last_name?: string;
  };
  results: UserResultsResponse;
}

export interface QuestionDetail {
  id: number;
  question_text: string;
  user_answer_id?: number;
  correct_answer_id: number;
  is_correct: boolean;
  answers: {
    id: number;
    answer_text: string;
    is_correct: boolean;
  }[];
}

export interface ResultDetailsResponse {
  result: any;
  test: any;
  questions: QuestionDetail[];
  total_questions: number;
  score_details: {
    correct: number;
    wrong: number;
    score_percentage: number;
  };
}