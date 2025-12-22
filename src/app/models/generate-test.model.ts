export interface GenerateTestRequest {
  main_topic?: string;
  sub_topic?: string;
  specific_topic?: string;
  level: string;
  num_questions: number;
  num_answers: number;
  language: string;
  ai_prompt?: string;
  generation_mode?: string;
}

export interface AIRequestStatus {
  request_id: number;
  user_id: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  main_topic: string;
  sub_topic: string;
  specific_topic: string;
  level: string;
  num_questions: number;
  num_answers: number;
  language: string;
  ai_provider?: string;
  ai_model?: string;
  ai_prompt?: string;
  generated_test_id?: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface TopicsResponse {
  main_topics: string[];
  count: number;
}

export interface SubTopicsResponse {
  main_topic: string;
  sub_topics: string[];
  count: number;
}

export interface SpecificTopicsResponse {
  main_topic: string;
  sub_topic: string;
  specific_topics: string[];
  count: number;
}

export interface UserQuota {
  month_year: string;
  max_requests: number;
  used_requests: number;
  remaining_requests: number;
}