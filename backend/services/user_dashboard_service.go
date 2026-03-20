package services

import (
	"errors"
	"fmt"
	"strings"

	"angotest/config"
	"angotest/models"
	"angotest/types"
)

type DataService struct{}

// Constantes
const (
	MinTestsForRanking = 5
	
	// Tipos de métricas
	MetricTestsCount      = "completed_tests"
	MetricAvgTime         = "time"
	MetricAccuracy        = "accuracy"
	MetricQuestionsAnswered = "questions_answered"
)

var predefinedLevels = []string{"Principiante", "Intermedio", "Avanzado"}

// GetPersonalData - Obtiene estadísticas personales del usuario
func (ss *DataService) GetPersonalData(userID uint) (types.PersonalData, error) {
	var data types.PersonalData
	
	var results struct {
		TotalCompletedAllAttempts          int64   `gorm:"column:total_completed_all_attempts"`
		TotalInProgress                    int64   `gorm:"column:total_in_progress"`
		TotalExpired                       int64   `gorm:"column:total_expired"`
		
		// All Attempts
		AllAttemptsTestsCount              int64   `gorm:"column:all_attempts_tests_count"`
		AllAttemptsCorrect                 int64   `gorm:"column:all_attempts_correct"`
		AllAttemptsWrong                   int64   `gorm:"column:all_attempts_wrong"`
		AllAttemptsTimeTaken               int64   `gorm:"column:all_attempts_time_taken"`
		AllAttemptsQuestionsAnswered       int64   `gorm:"column:all_attempts_questions_answered"`
		
		// First Attempt
		FirstAttemptTestsCount             int64   `gorm:"column:first_attempt_tests_count"`
		FirstAttemptCorrect                int64   `gorm:"column:first_attempt_correct"`
		FirstAttemptWrong                  int64   `gorm:"column:first_attempt_wrong"`
		FirstAttemptTimeTaken              int64   `gorm:"column:first_attempt_time_taken"`
		FirstAttemptQuestionsAnswered      int64   `gorm:"column:first_attempt_questions_answered"`
	}

	query := `
		WITH 
		first_attempt_timestamps AS (
			SELECT 
				r.user_id,
				r.test_id,
				MIN(r.updated_at) as first_updated
			FROM results r
			WHERE r.status = 'completed'
			GROUP BY r.user_id, r.test_id
		),
		status_counts AS (
			SELECT 
				COUNT(CASE WHEN status = 'completed' THEN 1 END) as total_completed_all_attempts,
				COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as total_in_progress,
				COUNT(CASE WHEN status = 'expired' THEN 1 END) as total_expired
			FROM results 
			WHERE user_id = ?
		),
		all_attempts_data AS (
			SELECT 
				COUNT(r.test_id) as all_attempts_tests_count,
				COALESCE(SUM(r.correct_answers), 0) as all_attempts_correct,
				COALESCE(SUM(r.wrong_answers), 0) as all_attempts_wrong,
				COALESCE(SUM(r.time_taken), 0) as all_attempts_time_taken,
				COALESCE(SUM(r.correct_answers + r.wrong_answers), 0) as all_attempts_questions_answered
			FROM results r
			WHERE r.user_id = ? AND r.status = 'completed'
		),
		first_attempt_data AS (
			SELECT 
				COUNT(DISTINCT r.test_id) as first_attempt_tests_count,
				COALESCE(SUM(r.correct_answers), 0) as first_attempt_correct,
				COALESCE(SUM(r.wrong_answers), 0) as first_attempt_wrong,
				COALESCE(SUM(r.time_taken), 0) as first_attempt_time_taken,
				COALESCE(SUM(r.correct_answers + r.wrong_answers), 0) as first_attempt_questions_answered
			FROM results r
			INNER JOIN first_attempt_timestamps fa ON r.user_id = fa.user_id 
				AND r.test_id = fa.test_id 
				AND r.updated_at = fa.first_updated
			WHERE r.user_id = ? AND r.status = 'completed'
		)
		SELECT * FROM status_counts, all_attempts_data, first_attempt_data`

	err := config.DB.Raw(query, userID, userID, userID).Scan(&results).Error
	if err != nil {
		return data, err
	}

	// Asignar valores
	data.CompletedTests = int(results.TotalCompletedAllAttempts)
	data.InProgressTests = int(results.TotalInProgress)
	data.ExpiredTests = int(results.TotalExpired)
	
	data.AllAttempts = types.AttemptDataCategory{
		TestsCount:             int(results.AllAttemptsTestsCount),
		TotalCorrect:           int(results.AllAttemptsCorrect),
		TotalWrong:             int(results.AllAttemptsWrong),
		TotalTimeTaken:         int(results.AllAttemptsTimeTaken),
		TotalQuestionsAnswered: int(results.AllAttemptsQuestionsAnswered),
	}
	
	data.FirstAttempt = types.AttemptDataCategory{
		TestsCount:             int(results.FirstAttemptTestsCount),
		TotalCorrect:           int(results.FirstAttemptCorrect),
		TotalWrong:             int(results.FirstAttemptWrong),
		TotalTimeTaken:         int(results.FirstAttemptTimeTaken),
		TotalQuestionsAnswered: int(results.FirstAttemptQuestionsAnswered),
	}
	
	return data, nil
}

// GetPersonalLevelData - Obtiene estadísticas por nivel del usuario
func (ss *DataService) GetPersonalLevelData(userID uint) (map[string]types.LevelData, error) {
	levelData := make(map[string]types.LevelData)
	
	var results []struct {
		Level                  string  `gorm:"column:level"`
		IsFirstAttempt         bool    `gorm:"column:is_first_attempt"`
		TestsCount             int64   `gorm:"column:tests_count"`
		QuestionsCount         int64   `gorm:"column:questions_count"`
		TotalCorrect           int64   `gorm:"column:total_correct"`
		TotalWrong             int64   `gorm:"column:total_wrong"`
		TotalTimeTaken         int64   `gorm:"column:total_time_taken"`
	}

	query := `
		WITH 
		first_attempt AS (
			SELECT 
				r.user_id,
				r.test_id,
				MIN(r.updated_at) as first_updated
			FROM results r
			WHERE r.status = 'completed'
			GROUP BY r.user_id, r.test_id
		),
		all_level_data AS (
			SELECT 
				t.level,
				false as is_first_attempt,
				COUNT(DISTINCT r.test_id) as tests_count,
				COALESCE(SUM(r.correct_answers + r.wrong_answers), 0) as questions_count,
				COALESCE(SUM(r.correct_answers), 0) as total_correct,
				COALESCE(SUM(r.wrong_answers), 0) as total_wrong,
				COALESCE(SUM(r.time_taken), 0) as total_time_taken
			FROM results r
			JOIN tests t ON r.test_id = t.id
			WHERE r.user_id = ? AND t.level IN (?, ?, ?) AND r.status = 'completed'
			GROUP BY t.level
			
			UNION ALL
			
			SELECT 
				t.level,
				true as is_first_attempt,
				COUNT(DISTINCT r.test_id) as tests_count,
				COALESCE(SUM(r.correct_answers + r.wrong_answers), 0) as questions_count,
				COALESCE(SUM(r.correct_answers), 0) as total_correct,
				COALESCE(SUM(r.wrong_answers), 0) as total_wrong,
				COALESCE(SUM(r.time_taken), 0) as total_time_taken
			FROM results r
			JOIN tests t ON r.test_id = t.id
			INNER JOIN first_attempt fa ON r.user_id = fa.user_id 
				AND r.test_id = fa.test_id 
				AND r.updated_at = fa.first_updated
			WHERE r.user_id = ? AND t.level IN (?, ?, ?) AND r.status = 'completed'
			GROUP BY t.level
		)
		SELECT * FROM all_level_data ORDER BY level, is_first_attempt`

	err := config.DB.Raw(query, 
		userID, "Principiante", "Intermedio", "Avanzado",
		userID, "Principiante", "Intermedio", "Avanzado",
	).Scan(&results).Error
	
	if err != nil {
		return nil, err
	}
	
	levelAttemptData := make(map[string]map[bool]types.LevelAttemptData)
	
	for _, result := range results {
		data := types.LevelAttemptData{
			TestsCount:     int(result.TestsCount),
			QuestionsCount: int(result.QuestionsCount),
			TotalCorrect:   int(result.TotalCorrect),
			TotalWrong:     int(result.TotalWrong),
			TotalTimeTaken: int(result.TotalTimeTaken),
		}
		
		if _, exists := levelAttemptData[result.Level]; !exists {
			levelAttemptData[result.Level] = make(map[bool]types.LevelAttemptData)
		}
		levelAttemptData[result.Level][result.IsFirstAttempt] = data
	}
	
	for _, level := range predefinedLevels {
		firstAttempt := types.LevelAttemptData{}
		allAttempts := types.LevelAttemptData{}
		
		if data, exists := levelAttemptData[level]; exists {
			if data, hasFirst := data[true]; hasFirst {
				firstAttempt = data
			}
			if data, hasAll := data[false]; hasAll {
				allAttempts = data
			}
		}
		
		levelData[level] = types.LevelData{
			FirstAttempt: firstAttempt,
			AllAttempts:  allAttempts,
		}
	}
	
	return levelData, nil
}

// GetTotalUsers - Obtiene total de usuarios en el sistema
func (ss *DataService) GetTotalUsers() (int, error) {
	var total int64
	err := config.DB.Model(&models.User{}).Count(&total).Error
	return int(total), err
}

// GetActiveUsersCount - Obtiene usuarios con al menos MinTestsForRanking tests diferentes completados
func (ss *DataService) GetActiveUsersCount() (int, error) {
	var count int64
	err := config.DB.Raw(`
		SELECT COUNT(DISTINCT user_id) 
		FROM (
			SELECT user_id
			FROM results 
			WHERE status = 'completed'
			GROUP BY user_id
			HAVING COUNT(DISTINCT test_id) >= ?
		) as active_users
	`, MinTestsForRanking).Scan(&count).Error
	return int(count), err
}

// GetCommunityAverages - Obtiene promedios de la comunidad
func (ss *DataService) GetCommunityAverages() (types.CommunityAverages, error) {
	var dbResult struct {
		AvgTimeTakenPerQuestionAll    float64 `gorm:"column:avg_time_taken_per_question_all"`
		AvgTimeTakenPerQuestionFirst  float64 `gorm:"column:avg_time_taken_per_question_first"`
		AvgAccuracyAll                float64 `gorm:"column:avg_accuracy_all"`
		AvgAccuracyFirst              float64 `gorm:"column:avg_accuracy_first"`
		AvgQuestionsPerUserAll        float64 `gorm:"column:avg_questions_per_user_all"`
		AvgQuestionsPerUserFirst      float64 `gorm:"column:avg_questions_per_user_first"`
	}
	
	err := config.DB.Raw(`
		WITH user_stats AS (
			SELECT 
				user_id,
				SUM(time_taken) as total_time_all,
				SUM(correct_answers + wrong_answers) as total_questions_all,
				SUM(correct_answers) as total_correct_all,
				COUNT(DISTINCT test_id) as total_tests
			FROM results 
			WHERE status = 'completed' AND correct_answers + wrong_answers > 0
			GROUP BY user_id
			HAVING COUNT(DISTINCT test_id) >= ?
		),
		first_attempt_stats AS (
			SELECT 
				r.user_id,
				SUM(r.time_taken) as total_time_first,
				SUM(r.correct_answers + r.wrong_answers) as total_questions_first,
				SUM(r.correct_answers) as total_correct_first
			FROM results r
			WHERE r.status = 'completed' 
				AND (r.user_id, r.test_id, r.updated_at) IN (
					SELECT 
						user_id,
						test_id,
						MIN(updated_at)
					FROM results 
					WHERE status = 'completed'
					GROUP BY user_id, test_id
				)
			GROUP BY r.user_id
			HAVING SUM(r.correct_answers + r.wrong_answers) > 0
		)
		SELECT 
			COALESCE(AVG(us.total_time_all::float / NULLIF(us.total_questions_all, 0)), 0) as avg_time_taken_per_question_all,
			COALESCE(AVG(fas.total_time_first::float / NULLIF(fas.total_questions_first, 0)), 0) as avg_time_taken_per_question_first,
			COALESCE(AVG(us.total_correct_all * 100.0 / NULLIF(us.total_questions_all, 0)), 0) as avg_accuracy_all,
			COALESCE(AVG(fas.total_correct_first * 100.0 / NULLIF(fas.total_questions_first, 0)), 0) as avg_accuracy_first,
			COALESCE(AVG(us.total_questions_all), 0) as avg_questions_per_user_all,
			COALESCE(AVG(fas.total_questions_first), 0) as avg_questions_per_user_first
		FROM user_stats us
		LEFT JOIN first_attempt_stats fas ON us.user_id = fas.user_id
	`, MinTestsForRanking).Scan(&dbResult).Error
	
	if err != nil {
		return types.CommunityAverages{}, err
	}
	
	averages := types.CommunityAverages{
		AllAttempts: types.CommunityAveragesData{
			AvgTimeTakenPerQuestion: dbResult.AvgTimeTakenPerQuestionAll,
			AvgAccuracy:             dbResult.AvgAccuracyAll,
			AvgQuestionsPerUser:     dbResult.AvgQuestionsPerUserAll,
		},
		FirstAttempt: types.CommunityAveragesData{
			AvgTimeTakenPerQuestion: dbResult.AvgTimeTakenPerQuestionFirst,
			AvgAccuracy:             dbResult.AvgAccuracyFirst,
			AvgQuestionsPerUser:     dbResult.AvgQuestionsPerUserFirst,
		},
		Levels: make(map[string]types.CommunityLevelAverages),
	}
	
	// Llenar datos por nivel
	levelStats, err := ss.GetCommunityLevelStats()
	if err == nil {
		averages.Levels = levelStats
	}
	
	return averages, nil
}

// GetCommunityLevelStats - Obtiene estadísticas de comunidad por nivel
func (ss *DataService) GetCommunityLevelStats() (map[string]types.CommunityLevelAverages, error) {
	var statsByLevel []struct {
		Level                       string  `gorm:"column:level"`
		AvgTimeTakenPerQuestionAll  float64 `gorm:"column:avg_time_taken_per_question_all"`
		AvgTimeTakenPerQuestionFirst float64 `gorm:"column:avg_time_taken_per_question_first"`
		AvgAccuracyAll              float64 `gorm:"column:avg_accuracy_all"`
		AvgAccuracyFirst            float64 `gorm:"column:avg_accuracy_first"`
		AvgQuestionsPerUserAll      float64 `gorm:"column:avg_questions_per_user_all"`
		AvgQuestionsPerUserFirst    float64 `gorm:"column:avg_questions_per_user_first"`
	}
	
	err := config.DB.Raw(`
		WITH first_attempt AS (
			SELECT 
				user_id,
				test_id,
				MIN(updated_at) as first_updated
			FROM results 
			WHERE status = 'completed'
			GROUP BY user_id, test_id
		),
		user_level_stats AS (
			SELECT 
				t.level,
				r.user_id,
				SUM(r.time_taken) as total_time_all,
				SUM(r.correct_answers + r.wrong_answers) as total_questions_all,
				SUM(r.correct_answers) as total_correct_all,
				COUNT(DISTINCT r.test_id) as total_tests
			FROM results r
			JOIN tests t ON r.test_id = t.id
			WHERE r.status = 'completed' 
				AND t.level IN ('Principiante', 'Intermedio', 'Avanzado')
				AND r.correct_answers + r.wrong_answers > 0
			GROUP BY t.level, r.user_id
			HAVING COUNT(DISTINCT r.test_id) > 0
		),
		user_level_first_attempt AS (
			SELECT 
				t.level,
				r.user_id,
				SUM(r.time_taken) as total_time_first,
				SUM(r.correct_answers + r.wrong_answers) as total_questions_first,
				SUM(r.correct_answers) as total_correct_first
			FROM results r
			JOIN tests t ON r.test_id = t.id
			INNER JOIN first_attempt fa ON r.user_id = fa.user_id 
				AND r.test_id = fa.test_id 
				AND r.updated_at = fa.first_updated
			WHERE r.status = 'completed'
				AND t.level IN ('Principiante', 'Intermedio', 'Avanzado')
				AND r.correct_answers + r.wrong_answers > 0
			GROUP BY t.level, r.user_id
		)
		SELECT 
			uls.level,
			COALESCE(AVG(uls.total_time_all::float / NULLIF(uls.total_questions_all, 0)), 0) as avg_time_taken_per_question_all,
			COALESCE(AVG(ulf.total_time_first::float / NULLIF(ulf.total_questions_first, 0)), 0) as avg_time_taken_per_question_first,
			COALESCE(AVG(uls.total_correct_all * 100.0 / NULLIF(uls.total_questions_all, 0)), 0) as avg_accuracy_all,
			COALESCE(AVG(ulf.total_correct_first * 100.0 / NULLIF(ulf.total_questions_first, 0)), 0) as avg_accuracy_first,
			COALESCE(AVG(uls.total_questions_all), 0) as avg_questions_per_user_all,
			COALESCE(AVG(ulf.total_questions_first), 0) as avg_questions_per_user_first
		FROM user_level_stats uls
		LEFT JOIN user_level_first_attempt ulf ON uls.level = ulf.level AND uls.user_id = ulf.user_id
		GROUP BY uls.level
		ORDER BY 
			CASE uls.level
				WHEN 'Principiante' THEN 1
				WHEN 'Intermedio' THEN 2
				WHEN 'Avanzado' THEN 3
				ELSE 4
			END
	`).Scan(&statsByLevel).Error
	
	if err != nil {
		return nil, err
	}
	
	levelStats := make(map[string]types.CommunityLevelAverages)
	for _, s := range statsByLevel {
		levelStats[s.Level] = types.CommunityLevelAverages{
			AllAttempts: types.CommunityAveragesData{
				AvgTimeTakenPerQuestion: s.AvgTimeTakenPerQuestionAll,
				AvgAccuracy:             s.AvgAccuracyAll,
				AvgQuestionsPerUser:     s.AvgQuestionsPerUserAll,
			},
			FirstAttempt: types.CommunityAveragesData{
				AvgTimeTakenPerQuestion: s.AvgTimeTakenPerQuestionFirst,
				AvgAccuracy:             s.AvgAccuracyFirst,
				AvgQuestionsPerUser:     s.AvgQuestionsPerUserFirst,
			},
		}
	}
	
	// Asegurar que todos los niveles existan en el mapa
	for _, level := range predefinedLevels {
		if _, exists := levelStats[level]; !exists {
			levelStats[level] = types.CommunityLevelAverages{}
		}
	}
	
	return levelStats, nil
}

// GetUserAllRankingPositions - Obtiene todas las posiciones del usuario en una sola llamada
func (ss *DataService) GetUserAllRankingPositions(userID uint) (types.CurrentUserPositions, error) {
	var positions types.CurrentUserPositions
	positions.Levels = make(map[string]types.LevelRanking)
	
	// Obtener posición en tests completados
	if pos, err := ss.getRankingPositionByMetric(userID, MetricTestsCount, "all", ""); err == nil {
		positions.CompletedTests = pos
	}
	
	// Obtener posición en tiempo promedio
	if pos, err := ss.getRankingPositionByMetric(userID, MetricAvgTime, "all", ""); err == nil {
		positions.AllAttempts.AvgTimeTakenPerQuestion = pos
	}
	if pos, err := ss.getRankingPositionByMetric(userID, MetricAvgTime, "first", ""); err == nil {
		positions.FirstAttempt.AvgTimeTakenPerQuestion = pos
	}
	
	// Obtener posición en precisión
	if pos, err := ss.getRankingPositionByMetric(userID, MetricAccuracy, "all", ""); err == nil {
		positions.AllAttempts.Accuracy = pos
	}
	if pos, err := ss.getRankingPositionByMetric(userID, MetricAccuracy, "first", ""); err == nil {
		positions.FirstAttempt.Accuracy = pos
	}
	
	// Obtener posición en preguntas respondidas
	if pos, err := ss.getRankingPositionByMetric(userID, MetricQuestionsAnswered, "all", ""); err == nil {
		positions.AllAttempts.QuestionsAnswered = pos
	}
	if pos, err := ss.getRankingPositionByMetric(userID, MetricQuestionsAnswered, "first", ""); err == nil {
		positions.FirstAttempt.QuestionsAnswered = pos
	}
	
	// Obtener total usuarios activos
	if count, err := ss.GetActiveUsersCount(); err == nil {
		positions.TotalActiveUsers = count
	}
	
	// Obtener posición por nivel
	for _, level := range predefinedLevels {
		if pos, err := ss.getRankingPositionByMetric(userID, MetricAccuracy, "first", level); err == nil {
			positions.Levels[level] = types.LevelRanking{
				FirstAttempt: pos,
			}
		} else {
			positions.Levels[level] = types.LevelRanking{FirstAttempt: 0}
		}
	}
	
	return positions, nil
}

// getRankingPositionByMetric - Función genérica para obtener posición
func (ss *DataService) getRankingPositionByMetric(userID uint, metricType, attemptType, level string) (int, error) {
	var queryBuilder strings.Builder
	var params []interface{}
	
	queryBuilder.WriteString("WITH user_stats AS (")
	queryBuilder.WriteString("\n	SELECT r.user_id,")
	
	switch metricType {
	case MetricTestsCount:
		queryBuilder.WriteString("\n		COUNT(DISTINCT r.test_id) as metric_value")
	case MetricAvgTime:
		queryBuilder.WriteString(`
			CASE 
				WHEN SUM(r.correct_answers + r.wrong_answers) > 0 
				THEN SUM(r.time_taken) * 1.0 / SUM(r.correct_answers + r.wrong_answers)
				ELSE NULL
			END as metric_value`)
	case MetricAccuracy:
		queryBuilder.WriteString(`
			CASE 
				WHEN SUM(r.correct_answers + r.wrong_answers) > 0 
				THEN SUM(r.correct_answers) * 100.0 / SUM(r.correct_answers + r.wrong_answers)
				ELSE NULL
			END as metric_value`)
	case MetricQuestionsAnswered:
		queryBuilder.WriteString("\n		COALESCE(SUM(r.correct_answers + r.wrong_answers), 0) as metric_value")
	default:
		return 0, errors.New("tipo de métrica no válido")
	}
	
	queryBuilder.WriteString("\n	FROM results r")
	
	if level != "" {
		queryBuilder.WriteString("\n	JOIN tests t ON r.test_id = t.id AND t.level = ?")
		params = append(params, level)
	}
	
	queryBuilder.WriteString("\n	WHERE r.status = 'completed'")
	
	if attemptType == "first" {
		queryBuilder.WriteString(`
			AND (r.user_id, r.test_id, r.updated_at) IN (
				SELECT 
					user_id,
					test_id,
					MIN(updated_at)
				FROM results 
				WHERE status = 'completed'
				GROUP BY user_id, test_id
			)`)
	}
	
	queryBuilder.WriteString("\n	GROUP BY r.user_id")
	
	switch metricType {
	case MetricAvgTime, MetricAccuracy:
		queryBuilder.WriteString(fmt.Sprintf("\n	HAVING SUM(r.correct_answers + r.wrong_answers) > 0 AND COUNT(DISTINCT r.test_id) >= %d", MinTestsForRanking))
	case MetricQuestionsAnswered:
		queryBuilder.WriteString("\n	HAVING COALESCE(SUM(r.correct_answers + r.wrong_answers), 0) > 0")
	default:
		queryBuilder.WriteString("\n	HAVING COUNT(DISTINCT r.test_id) > 0")
	}
	
	queryBuilder.WriteString("\n)")
	queryBuilder.WriteString("\n, ranked_users AS (")
	queryBuilder.WriteString("\n	SELECT user_id,")
	queryBuilder.WriteString("\n		ROW_NUMBER() OVER (ORDER BY metric_value ")
	
	if metricType == MetricAvgTime {
		queryBuilder.WriteString("ASC")
	} else {
		queryBuilder.WriteString("DESC")
	}
	
	queryBuilder.WriteString(") as rank")
	queryBuilder.WriteString("\n	FROM user_stats")
	queryBuilder.WriteString("\n)")
	queryBuilder.WriteString("\nSELECT COALESCE((SELECT rank FROM ranked_users WHERE user_id = ?), 0) as position")
	params = append(params, userID)
	
	var rankPosition int64
	err := config.DB.Raw(queryBuilder.String(), params...).Scan(&rankPosition).Error
	if err != nil {
		return 0, fmt.Errorf("error al obtener posición para métrica %s: %v", metricType, err)
	}
	
	return int(rankPosition), nil
}