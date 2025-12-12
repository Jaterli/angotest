import { User } from "./user.model";

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
  total: number;
  created_at: string;
  user_id: number;
  test_id: number;
  time_taken: number;
  user: User;
  test: Test;
}

export interface ResultResponse {
  results: Result[];
}

export interface TestsWithStatusResponse {
  tests: TestWithStatus[];
  total_tests: number;
  completed_count: number;
  not_completed_count: number;
  message: string;
}

export interface TestWithStatus extends Test {
  is_completed: boolean;
  completed_at?: string;
  last_score?: number;
  question_count: number;
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
