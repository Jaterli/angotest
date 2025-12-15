export interface Answer {
  id?: number;
  answer_text: string;
  is_correct: boolean;
}

export interface Question {
  id?: number;
  question_text: string;
  answers: Answer[];
}

export interface Test {
  id?: number;
  title: string;
  description?: string;
  category: string;   
  level: string;     
  test_date: string; 
  questions: Question[];
  results?: Result[];
}

export interface TestsResponse {
  tests: Test[];
}

export interface Result {
  id: number;
  correct_answers: number;
  wrong_answers: number;
  total_questions: number;
  score_percent: number;
  created_at: string;
  user_id: number;
  test_id: number;
  test_title: string;
  test_category: string;
  test_description: string;
  test_level: string;
  time_taken: number;
}

export interface ResultResponse {
  results: Result[];
}

export interface NotCompletedTestsResponse {
  tests: Test[];
  not_completed_count: number;
  message: string;
}

export interface CompletedTestsResponse {
  tests: Test[];
  completed_count: number;
  message: string;
}


export interface AnswerSubmit {
  question_id: number;
  answer_id: number;
}

export interface SaveResultInput {
  test_id: number;
  answers: AnswerSubmit[];
  time_taken: number;
  status: 'in_progress' | 'completed' | 'abandoned';
}

export interface ResumeTestResponse {
  test: Test;
  answers: AnswerSubmit[];
  time_elapsed: number;
  progress: number;
  is_resuming: boolean;
  result_id?: number;
}

export interface InProgressTestsResponse {
  in_progress_tests: any[];
  count: number;
}

export interface CompletedTestsResponse {
  completed_tests: any[];
  count: number;
}

export interface TestsWithStatusResponse {
  tests: TestWithStatus[];
  total_tests: number;
  completed_count: number;
  in_progress_count: number;
  not_started_count: number;
  message: string;
}

export interface TestWithStatus extends Test {
  status: 'not_started' | 'in_progress' | 'completed';
  completed_at?: string; 
  last_score?: number;
  correct_answers: number;
  wrong_answers: number;
  total_questions: number;
  time_taken: number;
  progress?: number;
  question_count?: number; 
}