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
  active_threshold?: number;
}

// Estadísticas detalladas de un test
export interface TestDetailedStats {
  totalAttempts: number;
  completedAttempts: number;
  avgAccuracy: number;
  avgTime: number;
  avgQuestions: number;
  completionRate: number;
  abandonmentRate: number;
  difficultyLevel: string;
  topicHierarchy: {
    mainTopic: string;
    subTopic: string;
    specificTopic: string;
  };
}

// Estadísticas detalladas de un usuario
export interface UserDetailedStats {
  userInfo: {
    username: string;
    email: string;
    createdAt: string;
    lastLogin: string;
    role: string;
  };
  testStats: {
    totalTests: number;
    completedTests: number;
    inProgressTests: number;
    abandonedTests: number;
    avgAccuracy: number;
    avgTimePerTest: number;
    favoriteTopic: string;
    favoriteLevel: string;
  };
  recentActivity: {
    testTitle: string;
    status: string;
    accuracy: number;
    timeTaken: number;
    startedAt: string;
  }[];
}