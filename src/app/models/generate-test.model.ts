// models/generate-test.model.ts
export interface GenerateTestRequest {
  topic: string;
  category: string;
  level: string;
  num_questions: number;
  num_answers: number;
  language?: string;
}

export interface AIRequestStatus {
  id: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  generated_test_id?: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface UserQuota {
  month_year: string;
  max_requests: number;
  used_requests: number;
  remaining_requests: number;
}

export interface TopicsResponse {
  topics: string[];
  count: number;
  timestamp: string;
}
