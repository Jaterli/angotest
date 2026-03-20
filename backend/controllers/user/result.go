package user

import (
	"encoding/json"
	"net/http"
	"time"
	"fmt"
	"math"
	"sort"

	"angotest/config"
	"angotest/models"

	"github.com/gin-gonic/gin"
  	"gorm.io/gorm"
)


// ====== Guardar o actualizar resultado (para progreso o finalización) ======
type SaveResultInput struct {
	TestID      uint           `json:"test_id" binding:"required"`
	Answers     map[uint]uint  `json:"answers"` // Cambiado a mapa en lugar de array
	TimeTaken   int            `json:"time_taken"`
	Status      string         `json:"status" binding:"required,oneof=in_progress completed expired"`
}

// SaveOrUpdateResult maneja guardado de progreso o finalización de test
func SaveOrUpdateResult(c *gin.Context) {
	var input SaveResultInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userIDIfc, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "no autorizado"})
		return
	}
	userID, ok := userIDIfc.(uint)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "tipo de user_id inválido"})
		return
	}

	// Obtener test para conocer el total de preguntas
	var test models.Test
	if err := config.DB.First(&test, input.TestID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "test no encontrado"})
		return
	}

	// Buscar resultado existente
	var result models.Result
	err := config.DB.Where("user_id = ? AND test_id = ? AND status = 'in_progress'", userID, input.TestID).First(&result).Error

	// Preparar respuestas en formato JSON del mapa
	var answersJSON string
	if input.Answers != nil && len(input.Answers) > 0 {
		answersBytes, err := json.Marshal(input.Answers)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "error al procesar respuestas"})
			return
		}
		answersJSON = string(answersBytes)
	}

	// Variables para cálculo de puntuación
	var correctCount, wrongCount int

	// Si el estado es "completed" y hay respuestas, calcular puntuación
	if input.Status == "completed" && input.Answers != nil && len(input.Answers) > 0 {
		// Obtener respuestas correctas del test
		var questions []models.Question
		if err := config.DB.Preload("Answers").Where("test_id = ?", input.TestID).Find(&questions).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "error al consultar preguntas"})
			return
		}

		// Mapa de respuestas correctas (question_id -> correct_answer_id)
		correctAnswers := make(map[uint]uint)
		for _, q := range questions {
			for _, a := range q.Answers {
				if a.IsCorrect {
					correctAnswers[q.ID] = a.ID
					break // Solo necesitamos la respuesta correcta
				}
			}
		}

		// Calcular respuestas correctas comparando directamente los mapas
		for questionID, userAnswerID := range input.Answers {
			if correctAnswerID, exists := correctAnswers[questionID]; exists {
				if userAnswerID == correctAnswerID {
					correctCount++
				} else {
					wrongCount++
				}
			} else {
				// Si no existe la pregunta en el test, contar como incorrecta
				wrongCount++
			}
		}
	}

	if err != nil {
		// Nuevo resultado
		result = models.Result{
			UserID:         userID,
			TestID:         input.TestID,
			Status:         input.Status,
			TimeTaken:      input.TimeTaken,
			CorrectAnswers: correctCount,
			WrongAnswers:   wrongCount,
			Answers:        answersJSON,
		}

		if err := config.DB.Create(&result).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "error al crear resultado"})
			return
		}
	} else {
		// Actualizar resultado existente
		result.Status = input.Status
		result.TimeTaken = input.TimeTaken
		result.UpdatedAt = time.Now()
		
		if input.Status == "completed" {
			result.CorrectAnswers = correctCount
			result.WrongAnswers = wrongCount
		}
		
		if input.Answers != nil && len(input.Answers) > 0 {
			result.Answers = answersJSON
		}

		if err := config.DB.Save(&result).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "error al actualizar resultado"})
			return
		}
	}

	// Preparar respuesta
	response := gin.H{
		"message":      	"Resultado guardado exitosamente",
		"result_id":    	result.ID,
		"test_id":      	result.TestID,
		"status":		    result.Status,
		"correct_answers":  result.CorrectAnswers,
		"wrong_answers":    result.WrongAnswers,
		"total":      		len(input.Answers),
		"time_taken":  		result.TimeTaken,
		"score_percentage": 0,
	}

	// Calcular porcentaje si hay respuestas
	if len(input.Answers) > 0 {
		response["score_percentage"] = float64(result.CorrectAnswers) / float64(len(input.Answers)) * 100
	}

	c.JSON(http.StatusOK, response)
}


// ====== Obtener progreso actual de un test ======
func GetTestProgress(c *gin.Context) {
	testID := c.Param("test_id")

	userIDIfc, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "no autorizado"})
		return
	}
	userID, ok := userIDIfc.(uint)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "tipo de user_id inválido"})
		return
	}

	// Buscar resultado en progreso
	var result models.Result
	err := config.DB.Where("user_id = ? AND test_id = ? AND status = 'in_progress'", userID, testID).
		First(&result).Error

	if err != nil {
		// No hay progreso guardado, devolver test vacío
		var test models.Test
		if err := config.DB.Preload("Questions.Answers").First(&test, testID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "test no encontrado"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"test":         test,
			"answers":      map[uint]uint{}, // Ahora es un mapa vacío
			"time_elapsed": 0,
			"progress":     0,
			"is_resuming":  false,
		})
		return
	}

	// Obtener test completo
	var test models.Test
	if err := config.DB.Preload("Questions.Answers").First(&test, testID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "test no encontrado"})
		return
	}

	// Decodificar respuestas guardadas
	var savedAnswers map[uint]uint
	if result.Answers != "" {
		if err := json.Unmarshal([]byte(result.Answers), &savedAnswers); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "error al decodificar respuestas"})
			return
		}
	} else {
		savedAnswers = make(map[uint]uint)
	}

	// Calcular progreso
	progress := 0.0
	if len(test.Questions) > 0 {
		progress = float64(len(savedAnswers)) / float64(len(test.Questions)) * 100
	}

	c.JSON(http.StatusOK, gin.H{
		"test":         test,
		"answers":      savedAnswers,
		"time_elapsed": result.TimeTaken,
		"progress":     progress,
		"is_resuming":  true,
		"result_id":    result.ID,
	})
}


// ====== Obtener tests EN PROGRESO del usuario actual con filtros y paginación ======
type InProgressTestsResponse struct {
    Results       []InProgressTestResponse `json:"results"`
    TotalTests    int64                    `json:"total_tests"`
    TotalPages    int                      `json:"total_pages"`
    CurrentPage   int                      `json:"current_page"`
    PageSize      int                      `json:"page_size"`
    HasMore       bool                     `json:"has_more"`
    MainTopics    []string                 `json:"main_topics"`
}

type InProgressTestResponse struct {
    ID             uint      `json:"result_id"`
    UserID         uint      `json:"user_id"`
    TestID         uint      `json:"test_id"`
    TimeTaken      int       `json:"time_taken"`
    Status         string    `json:"status"`
    Answers        string    `json:"answers,omitempty"`
    StartedAt      time.Time `json:"started_at"`
    UpdatedAt      time.Time `json:"updated_at"`
    
    // Datos del test
    TestTitle       string    `json:"test_title"`
    TestDescription string    `json:"test_description,omitempty"`
    TestMainTopic   string    `json:"test_main_topic"`
    TestSubTopic    string    `json:"test_sub_topic"`
    TestSpecificTopic string  `json:"test_specific_topic"`
    TestLevel       string    `json:"test_level"`
    TestCreatedAt   time.Time `json:"test_created_at"`

    // Estadísticas calculadas (solo progreso, no resultados)
    TotalQuestions  int       `json:"total_questions"`
    Attempt         int       `json:"attempt"`
    Progress        float64   `json:"progress"`
    AnsweredCount   int       `json:"answered_count"`
    RemainingCount  int       `json:"remaining_count"`
    TimeSpent       string    `json:"time_spent,omitempty"`
}

type InProgressTestsFilter struct {
    Page      int    `form:"page" binding:"omitempty,min=1"`
    PageSize  int    `form:"page_size" binding:"omitempty,min=1,max=50"`
    MainTopic string `form:"main_topic" binding:"omitempty"`
    Level     string `form:"level" binding:"omitempty"`
    SortBy    string `form:"sort_by" binding:"omitempty,oneof=progress test_created_at test_title result_updated_at result_started_at result_time_taken remaining_count attempt"`
    SortOrder string `form:"sort_order" binding:"omitempty,oneof=asc desc"`
}

func GetMyInProgressTests(c *gin.Context) {
    userIDIfc, exists := c.Get("user_id")
    if !exists {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "usuario no autenticado"})
        return
    }
    userID, ok := userIDIfc.(uint)
    if !ok {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "tipo de user_id inválido"})
        return
    }

    var filter InProgressTestsFilter
    if err := c.ShouldBindQuery(&filter); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    // Valores por defecto
    if filter.Page == 0 {
        filter.Page = 1
    }
    if filter.PageSize == 0 {
        filter.PageSize = 10
    }
    if filter.SortBy == "" {
        filter.SortBy = "result_updated_at"
    }
    if filter.SortOrder == "" {
        filter.SortOrder = "desc"
    }

    // Subconsulta para calcular la versión de cada resultado en progreso
    attemptSubquery := config.DB.Table("results r2").
        Select(`
            r2.id,
            ROW_NUMBER() OVER (
                PARTITION BY r2.test_id 
                ORDER BY r2.updated_at ASC
            ) as attempt_number
        `).
        Where("r2.user_id = ? AND r2.status = 'in_progress'", userID)

    // Construir consulta principal
    query := config.DB.Table("results r").
        Select(`
            r.id,
            r.user_id,
            r.time_taken,
            r.status,
            r.answers,
            r.started_at,
            r.updated_at,
            t.id as test_id,
            t.title as test_title,
            t.description as test_description,
            t.main_topic as test_main_topic,
            t.sub_topic as test_sub_topic,
            t.specific_topic as test_specific_topic,
            t.level as test_level,
            t.created_at as test_created_at,
            COALESCE(qc.question_count, 0) as total_questions,
            a.attempt_number as attempt,
            0 as progress, -- Se calculará después
            0 as answered_count -- Se calculará después
        `).
        Joins("LEFT JOIN tests t ON r.test_id = t.id").
        Joins(`
            LEFT JOIN (
                SELECT test_id, COUNT(*) as question_count
                FROM questions
                GROUP BY test_id
            ) qc ON t.id = qc.test_id
        `).
        Joins("LEFT JOIN (?) a ON r.id = a.id", attemptSubquery).
        Where("r.user_id = ? AND r.status = 'in_progress'", userID)

    // Aplicar filtros
    if filter.MainTopic != "" {
        query = query.Where("t.main_topic = ?", filter.MainTopic)
    }
    if filter.Level != "" {
        query = query.Where("t.level = ?", filter.Level)
    }

    // Aplicar ordenamiento inicial
    sortColumn := ""
    switch filter.SortBy {
    case "result_updated_at":
        sortColumn = "r.updated_at"
    case "result_started_at":
        sortColumn = "r.started_at"
    case "result_time_taken":
        sortColumn = "r.time_taken"
    case "test_title":
        sortColumn = "t.title"
    case "test_created_at": 
        sortColumn = "t.created_at"
    case "test_level": 
        sortColumn = "t.level"
    case "progress":
        // Ordenaremos después de calcular el progreso 
    case "remaining_count":
        // Ordenaremos después de calcular el remaining_count
    case "attempt":
        sortColumn = "a.attempt_number"
    default:
        sortColumn = "r.updated_at"
    }

    // Si no es progreso ni remaining_count, aplicar ordenamiento en SQL
    if filter.SortBy != "progress" && filter.SortBy != "remaining_count" && sortColumn != "" {
        query = query.Order(fmt.Sprintf("%s %s", sortColumn, filter.SortOrder))
    } else {
        query = query.Order("r.updated_at DESC")
    }

    countQuery := config.DB.Table("results r").
        Joins("LEFT JOIN tests t ON r.test_id = t.id").
        Where("r.user_id = ? AND r.status = 'in_progress'", userID)
    
    var totalTests int64
    if err := countQuery.Count(&totalTests).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "error al contar tests: " + err.Error()})
        return
    }

    if filter.MainTopic != "" {
        countQuery = countQuery.Where("t.main_topic = ?", filter.MainTopic)
    }
    if filter.Level != "" {
        countQuery = countQuery.Where("t.level = ?", filter.Level)
    }
        
    var TotalFilteredTests int64
    if err := countQuery.Count(&TotalFilteredTests).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "error al contar tests: " + err.Error()})
        return
    }

    // Calcular paginación sin filtros
    offset := (filter.Page - 1) * filter.PageSize
    totalPages := int(math.Ceil(float64(TotalFilteredTests) / float64(filter.PageSize)))

    // Obtener el tiempo total empleado en tests en progreso
    var totalTimeSpentQuery *gorm.DB
    if filter.MainTopic != "" || filter.Level != "" {
        // Si hay filtros, calcular tiempo total con filtros
        totalTimeSpentQuery = config.DB.Table("results r").
            Select("COALESCE(SUM(r.time_taken), 0) as total_time").
            Joins("LEFT JOIN tests t ON r.test_id = t.id").
            Where("r.user_id = ? AND r.status = 'in_progress'", userID)
        
        if filter.MainTopic != "" {
            totalTimeSpentQuery = totalTimeSpentQuery.Where("t.main_topic = ?", filter.MainTopic)
        }
        if filter.Level != "" {
            totalTimeSpentQuery = totalTimeSpentQuery.Where("t.level = ?", filter.Level)
        }
    } else {
        // Si no hay filtros, usar consulta más simple
        totalTimeSpentQuery = config.DB.Table("results r").
            Select("COALESCE(SUM(time_taken), 0) as total_time").
            Where("user_id = ? AND status = 'in_progress'", userID)
    }
    
    var totalTimeSpent struct {
        TotalTime int64 `gorm:"column:total_time"`
    }
    if err := totalTimeSpentQuery.Scan(&totalTimeSpent).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "error al calcular tiempo total: " + err.Error()})
        return
    }

    // Aplicar paginación
    var response []InProgressTestResponse
    if err := query.
        Offset(offset).
        Limit(filter.PageSize).
        Find(&response).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "error al obtener tests: " + err.Error()})
        return
    }

    // Calcular valores adicionales para cada test
    totalProgress := 0.0
    totalAnswered := 0
    
    for i := range response {
        // Contar respuestas contestadas desde el mapa
        var answers map[uint]uint
        if response[i].Answers != "" {
            if err := json.Unmarshal([]byte(response[i].Answers), &answers); err == nil {
                response[i].AnsweredCount = len(answers)
            }
        } else {
            response[i].AnsweredCount = 0
        }

        // Calcular progreso
        if response[i].TotalQuestions > 0 {
            response[i].Progress = float64(response[i].AnsweredCount) / float64(response[i].TotalQuestions) * 100
        }

        // Acumular para estadísticas
        totalProgress += response[i].Progress
        totalAnswered += response[i].AnsweredCount

        // Calcular preguntas restantes
        response[i].RemainingCount = response[i].TotalQuestions - response[i].AnsweredCount

        // Formatear tiempo empleado
        if response[i].TimeTaken > 0 {
            hours := response[i].TimeTaken / 3600
            minutes := (response[i].TimeTaken % 3600) / 60
            seconds := response[i].TimeTaken % 60
            
            if hours > 0 {
                response[i].TimeSpent = fmt.Sprintf("%dh %dm %ds", hours, minutes, seconds)
            } else if minutes > 0 {
                response[i].TimeSpent = fmt.Sprintf("%dm %ds", minutes, seconds)
            } else {
                response[i].TimeSpent = fmt.Sprintf("%ds", seconds)
            }
        }
    }

    // Ordenar por progreso si se solicitó (después de calcularlo)
    if filter.SortBy == "progress" {
        sort.Slice(response, func(i, j int) bool {
            if filter.SortOrder == "asc" {
                return response[i].Progress < response[j].Progress
            }
            return response[i].Progress > response[j].Progress
        })
    }

    // Ordenar por preguntas restantes si se solicitó
    if filter.SortBy == "remaining_count" {
        sort.Slice(response, func(i, j int) bool {
            if filter.SortOrder == "asc" {
                return response[i].RemainingCount < response[j].RemainingCount
            }
            return response[i].RemainingCount > response[j].RemainingCount
        })
    }

    // Obtener temas principales únicos para los filtros
    var mainTopics []string
    config.DB.Table("results r").
        Select("DISTINCT(t.main_topic)").
        Joins("LEFT JOIN tests t ON r.test_id = t.id").
        Where("r.user_id = ? AND r.status = 'in_progress' AND t.main_topic != '' AND t.main_topic IS NOT NULL", userID).
        Order("t.main_topic").
        Pluck("t.main_topic", &mainTopics)

    // Calcular estadísticas finales
    avgProgress := 0.0
    if len(response) > 0 {
        avgProgress = totalProgress / float64(len(response))
    }

   
    // Calcular tiempo promedio por test
    avgTimePerTest := 0
    if TotalFilteredTests > 0 {
        avgTimePerTest = int(totalTimeSpent.TotalTime) / int(TotalFilteredTests)
    }

    inProgressResponse := InProgressTestsResponse{
        Results:       response,
        TotalTests:    totalTests,
        TotalPages:    totalPages,
        CurrentPage:   filter.Page,
        PageSize:      filter.PageSize,
        HasMore:       filter.Page < totalPages,
        MainTopics:    mainTopics,
    }

    c.JSON(http.StatusOK, gin.H{
        "data": inProgressResponse,
        "stats": gin.H{
            "total_filtered_tests":    TotalFilteredTests,
            "average_progress":            math.Round(avgProgress*100) / 100,
            "total_questions_answered":    totalAnswered,
            "total_time_spent":            totalTimeSpent.TotalTime,
            "avg_time_per_test":           avgTimePerTest,
        },
    })
}


// ====== Eliminar progreso de un test ======
func DeleteTestProgress(c *gin.Context) {
	testID := c.Param("test_id")

	userIDIfc, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "no autorizado"})
		return
	}
	userID, ok := userIDIfc.(uint)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "tipo de user_id inválido"})
		return
	}

	// Eliminar resultado con estado 'in_progress'
	if err := config.DB.Where("user_id = ? AND test_id = ? AND status = 'in_progress'", userID, testID).
		Delete(&models.Result{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "error al eliminar progreso"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "progreso eliminado"})
}



// ====== Obtener tests completados del usuario actual con filtros y paginación ======
type CompletedTestsResponse struct {
	TestResults           []CompletedTestResponse `json:"test_results"`
	TotalTests            int64                   `json:"total_tests"`
	TotalPages            int                     `json:"total_pages"`
	CurrentPage           int                     `json:"current_page"`
	PageSize              int                     `json:"page_size"`
	HasMore               bool                    `json:"has_more"`
	MainTopics            []string                `json:"main_topics"`
}

// Estadísticas con filtros aplicados
type Stats struct {
	AverageScore           float64 `json:"average_score"`
	TotalTimeSpent         int64   `json:"total_time_spent"`
	TotalFilteredTests  int64   `json:"total_filtered_tests"`
    TotalQuestionsAnswered int64   `json:"total_questions_answered"`     
}

type CompletedTestResponse struct {
	ID              uint      `json:"result_id"`
	UserID          uint      `json:"user_id"`
	CorrectAnswers  int       `json:"correct_answers"`
	WrongAnswers    int       `json:"wrong_answers"`
	TimeTaken       int       `json:"time_taken"`
	Status          string    `json:"status"`
	StartedAt       time.Time `json:"started_at"`
	UpdatedAt       time.Time `json:"updated_at"`
	
	// Datos del test
	TestId          uint      `json:"test_id"`    
	TestTitle       string    `json:"test_title"`
	TestDescription string    `json:"test_description,omitempty"`
	TestMainTopic   string    `json:"test_main_topic"`
	TestSubTopic    string    `json:"test_sub_topic"`
	TestSpecificTopic string  `json:"test_specific_topic"`
	TestLevel       string    `json:"test_level"`
	TestCreatedAt   time.Time `json:"test_created_at"`

	// Estadísticas calculadas
	Attempt         int       `json:"attempt"`
	TotalQuestions  int       `json:"total_questions"`
	ScorePercent    float64   `json:"score_percent"`
	ScoreRounded    int       `json:"score_rounded"`
	Accuracy        float64   `json:"accuracy"`
}

type CompletedTestsFilter struct {
	Page      int    `form:"page" binding:"omitempty,min=1"`
	PageSize  int    `form:"page_size" binding:"omitempty,min=1,max=50"`
	MainTopic string `form:"main_topic" binding:"omitempty"`
	Level     string `form:"level" binding:"omitempty"`
	SortBy    string `form:"sort_by" binding:"omitempty,oneof=test_title test_created_at result_started_at result_updated_at result_time_taken score test_level attempt"`
	SortOrder string `form:"sort_order" binding:"omitempty,oneof=asc desc"`
}

// buildBaseQuery - Construye la consulta base con joins comunes
func buildBaseQuery(userID uint) *gorm.DB {
	return config.DB.Table("results r").
		Joins("LEFT JOIN tests t ON r.test_id = t.id").
		Where("r.user_id = ? AND r.status = 'completed'", userID)
}

// applyFilters - Aplica filtros a la consulta
func applyFilters(query *gorm.DB, filter CompletedTestsFilter) *gorm.DB {
	if filter.MainTopic != "" {
		query = query.Where("t.main_topic = ?", filter.MainTopic)
	}
	if filter.Level != "" {
		query = query.Where("t.level = ?", filter.Level)
	}
	return query
}

// getSortColumn - Obtiene la columna de ordenamiento
func getSortColumn(sortBy string) string {
	switch sortBy {
	case "result_updated_at":
		return "r.updated_at"
	case "result_started_at":
		return "r.started_at"
	case "result_time_taken":
		return "r.time_taken"
	case "test_title":
		return "t.title"
	case "test_created_at": 
		return "t.created_at"
	case "test_level": 
		return "t.level"
	case "attempt":
		return "attempt_number"
	default:
		return "r.updated_at"
	}
}

// calculate - Obtiene estadísticas con filtros aplicados
func calculateCompletedStats(userID uint, filter CompletedTestsFilter) (Stats, error) {
	var stats Stats
	
	// Consulta base para estadísticas
	query := config.DB.Table("results r").
		Select(`
			AVG(CASE 
				WHEN qc.question_count > 0 
				THEN (r.correct_answers::decimal / qc.question_count * 100)
				ELSE 0 
			END) as avg_score,
			SUM(r.time_taken) as total_time,
			COUNT(r.id) as total_tests,
            SUM(qc.question_count) as total_questions_answered 
		`).
		Joins("LEFT JOIN tests t ON r.test_id = t.id").
		Joins(`
			LEFT JOIN (
				SELECT test_id, COUNT(*) as question_count
				FROM questions
				GROUP BY test_id
			) qc ON t.id = qc.test_id
		`).
		Where("r.user_id = ? AND r.status = 'completed'", userID)
	
	// Aplicar mismos filtros
	query = applyFilters(query, filter)
	
	// Ejecutar consulta (añade el cuarto parámetro)
	err := query.Row().Scan(
		&stats.AverageScore, 
		&stats.TotalTimeSpent, 
		&stats.TotalFilteredTests,
		&stats.TotalQuestionsAnswered,
	)
	if err != nil {
		return stats, err
	}
	
	// Redondear promedio
	if stats.AverageScore > 0 {
		stats.AverageScore = math.Round(stats.AverageScore*100) / 100
	}
	
	return stats, nil
}


// getMainTopics - Obtiene temas principales únicos del usuario
func getMainTopics(userID uint) []string {
	var mainTopics []string
	config.DB.Table("results r").
		Select("DISTINCT(t.main_topic)").
		Joins("LEFT JOIN tests t ON r.test_id = t.id").
		Where("r.user_id = ? AND r.status = 'completed' AND t.main_topic != '' AND t.main_topic IS NOT NULL", userID).
		Order("t.main_topic").
		Pluck("t.main_topic", &mainTopics)
	return mainTopics
}

func GetMyCompletedTests(c *gin.Context) {
	// Validar usuario
	userIDIfc, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "usuario no autenticado"})
		return
	}
	userID, ok := userIDIfc.(uint)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "tipo de user_id inválido"})
		return
	}

	// Parsear filtros
	var filter CompletedTestsFilter
	if err := c.ShouldBindQuery(&filter); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Establecer valores por defecto
	if filter.Page == 0 {
		filter.Page = 1
	}
	if filter.PageSize == 0 {
		filter.PageSize = 10
	}
	if filter.SortBy == "" {
		filter.SortBy = "result_updated_at"
	}
	if filter.SortOrder == "" {
		filter.SortOrder = "desc"
	}

	// Obtener total de tests sin filtros (para referencia)
	baseQuery := buildBaseQuery(userID)
	var totalTests int64
	if err := baseQuery.Count(&totalTests).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "error al contar tests: " + err.Error()})
		return
	}

	// Obtener total de tests CON filtros
	filteredQuery := buildBaseQuery(userID)
	filteredQuery = applyFilters(filteredQuery, filter)
	var TotalFilteredTests int64
	if err := filteredQuery.Count(&TotalFilteredTests).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "error al contar tests con filtros: " + err.Error()})
		return
	}

	// Subconsulta para calcular el número de intento
	attemptSubquery := config.DB.Table("results r2").
		Select(`
			r2.id,
			ROW_NUMBER() OVER (
				PARTITION BY r2.test_id 
				ORDER BY r2.updated_at ASC
			) as attempt_number
		`).
		Where("r2.user_id = ? AND r2.status = 'completed'", userID)

	// Consulta principal para los resultados
	resultsQuery := config.DB.Table("results r").
		Select(`
			r.id,
			r.user_id,
			r.test_id,
			r.correct_answers,
			r.wrong_answers,
			r.time_taken,
			r.status,
			r.started_at,
			r.updated_at,
			t.id as test_id,
			t.title as test_title,
			t.description as test_description,
			t.main_topic as test_main_topic,
			t.sub_topic as test_sub_topic,
			t.specific_topic as test_specific_topic,
			t.level as test_level,
			t.created_at as test_created_at,
			COALESCE(qc.question_count, 0) as total_questions,
			a.attempt_number as attempt,
			CASE 
				WHEN COALESCE(qc.question_count, 0) > 0 
				THEN ROUND((r.correct_answers::decimal / qc.question_count * 100), 2)
				ELSE 0 
			END as score_percent,
			CASE 
				WHEN (r.correct_answers + r.wrong_answers) > 0
				THEN ROUND((r.correct_answers::decimal / (r.correct_answers + r.wrong_answers) * 100), 2)
				ELSE 0
			END as accuracy
		`).
		Joins("LEFT JOIN tests t ON r.test_id = t.id").
		Joins(`
			LEFT JOIN (
				SELECT test_id, COUNT(*) as question_count
				FROM questions
				GROUP BY test_id
			) qc ON t.id = qc.test_id
		`).
		Joins("LEFT JOIN (?) a ON r.id = a.id", attemptSubquery).
		Where("r.user_id = ? AND r.status = 'completed' AND t.is_active = true", userID)

	// Aplicar filtros a la consulta de resultados
	resultsQuery = applyFilters(resultsQuery, filter)

	// Aplicar ordenamiento (excepto para score que se ordena después)
	if filter.SortBy != "score" {
		sortColumn := getSortColumn(filter.SortBy)
		resultsQuery = resultsQuery.Order(fmt.Sprintf("%s %s", sortColumn, filter.SortOrder))
	} else {
		resultsQuery = resultsQuery.Order("r.updated_at DESC")
	}

	// Calcular paginación
	offset := (filter.Page - 1) * filter.PageSize
	totalPages := 0
	if TotalFilteredTests > 0 {
		totalPages = int(math.Ceil(float64(TotalFilteredTests) / float64(filter.PageSize)))
	}

	// Aplicar paginación y obtener resultados
	var results []CompletedTestResponse
	if err := resultsQuery.
		Offset(offset).
		Limit(filter.PageSize).
		Find(&results).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "error al obtener tests: " + err.Error()})
		return
	}

	// Calcular valores adicionales
	for i := range results {
		results[i].ScoreRounded = int(math.Round(results[i].ScorePercent))
	}

	// Ordenar por score si se solicitó
	if filter.SortBy == "score" {
		sort.Slice(results, func(i, j int) bool {
			if filter.SortOrder == "asc" {
				return results[i].ScorePercent < results[j].ScorePercent
			}
			return results[i].ScorePercent > results[j].ScorePercent
		})
	}

	// Obtener temas principales únicos
	mainTopics := getMainTopics(userID)

	// Obtener estadísticas CON filtros aplicados
	stats, err := calculateCompletedStats(userID, filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "error al obtener estadísticas: " + err.Error()})
		return
	}

	// Construir respuesta completa
	response := CompletedTestsResponse{
		TestResults:           results,
		TotalTests:            totalTests,
		TotalPages:            totalPages,
		CurrentPage:           filter.Page,
		PageSize:              filter.PageSize,
		HasMore:               filter.Page < totalPages,
		MainTopics:            mainTopics,
	}

    c.JSON(http.StatusOK, gin.H{
        "data": response,
        "stats": stats,
    })
}


func GetIncorrectAnswers(c *gin.Context) {
    resultID := c.Param("result_id")

    userIDIfc, exists := c.Get("user_id")
    if !exists {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "no autorizado"})
        return
    }
    userID, ok := userIDIfc.(uint)
    if !ok {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "tipo de user_id inválido"})
        return
    }

    // 1. Query única que obtiene todo en una sola consulta
    var queryResult struct {
        TotalQuestions int    `json:"total_questions"`
        CorrectAnswers int    `json:"correct_answers"`
        WrongAnswers   int    `json:"wrong_answers"`
        UserAnswers    string `json:"user_answers"`
        TestID         uint   `json:"test_id"`
    }

    if err := config.DB.Table("results").
        Select("correct_answers + wrong_answers as total_questions, correct_answers, wrong_answers, answers as user_answers, test_id").
        Where("id = ? AND user_id = ?", resultID, userID).
        First(&queryResult).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "resultado no encontrado"})
        return
    }

    // 2. Parsear respuestas si existen
    userAnswers := make(map[uint]uint)
    if queryResult.UserAnswers != "" {
        if err := json.Unmarshal([]byte(queryResult.UserAnswers), &userAnswers); err != nil {
            userAnswers = make(map[uint]uint)
        }
    }

    // 3. Query optimizada TODO en UNA consulta incluyendo la posición
    var incorrectQuestions []struct {
        QuestionID       uint   `json:"question_id"`
        QuestionNumber   int    `json:"question_number"`
        QuestionText     string `json:"question_text"`
        CorrectAnswerID  uint   `json:"correct_answer_id"`
        CorrectAnswerText string `json:"correct_answer_text"`
        UserAnswerText   string `json:"user_answer_text,omitempty"`
    }

    // Query TODO en una, optimizada para PostgreSQL con CTE y window function
    query := `
        WITH user_response AS (
            SELECT 
                CAST(key AS INTEGER) AS question_id,
                CAST(value AS INTEGER) AS user_answer_id
            FROM jsonb_each_text($1::jsonb)
        ),
        numbered_questions AS (
            SELECT 
                id,
                question_text,
                ROW_NUMBER() OVER (ORDER BY id ASC) as question_number
            FROM questions
            WHERE test_id = $2
        ),
        correct_responses AS (
            SELECT 
                nq.id AS question_id,
                nq.question_number,
                nq.question_text,
                a.id AS correct_answer_id,
                a.answer_text AS correct_answer_text
            FROM numbered_questions nq
            INNER JOIN answers a ON a.question_id = nq.id AND a.is_correct = true
        ),
        user_answer_texts AS (
            SELECT 
                a.id AS answer_id,
                a.answer_text
            FROM answers a
            WHERE a.question_id IN (SELECT id FROM questions WHERE test_id = $2)
        )
        SELECT 
            cr.question_id,
            cr.question_number,
            cr.question_text,
            cr.correct_answer_id,
            cr.correct_answer_text,
            COALESCE(
                (SELECT answer_text FROM user_answer_texts WHERE answer_id = ur.user_answer_id),
                'No respondida'
            ) AS user_answer_text
        FROM correct_responses cr
        LEFT JOIN user_response ur ON ur.question_id = cr.question_id
        WHERE ur.user_answer_id IS NULL 
           OR ur.user_answer_id != cr.correct_answer_id
        ORDER BY cr.question_number ASC
    `

    userAnswersJSON, _ := json.Marshal(userAnswers)
    
    if err := config.DB.Raw(query, string(userAnswersJSON), queryResult.TestID).
        Scan(&incorrectQuestions).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "error al procesar preguntas incorrectas",
            "details": err.Error(),
        })
        return
    }

    // 4. Calcular resumen
    totalQuestions := queryResult.CorrectAnswers + queryResult.WrongAnswers
    
    // 5. Respuesta final
    response := gin.H{
        "incorrect_questions": incorrectQuestions,
        "summary": gin.H{
            "total_questions":       totalQuestions,
            "total_correct":         queryResult.CorrectAnswers,
            "total_incorrect":       queryResult.WrongAnswers,
            "questions_with_errors": len(incorrectQuestions),
            "score_percentage":      math.Round(float64(queryResult.CorrectAnswers) / float64(totalQuestions) * 10000) / 100,
        },
    }

    c.JSON(http.StatusOK, response)
}