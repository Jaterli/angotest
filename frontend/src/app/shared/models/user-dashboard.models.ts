// Modelos para el dashboard de usuario

// ============ DASHBOARD ENDPOINT ============

export interface DashboardStats {
  personal_data: PersonalData;
  level_data: { [key: string]: LevelData };
  total_active_users: number;
}

export interface PersonalData {
  completed_tests: number;
  in_progress_tests: number;
  abandoned_tests: number;
  first_attempt: AttemptDataCategory;
  all_attempts: AttemptDataCategory;
}

export interface AttemptDataCategory {
  tests_count: number;
  total_questions_answered: number;
  total_time_taken: number;
  total_correct: number;
  total_wrong: number;
}

export interface LevelData {
  first_attempt: LevelAttemptData;
  all_attempts: LevelAttemptData;
}

export interface LevelAttemptData {
  tests_count: number;
  questions_count: number;
  total_correct: number;
  total_wrong: number;
  total_time_taken: number;
}

// ============ RANKINGS ENDPOINT ============

export interface RankingsResponse {
  top_by_tests: RankingItem[];
  top_by_avg_time_taken_per_question: AttemptRankings;
  top_by_accuracy: AttemptRankings;
  top_by_questions_answered: AttemptRankings;
  top_by_levels: { [key: string]: RankingItem[] };
  top_by_levels_accuracy: { [key: string]: RankingItem[] };
  current_user_positions: CurrentUserPositions;
  community_averages: CommunityAverages;
  min_tests_for_ranking: number;
}

export interface AttemptRankings {
  all_attempts: RankingItem[];
  first_attempt: RankingItem[];
}

export interface CurrentUserPositions {
  total_active_users: number;
  completed_tests: number;
  all_attempts: UserRankingData;
  first_attempt: UserRankingData;
  levels: { [key: string]: LevelRanking };
}

export interface UserRankingData {
  avg_time_taken_per_question: number;
  accuracy: number;
  questions_answered: number;
}

export interface LevelRanking {
  accuracy: number;
}

export interface CommunityAverages {
  all_attempts: CommunityAveragesData;
  first_attempt: CommunityAveragesData;
  levels: { [key: string]: CommunityLevelAverages };
}

export interface CommunityAveragesData {
  avg_time_taken_per_question: number;
  avg_accuracy: number;
  avg_questions_per_user: number;
}

export interface CommunityLevelAverages {
  all_attempts: CommunityAveragesData;
  first_attempt: CommunityAveragesData;
}

export interface RankingItem {
  user_id: number;
  username: string;
  value: number;
  rank: number;
}

// ============ TIPOS Y CONSTANTES ============

export const LEVELS = ['Principiante', 'Intermedio', 'Avanzado'] as const;
export type LevelType = typeof LEVELS[number];

export const RANKING_CATEGORIES = [
  'top_by_tests',
  'top_by_avg_time_taken_per_question',
  'top_by_accuracy',
  'top_by_questions_answered',
  'top_by_levels',
  'top_by_levels_accuracy'
] as const;

export type RankingCategory = typeof RANKING_CATEGORIES[number];

export const ATTEMPT_TYPES = ['all_attempts', 'first_attempt'] as const;
export type AttemptType = typeof ATTEMPT_TYPES[number];

export const LEVEL_COLORS: Record<LevelType, string> = {
  'Principiante': '#3b82f6', // blue-500
  'Intermedio': '#10b981',   // emerald-500
  'Avanzado': '#8b5cf6'      // purple-500
};

export const LEVEL_COLORS_LIGHT: Record<LevelType, string> = {
  'Principiante': '#dbeafe', // blue-100
  'Intermedio': '#d1fae5',   // emerald-100
  'Avanzado': '#ede9fe'      // purple-100
};

export const LEVEL_ICONS: Record<LevelType, string> = {
  'Principiante': '🟦',
  'Intermedio': '🟩',
  'Avanzado': '🟪'
};

export const LEVEL_DESCRIPTIONS: Record<LevelType, string> = {
  'Principiante': 'Nivel inicial - Enfocado en conceptos básicos',
  'Intermedio': 'Nivel medio - Aplicación de conocimientos',
  'Avanzado': 'Nivel experto - Dominio completo del tema'
};

export const RANKING_CATEGORY_LABELS: Record<string, string> = {
  'top_by_tests': 'Tests Completados',
  'top_by_avg_time_taken_per_question': 'Tiempo Promedio',
  'top_by_accuracy': 'Precisión',
  'top_by_questions_answered': 'Preguntas Respondidas',
  'top_by_levels': 'Tests por Nivel',
  'top_by_levels_accuracy': 'Precisión por Nivel'
};

export const RANKING_CATEGORY_ICONS: Record<string, string> = {
  'top_by_tests': '📊',
  'top_by_avg_time_taken_per_question': '⏱️',
  'top_by_accuracy': '🎯',
  'top_by_questions_answered': '❓',
  'top_by_levels': '📈',
  'top_by_levels_accuracy': '⭐'
};

export const RANKING_CATEGORY_COLORS: Record<string, string> = {
  'top_by_tests': '#3b82f6', // blue
  'top_by_avg_time_taken_per_question': '#10b981', // emerald
  'top_by_accuracy': '#8b5cf6', // purple
  'top_by_questions_answered': '#06b6d4', // cyan
  'top_by_levels': '#f59e0b', // amber
  'top_by_levels_accuracy': '#ec4899' // pink
};