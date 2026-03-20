package types

// RankingItem - Item individual en un ranking
type RankingItem struct {
	UserID   uint    `json:"user_id"`
	Username string  `json:"username"`
	Value    float64 `json:"value"`
	Rank     int     `json:"rank"`
}

// AttemptRankings - Rankings por tipo de intento
type AttemptRankings struct {
	AllAttempts  []RankingItem `json:"all_attempts"`
	FirstAttempt []RankingItem `json:"first_attempt"`
}

// PersonalData - Estadísticas personales del usuario
type PersonalData struct {
	CompletedTests    int                  `json:"completed_tests"`
	InProgressTests   int                  `json:"in_progress_tests"`
	ExpiredTests      int                  `json:"expired_tests"`
	FirstAttempt      AttemptDataCategory `json:"first_attempt"`
	AllAttempts       AttemptDataCategory `json:"all_attempts"`
}

type AttemptDataCategory struct {
	TestsCount                  int     `json:"tests_count"`
	TotalQuestionsAnswered      int     `json:"total_questions_answered"`
	TotalTimeTaken              int     `json:"total_time_taken"`
	TotalCorrect                int     `json:"total_correct"`
	TotalWrong                  int     `json:"total_wrong"`
}

// LevelData - Estadísticas por nivel
type LevelData struct {
	FirstAttempt LevelAttemptData `json:"first_attempt"`
	AllAttempts  LevelAttemptData `json:"all_attempts"`
}

type LevelAttemptData struct {
	TestsCount                  int     `json:"tests_count"`
	QuestionsCount              int     `json:"questions_count"`
	TotalCorrect                int     `json:"total_correct"`
	TotalWrong                  int     `json:"total_wrong"`
	TotalTimeTaken              int     `json:"total_time_taken"`
}

// CommunityAverages - Promedios de la comunidad
type CommunityAverages struct {
	AllAttempts  CommunityAveragesData `json:"all_attempts"`
	FirstAttempt CommunityAveragesData `json:"first_attempt"`
	Levels       map[string]CommunityLevelAverages `json:"levels"`
}

type CommunityAveragesData struct {
	AvgTimeTakenPerQuestion float64 `json:"avg_time_taken_per_question"`
	AvgAccuracy             float64 `json:"avg_accuracy"`
	AvgQuestionsPerUser     float64 `json:"avg_questions_per_user"`
}

type CommunityLevelAverages struct {
	AllAttempts  CommunityAveragesData `json:"all_attempts"`
	FirstAttempt CommunityAveragesData `json:"first_attempt"`
}

// CurrentUserPositions - Posiciones del usuario en todos los rankings
type CurrentUserPositions struct {
	TotalActiveUsers  int                    `json:"total_active_users"`
	CompletedTests    int                    `json:"completed_tests"`
	AllAttempts       UserRankingData        `json:"all_attempts"`
	FirstAttempt      UserRankingData        `json:"first_attempt"`
	Levels            map[string]LevelRanking `json:"levels"`
}

type UserRankingData struct {
	AvgTimeTakenPerQuestion int  `json:"avg_time_taken_per_question"`
	Accuracy                int  `json:"accuracy"`
	QuestionsAnswered       int  `json:"questions_answered"`
}

type LevelRanking struct {
	FirstAttempt int `json:"accuracy"`
}

// RankingsResponse - Respuesta completa de rankings
type RankingsResponse struct {
	TopByTests                    []RankingItem            `json:"top_by_tests"`
	TopByAvgTimeTakenPerQuestion  AttemptRankings          `json:"top_by_avg_time_taken_per_question"`
	TopByAccuracy                 AttemptRankings          `json:"top_by_accuracy"`
	TopByQuestionsAnswered        AttemptRankings          `json:"top_by_questions_answered"`
	TopByLevels                   map[string][]RankingItem `json:"top_by_levels"`
	TopByLevelsAccuracy           map[string][]RankingItem `json:"top_by_levels_accuracy"`
	CurrentUserPosition           CurrentUserPositions     `json:"current_user_positions"`
	CommunityAverages             CommunityAverages        `json:"community_averages"`
	MinTestsForRanking            int                      `json:"min_tests_for_ranking"`
}

// DashboardStats - Respuesta del dashboard
type DashboardStats struct {
	PersonalData     PersonalData                  `json:"personal_data"`
	LevelData        map[string]LevelData          `json:"level_data"`
	TotalActiveUsers int                           `json:"total_active_users"`
}