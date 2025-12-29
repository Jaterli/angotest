
export interface PersonalStats {
  tests_completed: number;
  tests_in_progress: number;
  tests_abandoned: number;
  average_score: number;
  average_time: number;
  total_time: number;
  average_score_first: number;
  average_time_first: number;
  total_time_first: number;
  total_correct: number;
  total_incorrect: number;
}

export interface RankingStats {
  total_users: number;
  rank_by_tests: number;
  rank_by_avg_time: number;
  rank_by_avg_time_first: number;
  total_rank_by_tests: number;
  total_rank_by_avg_time: number;
}

export interface DashboardData {
  personal_stats: PersonalStats;
  ranking_stats: RankingStats;
}

export interface RankingItem {
  user_id: number;
  username: string;
  value: number;
  rank: number;
}

export interface RankingsData {
  top_by_tests: RankingItem[];
  top_by_avg_time: RankingItem[];
  top_by_avg_time_first: RankingItem[];
  my_position: {
    tests: number;
    avg_time: number;
    avg_time_first: number;
  };
}

export interface DashboardSummary {
  personal_stats: PersonalStats;
  ranking_stats: RankingStats;
  rankings_data?: RankingsData;
  last_updated: Date;
}

export interface TimeStats {
  average_time_per_test: string;
  average_time_first_attempt: string;
  total_time_invested: string;
  efficiency_score: number;
}

export interface AccuracyStats {
  accuracy_percentage: number;
  total_answers: number;
  correct_answers: number;
  incorrect_answers: number;
  improvement_since_last_week?: number;
}

export interface RankingPosition {
  category: string;
  position: number;
  total_participants: number;
  percentile: number;
  value: number;
  formatted_value: string;
}

export interface ProgressData {
  daily_completions: { date: string; count: number }[];
  weekly_average_score: { week: string; score: number }[];
  monthly_activity: { month: string; tests: number; time: number }[];
}



