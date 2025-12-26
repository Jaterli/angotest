import { Result } from "./test.model";

export interface IncorrectAnswer {
  question_id: number;
  question_text: string;
  user_answer_id: number;
  user_answer_text: string;
  correct_answer_id: number;
  correct_answer_text: string;
}

export interface IncorrectAnswersResponse {
  result: Result;
  test: {
    id: number;
    title: string;
    description?: string;
    main_topic: string;
    sub_topic: string;
    specific_topic: string;
    level: string;
    test_date: string;
  };
  incorrect_questions: IncorrectAnswer[];
  total_questions: number;
  score_details: {
    correct: number;
    wrong: number;
    score_percentage: number;
  };
  summary: {
    total_correct: number;
    total_incorrect: number;
    questions_with_errors: number;
  };
  user_answers: Record<string, number>;
}