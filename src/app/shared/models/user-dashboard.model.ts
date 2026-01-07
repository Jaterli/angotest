// Modelos para el dashboard de usuario

// ============ DASHBOARD ENDPOINT ============

export interface DashboardStats {
  personal_stats: PersonalStats;
  level_stats: LevelStatsMap;
  total_active_users: number;
}

export interface PersonalStats {
  completed_tests_all_attempts: number;
  completed_tests_first_attempt: number;
  in_progress_tests: number;
  abandoned_tests: number;
  average_score_all_attempts: number;
  average_time_taken_per_question_all_attempts: number;
  total_questions_answered_all_attempts: number;
  total_time_taken_all_attempts: number;
  average_score_first_attempt: number;
  average_time_taken_per_question_first_attempt: number;
  total_questions_answered_first_attempt: number;
  total_time_taken_first_attempt: number;
  total_correct: AttemptStats;
  total_wrong: AttemptStats;
}

export interface AttemptStats {
  first_attempt: number;
  all_attempts: number;
}

export interface LevelStatsMap {
  [key: string]: LevelStats;
}

export interface LevelStats {
  first_attempt: LevelAttemptStats;
  all_attempts: LevelAttemptStats;
}

export interface LevelAttemptStats {
  average_time_taken_per_question: number;
  average_score: number;
  tests_count: number;
  questions_count: number;
  total_correct: number;
  total_wrong: number;
  total_time_taken: number;
}

// ============ RANKINGS ENDPOINT ============

export interface RankingsResponse {
  // Top rankings (comunidad) - Actualizados según tu JSON
  top_by_tests: RankingItem[];
  top_by_avg_time_per_question_all_attempts: RankingItem[];
  top_by_avg_time_per_question_first_attempt: RankingItem[];
  top_by_accuracy_all_attempts: RankingItem[];
  top_by_accuracy_first_attempt: RankingItem[];
  top_by_questions_answered: RankingItem[];
  top_by_levels: { [key: string]: RankingItem[] };
  top_by_levels_accuracy: { [key: string]: RankingItem[] };  
  min_tests_for_ranking: number;
  
  // Datos del usuario actual - Actualizados según tu JSON
  current_user?: {
    position: {
      total_active_users: number;
      completed_tests: number;
      avg_time_per_question_all_attempts: number;
      avg_time_per_question_first_attempt: number;
      accuracy_all_attempts: number;
      accuracy_first_attempt: number;
      questions_answered: number;
      accuracy_by_level_first?: {
        [key: string]: number;
      };
    };
  };
  
  // Promedios de comunidad - Actualizados según tu JSON
  community_averages: {
    avg_time_per_question_all_attempts: number;
    avg_time_per_question_first_attempt: number;
    accuracy_all_attempts: number;
    accuracy_first_attempt: number;
    avg_questions_per_user: number;
    levels: {
      [key: string]: {
        avg_time_per_question_all_attempts: number;
        avg_time_per_question_first_attempt: number;
        avg_accuracy_all_attempts: number;
        avg_accuracy_first_attempt: number;
        avg_questions_per_user: number;
      };
    };
  };
}


export interface RankingItem {
  user_id: number;
  username: string;
  value: number;
  rank: number;
}

export interface LevelPosition {
  avg_time_per_question_all?: number;
  avg_time_per_question_first?: number;
  accuracy_all?: number;
  accuracy_first?: number;
  tests_count?: number;
  questions_count?: number;
}

export interface LevelCommunityStats {
  avg_time_per_question_all_attempts: number;
  avg_time_per_question_first_attempt: number;
  avg_accuracy_all_attempts: number;
  avg_accuracy_first_attempt: number;
  avg_tests_per_user: number;
  avg_questions_per_user?: number;
  total_users_with_level: number;
}

// ============ MODELOS PARA UI ============

export interface TimeStats {
  average_time_per_question: string;
  average_time_first_attempt: string;
  total_time_invested: string;
  efficiency_score_first_attempt: number;
  efficiency_score_all_attempts: number;
}

export interface AccuracyStats {
  accuracy_percentage: number;
  total_answers: number;
  correct_answers: number;
  wrong_answers: number;
  first_attempt_accuracy: number;
  first_attempt_correct: number;
  first_attempt_wrong: number;
  first_attempt_total: number;
}

export interface RankingPosition {
  category: string;
  position: number;
  total_participants: number;
  percentile: number;
  formatted_value: string;
  value: number;
  icon: string;
}

export interface CommunityComparison {
  time_all_improvement: number;
  time_first_improvement: number;
  accuracy_all_improvement: number;
  accuracy_first_improvement: number;
  questions_per_user_improvement: number;
  community_avg_time_all_attempts: number;
  community_avg_time_first_attempt: number;
  community_avg_accuracy_all_attempts: number;
  community_avg_accuracy_first_attempt: number;
  community_avg_questions_per_user: number;
}

export interface LevelComparison {
  [key: string]: {
    time_improvement: number;
    accuracy_improvement: number;
    time_first_improvement: number;
    accuracy_first_improvement: number;
    tests_improvement: number;
    questions_improvement: number;
    community_avg_time: number;
    community_avg_accuracy: number;
    community_avg_time_first_attempt: number;
    community_avg_accuracy_first_attempt: number;
    community_avg_tests: number;
    community_avg_questions: number;
    total_users: number;
  };
}

export interface LevelProgress {
  level: string;
  completed_tests: number;
  total_tests: number;
  completion_percentage: number;
  accuracy: number;
  average_time: number;
}

export interface LevelRankingInfo {
  level: string;
  tests_position: number;
  accuracy_position: number;
  time_position: number;
  total_users: number;
  percentile: number;
}

export interface LevelDetails {
  level: string;
  color: string;
  icon: string;
  first_attempt: {
    tests: number;
    questions: number;
    accuracy: number;
    time: number;
    correct: number;
    wrong: number;
  };
  all_attempts: {
    tests: number;
    questions: number;
    accuracy: number;
    time_taken: number;
    correct: number;
    wrong: number;
  };
  improvement_rate: {
    accuracy: number;
    time_taken: number;
    questions: number;
  };
}

export interface LevelCommunityComparison {
  level: string;
  color: string;
  icon: string;
  comparisons: {
    accuracy_all_attempts: ComparisonItem;
    time_taken_all_attempts: ComparisonItem;
    accuracy_first_attempt: ComparisonItem;
    time_taken_first_attempt: ComparisonItem;
    tests: ComparisonItem;
  };
}

export interface ComparisonItem {
  user: number;
  community: number;
  improvement: number;
  is_better: boolean;
}

export interface LevelDistribution {
  level: string;
  tests: number;
  percentage: number;
  color: string;
}

export interface UserLevelSummary {
  current_level: string;
  next_level: string;
  progress_to_next: number;
  required_tests: number;
  required_accuracy: number;
  color: string;
  icon: string;
}

export interface LevelPerformanceSummary {
  best_level: {
    level: string;
    accuracy: number;
    time: number;
    tests: number;
  };
  needs_practice: {
    level: string;
    accuracy: number;
    time: number;
    tests: number;
  };
  overall_performance: number;
}

// ============ MODELOS PARA FILTROS Y CONFIGURACIÓN ============

export interface DashboardFilters {
  date_range?: {
    start: Date;
    end: Date;
  };
  levels?: string[];
  test_type?: string;
  include_abandoned?: boolean;
}

export interface RankingFilters {
  limit: number;
  level?: string;
  category?: RankingCategory;
  sort_by?: 'asc' | 'desc';
}

// ============ TIPOS Y CONSTANTES ============

export const LEVELS = ['Principiante', 'Intermedio', 'Avanzado'] as const;
export type LevelType = typeof LEVELS[number];

export const RANKING_CATEGORIES = [
  'top_by_tests',
  'top_by_avg_time_per_question_all',
  'top_by_avg_time_per_question_first',
  'top_by_accuracy_all',
  'top_by_accuracy_first',
  'top_by_questions_answered'
] as const;

export type RankingCategory = typeof RANKING_CATEGORIES[number];

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

export const RANKING_CATEGORY_LABELS: Record<RankingCategory, string> = {
  'top_by_tests': 'Tests Completados',
  'top_by_avg_time_per_question_all': 'Tiempo Promedio',
  'top_by_avg_time_per_question_first': 'Tiempo 1er Intento',
  'top_by_accuracy_all': 'Precisión General',
  'top_by_accuracy_first': 'Precisión 1er Intento',
  'top_by_questions_answered': 'Preguntas Respondidas'
};

export const RANKING_CATEGORY_ICONS: Record<RankingCategory, string> = {
  'top_by_tests': '📊',
  'top_by_avg_time_per_question_all': '⏱️',
  'top_by_avg_time_per_question_first': '🚀',
  'top_by_accuracy_all': '🎯',
  'top_by_accuracy_first': '⭐',
  'top_by_questions_answered': '❓'
};

export const RANKING_CATEGORY_COLORS: Record<RankingCategory, string> = {
  'top_by_tests': '#3b82f6', // blue
  'top_by_avg_time_per_question_all': '#10b981', // emerald
  'top_by_avg_time_per_question_first': '#f59e0b', // amber
  'top_by_accuracy_all': '#8b5cf6', // purple
  'top_by_accuracy_first': '#ec4899', // pink
  'top_by_questions_answered': '#06b6d4' // cyan
};

// ============ TIPOS PARA EVENTOS Y NOTIFICACIONES ============

export interface DashboardUpdateEvent {
  type: 'stats' | 'rankings' | 'all';
  timestamp: Date;
  data: DashboardStats | RankingsResponse | null;
}

export interface AchievementUnlocked {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  unlocked_at: Date;
  level: LevelType;
}

export interface PerformanceAlert {
  type: 'improvement' | 'decline' | 'milestone';
  message: string;
  level: LevelType;
  value: number;
  previous_value: number;
  timestamp: Date;
}

// ============ TIPOS PARA GRÁFICOS Y VISUALIZACIONES ============

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface TimeSeriesData {
  date: Date;
  accuracy: number;
  time_per_question: number;
  completed_tests: number;
  level: LevelType;
}

export interface RadarChartData {
  category: string;
  user_score: number;
  community_average: number;
  max_score: number;
}

export interface LevelComparisonChart {
  level: LevelType;
  user_accuracy: number;
  community_accuracy: number;
  user_time: number;
  community_time: number;
  user_tests: number;
  community_tests: number;
}

// ============ TIPOS PARA RESPUESTAS DE API ============

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: Date;
  version: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

// ============ TIPOS PARA ESTADÍSTICAS AVANZADAS ============

export interface PerformanceMetrics {
  consistency_score: number; // 0-100
  learning_rate: number; // % de mejora por test
  retention_rate: number; // % de conocimiento retenido
  speed_accuracy_balance: number; // 0-100
  level_progression_rate: number; // tests por nivel
}

export interface StreakInfo {
  current_streak: number;
  longest_streak: number;
  streak_type: 'daily' | 'weekly';
  last_activity: Date;
}

export interface StudyPatterns {
  preferred_time_of_day: 'morning' | 'afternoon' | 'evening' | 'night';
  average_session_duration: number;
  tests_per_week: number;
  accuracy_by_day: Record<string, number>;
}

// ============ TIPOS PARA COMPARACIONES SOCIALES ============

export interface SocialComparison {
  friends_count: number;
  friends_average: {
    accuracy: number;
    time: number;
    tests: number;
  };
  position_among_friends: number;
  closest_friend: {
    username: string;
    accuracy_difference: number;
    time_difference: number;
  };
}

// ============ TIPOS PARA RECOMENDACIONES ============

export interface Recommendation {
  type: 'level' | 'test' | 'topic' | 'practice';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  action_url?: string;
  estimated_time?: number;
  expected_improvement?: number;
}

export interface LevelRecommendation extends Recommendation {
  target_level: LevelType;
  current_performance: number;
  target_performance: number;
  required_tests: number;
}

// ============ TIPOS PARA HISTORIAL ============

export interface PerformanceHistory {
  date: Date;
  level: LevelType;
  accuracy: number;
  time_per_question: number;
  completed_tests: number;
  streak_days: number;
}

export interface LevelHistory {
  level: LevelType;
  first_attempt_date: Date;
  last_attempt_date: Date;
  total_days_active: number;
  progression_rate: number;
}
