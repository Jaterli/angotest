// dashboard.models.ts
export interface DashboardStats {
  // Totales
  total_users: number;
  active_users: number;
  total_tests: number;
  completed_tests: number;
  in_progress_tests: number;
  abandoned_tests: number;
  active_tests: number;
  advanced_level_tests: number;
  intermediate_tests: number;
  beginner_tests: number;

  // Listados
  most_completed_tests: TestInfo[];
  most_incomplete_tests: TestInfo[];
  most_abandoned_tests: TestInfo[];
  least_started_oldest_tests: TestInfo[];
  highest_accuracy_tests: TestAccuracy[];
  lowest_accuracy_tests: TestAccuracy[];
  longest_average_time_tests: TestTime[];
  shortest_average_time_tests: TestTime[];
  new_users_monthly: MonthlyUsers[];
  active_users_monthly: MonthlyActiveUsers[];
  inactive_users: UserInfo[];
  recently_logged_users: UserInfo[];
  oldest_logged_users: UserInfo[];
}

export interface SimpleDashboardStats {
  total_users: number;
  total_tests: number;
  active_tests: number;
  completed_tests: number;
  in_progress_tests: number;
  new_users_today: number;
  new_users_this_month: number;
  tests_completed_today: number;
}

// Estructuras auxiliares
export interface TestInfo {
  id: number;
  title: string;
  count?: number;
}

export interface TestAccuracy {
  id: number;
  title: string;
  total_results?: number;
  accuracy: number;
}

export interface TestTime {
  id: number;
  title: string;
  avg_time: number;
}

export interface UserInfo {
  id: number;
  username: string;
  count?: number;
}

export interface MonthlyUsers {
  month_year: string;
  count: number;
  users: UserInfo[];
}

export interface MonthlyActiveUsers {
  month_year: string;
  count: number;
  users: UserInfo[];
}

// Filtros para dashboard
export interface DashboardFilters {
  min_tests?: number;
}