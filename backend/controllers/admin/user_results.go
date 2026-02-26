package admin

import (
	"encoding/json"
	"net/http"
	"time"
	"math"
	"fmt"
	"strings"

	"angotest/config"
	"angotest/models"

	"github.com/gin-gonic/gin"
)

// Estructura para la solicitud de filtros
type UserResultsRequest struct {
	Page     int    `form:"page" binding:"omitempty,min=1"`
	PageSize int    `form:"page_size" binding:"omitempty,min=1,max=100"`
	Status   string `form:"status" binding:"omitempty,oneof=all completed in_progress"`
	SortBy   string `form:"sort_by" binding:"omitempty,oneof=started_at updated_at t_created_at title level average_score time_taken"`
	SortOrder string `form:"sort_order" binding:"omitempty,oneof=asc desc"`
	Search   string `form:"search" binding:"omitempty"`
	Level    string `form:"level" binding:"omitempty"`
	MainTopic string `form:"main_topic" binding:"omitempty"`
	SubTopic  string `form:"sub_topic" binding:"omitempty"`
	FromDate string `form:"from_date" binding:"omitempty"`
	ToDate   string `form:"to_date" binding:"omitempty"`
}

// Estructura para respuesta de resultados del usuario (similar a AdminResultItem)
type UserResultItem struct {
	// Result
	ResultID      uint      `json:"id"`
	TestID        uint      `json:"test_id"`
	CorrectAnswers int      `json:"correct_answers"`
	WrongAnswers   int      `json:"wrong_answers"`
	TotalQuestions int      `json:"total_questions"`
	Score          float64  `json:"score"`
	TimeTaken      int      `json:"time_taken"` // en segundos
	Status         string   `json:"status"`
	StartedAt     time.Time `json:"started_at"`
	UpdatedAt     time.Time `json:"updated_at"`
	
	// Test
	Title         string    `json:"test_title"`
	Description   string    `json:"test_description,omitempty"`
	MainTopic     string    `json:"test_main_topic"`
	SubTopic      string    `json:"test_sub_topic"`
	SpecificTopic string    `json:"test_specific_topic"`
	Level         string    `json:"test_level"`
	CreatedAt     time.Time `json:"test_created_at"`
	
	// Additional
	AnsweredCount int `json:"answered_count"`
}

// Estructura para respuesta de resultados del usuario (formato similar a AdminResultsResponse)
type UserResultsResponse struct {
	User             gin.H           `json:"user"`
	Results          []UserResultItem `json:"results"`
	FiltersApplied   gin.H           `json:"filters_applied"`
	AvailableFilters gin.H           `json:"available_filters"`
	Stats            gin.H           `json:"stats"`
}

// Obtener resultados de tests de un usuario específico
func GetUserResults(c *gin.Context) {
	userID := c.Param("user_id")
	
	// Verificar que el usuario existe
	var user models.User
	if err := config.DB.Select("id, username, email, first_name, last_name, role, registered_at").
		First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "usuario no encontrado"})
		return
	}

	var req UserResultsRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Valores por defecto
	if req.Page == 0 { req.Page = 1 }
	if req.PageSize == 0 { req.PageSize = 20 }
	if req.SortBy == "" { req.SortBy = "updated_at" }
	if req.SortOrder == "" { req.SortOrder = "desc" }

	// Construir consulta base para resultados filtrados
	baseQuery := `
		SELECT 
			r.id as result_id,
			r.test_id,
			r.correct_answers,
			r.wrong_answers,
			r.time_taken,
			r.status,
			r.answers,
			r.started_at,
			r.updated_at,
			t.title,
			t.description,
			t.main_topic,
			t.sub_topic,
			t.specific_topic,
			t.level,
			t.created_at,
			(SELECT COUNT(*) FROM questions q WHERE q.test_id = t.id) as total_questions
		FROM results r
		JOIN tests t ON t.id = r.test_id
		WHERE r.user_id = ?
	`

	var queryParams []interface{}
	queryParams = append(queryParams, userID)
	
	// Construir condiciones dinámicamente
	var conditions []string
	
	if req.Status != "" && req.Status != "all" {
		conditions = append(conditions, "r.status = ?")
		queryParams = append(queryParams, req.Status)
	}
	
	if req.Level != "" {
		conditions = append(conditions, "t.level = ?")
		queryParams = append(queryParams, req.Level)
	}
	
	if req.MainTopic != "" {
		conditions = append(conditions, "t.main_topic = ?")
		queryParams = append(queryParams, req.MainTopic)
	}
	
	if req.SubTopic != "" {
		conditions = append(conditions, "t.sub_topic = ?")
		queryParams = append(queryParams, req.SubTopic)
	}
	
	if req.Search != "" {
		conditions = append(conditions, "(t.title ILIKE ? OR t.description ILIKE ?)")
		searchPattern := "%" + req.Search + "%"
		queryParams = append(queryParams, searchPattern, searchPattern)
	}
	
	if req.FromDate != "" {
		if fromDate, err := time.Parse("2006-01-02", req.FromDate); err == nil {
			conditions = append(conditions, "r.started_at >= ?")
			queryParams = append(queryParams, fromDate)
		}
	}
	
	if req.ToDate != "" {
		if toDate, err := time.Parse("2006-01-02", req.ToDate); err == nil {
			nextDay := toDate.Add(24 * time.Hour)
			conditions = append(conditions, "r.started_at < ?")
			queryParams = append(queryParams, nextDay)
		}
	}
	
	// Aplicar condiciones
	if len(conditions) > 0 {
		baseQuery += " AND " + strings.Join(conditions, " AND ")
	}
	
	// ===== CONTAR TOTAL DE RESULTADOS (sin filtros) =====
	var totalResults int64
	countAllQuery := "SELECT COUNT(*) FROM results WHERE user_id = ?"
	if err := config.DB.Raw(countAllQuery, userID).Scan(&totalResults).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "error al contar total de resultados: " + err.Error()})
		return
	}
	
	// ===== CONTAR RESULTADOS FILTRADOS =====
	countFilteredQuery := "SELECT COUNT(*) FROM results r JOIN tests t ON t.id = r.test_id WHERE r.user_id = ?"
	countFilteredParams := []interface{}{userID}
	
	if len(conditions) > 0 {
		countFilteredQuery += " AND " + strings.Join(conditions, " AND ")
		countFilteredParams = append(countFilteredParams, queryParams[1:]...)
	}
	
	var totalFilteredResults int64
	if err := config.DB.Raw(countFilteredQuery, countFilteredParams...).Scan(&totalFilteredResults).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "error al contar resultados filtrados: " + err.Error()})
		return
	}
	
	// Aplicar ordenación
	orderClause := "ORDER BY "
	switch req.SortBy {
	case "average_score":
		orderClause += "(r.correct_answers::float / NULLIF((SELECT COUNT(*) FROM questions WHERE test_id = t.id), 0) * 100) " + req.SortOrder
	case "title":
		orderClause += "t.title " + req.SortOrder
	case "level":
		orderClause += "t.level " + req.SortOrder
	case "t_created_at":
		orderClause += "t.created_at " + req.SortOrder
	case "time_taken":
		orderClause += "r.time_taken " + req.SortOrder
	default:
		orderClause += "r." + req.SortBy + " " + req.SortOrder
	}
	
	baseQuery += " " + orderClause
	
	// Aplicar paginación
	offset := (req.Page - 1) * req.PageSize
	baseQuery += " LIMIT ? OFFSET ?"
	queryParams = append(queryParams, req.PageSize, offset)
	
	// Ejecutar consulta principal
	var results []struct {
		ResultID       uint      `gorm:"column:result_id"`
		TestID         uint      `gorm:"column:test_id"`
		Title          string    `gorm:"column:title"`
		Description    string    `gorm:"column:description"`
		MainTopic      string    `gorm:"column:main_topic"`
		SubTopic       string    `gorm:"column:sub_topic"`
		SpecificTopic  string    `gorm:"column:specific_topic"`
		Level          string    `gorm:"column:level"`
		TotalQuestions int       `gorm:"column:total_questions"`
		CorrectAnswers int       `gorm:"column:correct_answers"`
		WrongAnswers   int       `gorm:"column:wrong_answers"`
		TimeTaken      int       `gorm:"column:time_taken"`
		Status         string    `gorm:"column:status"`
		Answers        string    `gorm:"column:answers"`
		StartedAt      time.Time `gorm:"column:started_at"`
		UpdatedAt      time.Time `gorm:"column:updated_at"`
		CreatedAt      time.Time `gorm:"column:t_created_at"`
	}
	
	if err := config.DB.Raw(baseQuery, queryParams...).Scan(&results).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "error al obtener resultados: " + err.Error()})
		return
	}
	
	// Convertir resultados
	userResults := make([]UserResultItem, len(results))
	for i, r := range results {
		score := 0.0
		if r.TotalQuestions > 0 {
			score = float64(r.CorrectAnswers) / float64(r.TotalQuestions) * 100
		}
		
		// Calcular answered_count
		answeredCount := 0
		if r.Status == "completed" {
			answeredCount = r.CorrectAnswers + r.WrongAnswers
		} else if r.Status == "in_progress" && r.Answers != "" {
			var answers map[uint]uint
			if err := json.Unmarshal([]byte(r.Answers), &answers); err == nil {
				answeredCount = len(answers)
			}
		}
		
		userResults[i] = UserResultItem{
			ResultID:       r.ResultID,
			TestID:         r.TestID,
			Title:          r.Title,
			Description:    r.Description,
			MainTopic:      r.MainTopic,
			SubTopic:       r.SubTopic,
			SpecificTopic:  r.SpecificTopic,
			Level:          r.Level,
			TotalQuestions: r.TotalQuestions,
			CorrectAnswers: r.CorrectAnswers,
			WrongAnswers:   r.WrongAnswers,
			Score:          math.Round(score*10) / 10,
			TimeTaken:      r.TimeTaken,
			Status:         r.Status,
			StartedAt:      r.StartedAt,
			UpdatedAt:      r.UpdatedAt,
			CreatedAt:      r.CreatedAt,
			AnsweredCount:  answeredCount,
		}
	}
	
	// Obtener estadísticas detalladas (usando los mismos filtros)
	var stats struct {
		CompletedTests    int64   `gorm:"column:completed_tests"`
		InProgressTests   int64   `gorm:"column:in_progress_tests"`
		TotalTimeSpent    int64   `gorm:"column:total_time_spent"`
		TotalQuestionsAnswered int64 `gorm:"column:total_questions"`
		TotalCorrectAnswers    int64 `gorm:"column:total_correct"`
	}
	
	statsQuery := `
		SELECT 
			SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tests,
			SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_tests,
			COALESCE(SUM(time_taken), 0) as total_time_spent,
			COALESCE(SUM(CASE WHEN status = 'completed' THEN correct_answers + wrong_answers ELSE 0 END), 0) as total_questions,
			COALESCE(SUM(CASE WHEN status = 'completed' THEN correct_answers ELSE 0 END), 0) as total_correct
		FROM results
		WHERE user_id = ?
	`
	
	statsParams := []interface{}{userID}
	
	// Aplicar mismos filtros a estadísticas
	var statsConditions []string
	if req.Status != "" && req.Status != "all" {
		statsConditions = append(statsConditions, "status = ?")
		statsParams = append(statsParams, req.Status)
	}
	
	if req.FromDate != "" {
		if fromDate, err := time.Parse("2006-01-02", req.FromDate); err == nil {
			statsConditions = append(statsConditions, "started_at >= ?")
			statsParams = append(statsParams, fromDate)
		}
	}
	
	if req.ToDate != "" {
		if toDate, err := time.Parse("2006-01-02", req.ToDate); err == nil {
			nextDay := toDate.Add(24 * time.Hour)
			statsConditions = append(statsConditions, "started_at < ?")
			statsParams = append(statsParams, nextDay)
		}
	}
	
	if len(statsConditions) > 0 {
		statsQuery += " AND " + strings.Join(statsConditions, " AND ")
	}
	
	if err := config.DB.Raw(statsQuery, statsParams...).Scan(&stats).Error; err != nil {
		fmt.Printf("Error obteniendo estadísticas: %v\n", err)
	}

	// Calcular promedio de score
	avgScore := 0.0
	if stats.CompletedTests > 0 && stats.TotalQuestionsAnswered > 0 {
		avgScore = float64(stats.TotalCorrectAnswers) / float64(stats.TotalQuestionsAnswered) * 100
		avgScore = math.Round(avgScore*10) / 10
	}

	// Obtener topics disponibles para filtros
	mainTopics, _ := models.GetMainTopics()

	// Construir respuesta en el formato deseado
	response := UserResultsResponse{
		User: gin.H{
			"id":           user.ID,
			"username":     user.Username,
			"email":        user.Email,
			"first_name":   user.FirstName,
			"last_name":    user.LastName,
			"role":         user.Role,
			"registered_at": user.RegisteredAt,
		},
		Results: userResults,
		FiltersApplied: gin.H{
			"page":        req.Page,
			"page_size":   req.PageSize,
			"sort_by":     req.SortBy,
			"sort_order":  req.SortOrder,
			"status":      req.Status,
			"level":       req.Level,
			"main_topic":  req.MainTopic,
			"sub_topic":   req.SubTopic,
			"from_date":   req.FromDate,
			"to_date":     req.ToDate,
			"search":      req.Search,
		},
		AvailableFilters: gin.H{
			"main_topics": mainTopics,
			"levels":      models.GetPredefinedLevels(),
			"statuses":    []string{"all", "completed", "in_progress"},
		},
		Stats: gin.H{
			"total_results":           totalResults,
			"total_filtered_results":  totalFilteredResults,
			"completed_tests":         stats.CompletedTests,
			"in_progress_tests":       stats.InProgressTests,
			"average_score":           avgScore,
			"total_time_spent":        stats.TotalTimeSpent,
			"total_questions_answered": stats.TotalQuestionsAnswered,
			"total_correct_answers":   stats.TotalCorrectAnswers,
		},
	}

	c.JSON(http.StatusOK, response)
}

// Obtener detalles específicos de un resultado - Adaptado para Angular
func GetUserResultDetails(c *gin.Context) {
	userID := c.Param("user_id")
	resultID := c.Param("result_id")

	// 1. Obtener resultado, test y usuario en una consulta
	var resultData struct {
		models.Result
		TestTitle        string    `gorm:"column:test_title"`
		TestDescription  string    `gorm:"column:test_description"`
		MainTopic        string    `gorm:"column:main_topic"`
		SubTopic         string    `gorm:"column:sub_topic"`
		SpecificTopic    string    `gorm:"column:specific_topic"`
		Level            string    `gorm:"column:level"`
		TestCreatedAt    time.Time `gorm:"column:test_created_at"`
		Username         string    `gorm:"column:username"`
		Role			 string    `gorm:"column:role"`
		Email            string    `gorm:"column:email"`
		FirstName        string    `gorm:"column:first_name"`
		LastName         string    `gorm:"column:last_name"`
		RegisteredAt       time.Time `gorm:"column:registered_at"`
	}

	if err := config.DB.Table("results").
		Select(`
			results.*,
			tests.title as test_title,
			tests.description as test_description,
			tests.main_topic,
			tests.sub_topic,
			tests.specific_topic,
			tests.level,
			tests.created_at as test_created_at,
			users.username,
			users.role,
			users.email,
			users.first_name,
			users.last_name,
			users.registered_at
		`).
		Joins("INNER JOIN tests ON tests.id = results.test_id").
		Joins("INNER JOIN users ON users.id = results.user_id").
		Where("results.id = ? AND results.user_id = ?", resultID, userID).
		First(&resultData).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "resultado no encontrado"})
		return
	}

	// 2. Parsear respuestas del usuario (NUEVO FORMATO - MAPA)
	userAnswers := make(map[uint]uint)
	if resultData.Answers != "" {
		var answersMap map[uint]uint
		if err := json.Unmarshal([]byte(resultData.Answers), &answersMap); err == nil {
			userAnswers = answersMap
		} else {
			// Log del error pero continuamos (puede que esté vacío)
			fmt.Printf("Error parseando respuestas: %v\n", err)
		}
	}

	// 3. Obtener todas las preguntas con sus respuestas en UNA consulta
	var questionResults []struct {
		QuestionID    uint   `gorm:"column:question_id"`
		QuestionText  string `gorm:"column:question_text"`
		AnswerID      uint   `gorm:"column:answer_id"`
		AnswerText    string `gorm:"column:answer_text"`
		IsCorrect     bool   `gorm:"column:is_correct"`
	}

	if err := config.DB.Table("questions").
		Select(`
			questions.id as question_id,
			questions.question_text,
			answers.id as answer_id,
			answers.answer_text,
			answers.is_correct
		`).
		Joins("LEFT JOIN answers ON answers.question_id = questions.id").
		Where("questions.test_id = ?", resultData.TestID).
		Order("questions.id ASC, answers.id ASC").
		Scan(&questionResults).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "error al obtener preguntas"})
		return
	}

	// 4. Procesar datos en memoria
	type AnswerDetail struct {
		ID         uint   `json:"id"`
		AnswerText string `json:"answer_text"`
		IsCorrect  bool   `json:"is_correct"`
	}

	type QuestionDetail struct {
		ID           uint          `json:"id"`
		QuestionText string        `json:"question_text"`
		Answers      []AnswerDetail `json:"answers"`
	}

	questionDetails := make([]QuestionDetail, 0)
	
	var currentQuestion *QuestionDetail
	
	for _, row := range questionResults {
		// Nueva pregunta
		if currentQuestion == nil || currentQuestion.ID != row.QuestionID {
			if currentQuestion != nil {
				questionDetails = append(questionDetails, *currentQuestion)
			}
			
			currentQuestion = &QuestionDetail{
				ID:           row.QuestionID,
				QuestionText: row.QuestionText,
				Answers:      make([]AnswerDetail, 0),
			}
		}
		
		// Agregar respuesta (solo si tiene ID, para evitar respuestas nulas)
		if row.AnswerID > 0 {
			currentQuestion.Answers = append(currentQuestion.Answers, AnswerDetail{
				ID:         row.AnswerID,
				AnswerText: row.AnswerText,
				IsCorrect:  row.IsCorrect,
			})
		}
	}
	
	// Agregar la última pregunta
	if currentQuestion != nil {
		questionDetails = append(questionDetails, *currentQuestion)
	}

	// 5. Preparar respuesta según estructura Angular
	response := gin.H{
		"result": gin.H{
			"id":              resultData.ID,
			"user_id":         resultData.UserID,
			"test_id":         resultData.TestID,
			"correct_answers": resultData.CorrectAnswers,
			"wrong_answers":   resultData.WrongAnswers,
			"time_taken":      resultData.TimeTaken,
			"status":          resultData.Status,
			"answered_questions": userAnswers, // Usar el mapa directamente
			"started_at":      resultData.StartedAt.Format(time.RFC3339),
			"updated_at":      resultData.UpdatedAt.Format(time.RFC3339),
		},
		"user": gin.H{
			"id":         resultData.UserID,
			"username":   resultData.Username,
			"role":	   	  resultData.Role,
			"email":      resultData.Email,
			"first_name": resultData.FirstName,
			"last_name":  resultData.LastName,
		},
		"test": gin.H{
			"id":              resultData.TestID,
			"title":           resultData.TestTitle,
			"description":     resultData.TestDescription,
			"main_topic":      resultData.MainTopic,
			"sub_topic":       resultData.SubTopic,
			"specific_topic":  resultData.SpecificTopic,
			"level":           resultData.Level,
			"created_at":      resultData.TestCreatedAt.Format(time.RFC3339),
		},
		"questions":      questionDetails,
		"total_questions": len(questionDetails),
		"score_details": gin.H{
			"correct": resultData.CorrectAnswers,
			"wrong":   resultData.WrongAnswers,
			"score_percentage": func() float64 {
				if len(questionDetails) > 0 {
					score := float64(resultData.CorrectAnswers) / float64(len(questionDetails)) * 100
					return math.Round(score*10) / 10
				}
				return 0.0
			}(),
		},
	}

	c.JSON(http.StatusOK, response)
}