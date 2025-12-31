export interface DashboardStats {
  personal_stats: PersonalStats;
  ranking_stats: RankingStats;
  level_stats: {
    [key: string]: LevelStats;
  };
}

export interface PersonalStats {
  tests_completed: number;
  tests_in_progress: number;
  tests_abandoned: number;
  average_score: number;
  average_time_per_question: number;
  total_questions_answered: number;
  total_time: number;
  average_score_first_attempt: number;
  average_time_per_question_first_attempt: number;
  total_questions_first_attempt: number;
  total_time_first: number;
  total_correct: AttemptStats;
  total_incorrect: AttemptStats;
}

export interface AttemptStats {
  first_attempt: number;
  all_attempts: number;
}

export interface LevelStats {
  first_attempt: LevelAttemptStats;
  all_attempts: LevelAttemptStats;
}

export interface LevelAttemptStats {
  average_time_per_question: number;
  average_score: number;
  tests_count: number;
  questions_count: number;
  total_correct: number;
  total_incorrect: number;
  total_time: number; // Nuevo campo del endpoint de Go
}

export interface RankingStats {
  total_users: number;
  rank_by_avg_time_per_question: number;
  rank_by_avg_time_per_question_first: number;
  total_rank_by_tests: number;
  total_rank_by_avg_time: number;
}

// Nuevas interfaces para el endpoint de rankings
export interface RankingItem {
  user_id: number;
  username: string;
  value: number;
  rank: number;
}

export interface LevelPosition {
  avg_time_per_question_all: number;
  avg_time_per_question_first: number;
  accuracy_all: number;
  accuracy_first: number;
  tests_count: number;
}

export interface LevelCommunityStats {
  avg_time_per_question_all: number;
  avg_time_per_question_first: number;
  avg_accuracy_all: number;
  avg_accuracy_first: number;
  avg_tests_per_user: number;
  total_users_with_level: number;
}

export interface PercentileStats {
  time_per_question_all: number;
  time_per_question_first: number;
  accuracy_all: number;
  accuracy_first: number;
  tests_completed: number;
}

export interface MyPosition {
  tests: number;
  avg_time_per_question_all: number;
  avg_time_per_question_first: number;
  accuracy_all: number;
  accuracy_first: number;
  questions_answered: number;
  levels: {
    [key: string]: LevelPosition;
  };
}

export interface CommunityAverages {
  avg_time_per_question_all: number;
  avg_time_per_question_first: number;
  accuracy_all: number;
  accuracy_first: number;
  avg_questions_per_user: number;
  levels: {
    [key: string]: LevelCommunityStats;
  };
}

export interface RankingsResponse {
  top_by_tests: RankingItem[];
  top_by_avg_time_per_question_all: RankingItem[];
  top_by_avg_time_per_question_first: RankingItem[];
  top_by_accuracy_all: RankingItem[];
  top_by_accuracy_first: RankingItem[];
  top_by_questions_answered: RankingItem[];
  top_by_levels: {
    [key: string]: RankingItem[];
  };
  my_position: MyPosition;
  community_averages: CommunityAverages;
  percentile: PercentileStats;
}

// export interface RankingStats {
//   total_users: number;
//   rank_by_tests: number;
//   rank_by_avg_time: number;
//   rank_by_avg_time_first: number;
//   total_rank_by_tests: number;
//   total_rank_by_avg_time: number;
// }

// export interface DashboardData {
//   personal_stats: PersonalStats;
//   ranking_stats: RankingStats;
// }

// export interface RankingItem {
//   user_id: number;
//   username: string;
//   value: number;
//   rank: number;
// }

// export interface RankingsData {
//   top_by_tests: RankingItem[];
//   top_by_avg_time: RankingItem[];
//   top_by_avg_time_first: RankingItem[];
//   my_position: {
//     tests: number;
//     avg_time: number;
//     avg_time_first: number;
//   };
// }

// export interface DashboardSummary {
//   personal_stats: PersonalStats;
//   ranking_stats: RankingStats;
//   rankings_data?: RankingsData;
//   last_updated: Date;
// }

export interface TimeStats {
  average_time_per_question: string;
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

// export interface ProgressData {
//   daily_completions: { date: string; count: number }[];
//   weekly_average_score: { week: string; score: number }[];
//   monthly_activity: { month: string; tests: number; time: number }[];
// }


// export interface DashboardStats {
//   personal_stats: PersonalStats;
//   ranking_stats: RankingStats;
//   level_stats: {
//     [key: string]: LevelStats;
//   };
// }

// export interface PersonalStats {
//   tests_completed: number;
//   tests_in_progress: number;
//   tests_abandoned: number;
//   average_score: number;
//   average_time_per_question: number;
//   total_questions_answered: number;
//   total_time: number;
//   average_score_first_attempt: number;
//   average_time_per_question_first_attempt: number;
//   total_questions_first_attempt: number;
//   total_time_first: number;
//   total_correct: AttemptStats;
//   total_incorrect: AttemptStats;
// }

// export interface AttemptStats {
//   first_attempt: number;
//   all_attempts: number;
// }

// export interface LevelStats {
//   first_attempt: LevelAttemptStats;
//   all_attempts: LevelAttemptStats;
// }

// export interface LevelAttemptStats {
//   average_time_per_question: number;
//   average_score: number;
//   tests_count: number;
//   questions_count: number;
//   total_correct: number;
//   total_incorrect: number;
// }

// export interface RankingStats {
//   total_users: number;
//   rank_by_avg_time_per_question: number;
//   rank_by_avg_time_per_question_first: number;
//   total_rank_by_tests: number;
//   total_rank_by_avg_time: number;
// }

// // Para mantener compatibilidad, puedes mantener estas interfaces si las necesitas
// export interface DashboardData {
//   personal_stats: PersonalStats;
//   ranking_stats: RankingStats;
//   level_stats: {
//     [key: string]: LevelStats;
//   };
// }

// export interface DashboardSummary extends DashboardData {
//   last_updated: Date;
// }
