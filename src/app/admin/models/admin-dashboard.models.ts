// dashboard.models.ts

// Estructuras principales del dashboard
export interface DashboardResponse {
  totals: DashboardTotals;
  top_tests: TopTestsLists;
  user_lists: UserLists;
}

export interface DashboardTotals {
  total_users: number;
  active_users: number;
  total_tests: number;
  inactive_tests: number;
  completed_tests: number;
  in_progress_tests: number;
  abandoned_tests: number;
  advanced_tests: number;
  intermediate_tests: number;
  beginner_tests: number;
}

export interface TopTestsLists {
  most_completed: TestWithCount[];
  most_incomplete: TestWithCount[];
  most_abandoned: TestWithCount[];
  least_started_oldest: TestWithDate[];
  highest_accuracy: TestWithRate[];
  lowest_accuracy: TestWithRate[];
  highest_avg_time: TestWithTime[];
  lowest_avg_time: TestWithTime[];
}

export interface UserLists {
  new_users_by_month: UserWithCount[];
  most_active_users: UserWithCount[];
  least_active_oldest: UserWithDate[];
  recent_login: UserWithDate[];
  oldest_login: UserWithDate[];
}

// Tipos de datos comunes
export interface TestWithCount {
  id: number;
  title: string;
  count: number;
}

export interface TestWithDate {
  id: number;
  title: string;
  date: string;
  attempt_count: number;
}

export interface TestWithRate {
  id: number;
  title: string;
  accuracy_rate: number;
}

export interface TestWithTime {
  id: number;
  title: string;
  avg_time: number;
}

export interface UserWithCount {
  id: number;
  username: string;
  count: number;
}

export interface UserWithDate {
  id: number;
  username: string;
  date: string;
}

// Filtros para el dashboard
export interface DashboardFilters {
  months_back?: number;
  year?: number;
  use_total?: boolean;
  limit?: number;
}

// Estadísticas detalladas de un test
export interface TestDetailedStats {
  total_attempts: number;
  completed_attempts: number;
  in_progress_attempts: number;
  avg_accuracy: number;
  avg_time: number;
  avg_questions: number;
  completion_rate: number;
  difficulty_level: string;
  test_title: string;
  topic_hierarchy: {
    main_topic: string;
    sub_topic: string;
    specific_topic: string;
  };
}

// Estadísticas detalladas de un usuario
export interface UserDetailedStats {
  user_info: {
    username: string;
    email: string;
    created_at: string;
    last_login: string;
    role: string;
  };
  test_stats: {
    total_tests: number;
    completed_tests: number;
    in_progress_tests: number;
    abandoned_tests: number;
    avg_accuracy: number;
    avg_time_per_test: number;
    favorite_topic: string;
    favorite_level: string;
  };
  recent_activity: {
    test_title: string;
    status: string;
    accuracy: number;
    time_taken: number;
    started_at: string;
  }[];
}