package admin

import (
	"errors"
	"fmt"
	"net/http"
	"time"

	"angotest/config"
	"angotest/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

//
// =====================
// DTOs
// =====================
//

type AdminResultItem struct {
	// Result
	ID             uint      `json:"id"`
	UserID         uint      `json:"user_id"`
	TestID         uint      `json:"test_id"`
	CorrectAnswers int       `json:"correct_answers"`
	WrongAnswers   int       `json:"wrong_answers"`
	TotalQuestions int       `json:"total_questions"`
	Score          float64   `json:"score"`
	TimeTaken      int       `json:"time_taken"`
	Status         string    `json:"status"`
	Answers        string    `json:"answers,omitempty"`
	StartedAt      time.Time `json:"started_at"`
	UpdatedAt      time.Time `json:"updated_at"`

	// User
	UserUsername  string `json:"user_username"`
	UserEmail     string `json:"user_email"`
	UserFirstName string `json:"user_first_name,omitempty"`
	UserLastName  string `json:"user_last_name,omitempty"`
	UserRole      string `json:"user_role"`

	// Test
	TestTitle         string `json:"test_title"`
	TestDescription   string `json:"test_description,omitempty"`
	TestMainTopic     string `json:"test_main_topic"`
	TestSubTopic      string `json:"test_sub_topic"`
	TestSpecificTopic string `json:"test_specific_topic"`
	TestLevel         string `json:"test_level"`
}

type AdminResultsResponse struct {
	Results          []AdminResultItem `json:"results"`
	FiltersApplied   gin.H             `json:"filters_applied,omitempty"`
	AvailableFilters gin.H             `json:"available_filters,omitempty"`
	Stats            gin.H             `json:"stats"`
}

type AdminResultsFilter struct {
	Page     int `form:"page" binding:"omitempty,min=1"`
	PageSize int `form:"page_size" binding:"omitempty,min=1,max=100"`

	// User
	UserID       *uint  `form:"user_id"`
	UserRole     string `form:"user_role" binding:"omitempty,oneof=user admin"`
	UserEmail    string `form:"user_email" binding:"omitempty,email"`
	UserUsername string `form:"user_username"`

	// Test
	TestID            *uint  `form:"test_id"`
	TestTitle         string `form:"test_title"`
	TestMainTopic     string `form:"test_main_topic"`
	TestSubTopic      string `form:"test_sub_topic"`
	TestSpecificTopic string `form:"test_specific_topic"`
	TestLevel         string `form:"test_level" binding:"omitempty,oneof=Principiante Intermedio Avanzado"`
	TestCreatedBy     *uint  `form:"test_created_by"`

	// Result
	Status   string   `form:"status" binding:"omitempty,oneof=in_progress completed expired"`
	MinScore *float64 `form:"min_score" binding:"omitempty,min=0,max=100"`
	MaxScore *float64 `form:"max_score" binding:"omitempty,min=0,max=100"`

	// Dates
	StartDate string `form:"start_date" binding:"omitempty,datetime=2006-01-02"`
	EndDate   string `form:"end_date" binding:"omitempty,datetime=2006-01-02"`

	// Sorting
	SortBy    string `form:"sort_by"`
	SortOrder string `form:"sort_order" binding:"omitempty,oneof=asc desc"`

	// Search
	Search string `form:"search"`
}

//
// =====================
// Helpers
// =====================
//

func applyCommonFilters(query *gorm.DB, filter AdminResultsFilter) *gorm.DB {
	if filter.UserID != nil {
		query = query.Where("r.user_id = ?", *filter.UserID)
	}
	if filter.UserRole != "" {
		query = query.Where("u.role = ?", filter.UserRole)
	}
	if filter.UserEmail != "" {
		query = query.Where("u.email ILIKE ?", "%"+filter.UserEmail+"%")
	}
	if filter.UserUsername != "" {
		query = query.Where("u.username ILIKE ?", "%"+filter.UserUsername+"%")
	}

	if filter.TestID != nil {
		query = query.Where("r.test_id = ?", *filter.TestID)
	}
	if filter.TestTitle != "" {
		query = query.Where("t.title ILIKE ?", "%"+filter.TestTitle+"%")
	}
	if filter.TestMainTopic != "" {
		query = query.Where("t.main_topic = ?", filter.TestMainTopic)
	}
	if filter.TestSubTopic != "" {
		query = query.Where("t.sub_topic = ?", filter.TestSubTopic)
	}
	if filter.TestLevel != "" {
		query = query.Where("t.level = ?", filter.TestLevel)
	}
	if filter.TestCreatedBy != nil {
		query = query.Where("t.created_by = ?", *filter.TestCreatedBy)
	}

	if filter.Status != "" {
		query = query.Where("r.status = ?", filter.Status)
	}

	if filter.StartDate != "" {
		query = query.Where("DATE(r.started_at) >= ?", filter.StartDate)
	}
	if filter.EndDate != "" {
		query = query.Where("DATE(r.started_at) <= ?", filter.EndDate)
	}

	if filter.Search != "" {
		s := "%" + filter.Search + "%"
		query = query.Where(`
			u.username ILIKE ? OR
			u.email ILIKE ? OR
			t.title ILIKE ? OR
			t.main_topic ILIKE ? OR
			t.sub_topic ILIKE ?
		`, s, s, s, s, s)
	}

	return query
}

func getSortColumn(sortBy string) string {
	cols := map[string]string{
		"id":              "id",
		"started_at":      "started_at",
		"updated_at":      "updated_at",
		"time_taken":      "time_taken",
		"correct_answers": "correct_answers",
		"user_username":   "user_username",
		"test_title":      "test_title",
		"test_main_topic": "test_main_topic",
		"test_level":      "test_level",
		"score":           "score",
	}
	if c, ok := cols[sortBy]; ok {
		return c
	}
	return "updated_at"
}

func applySorting(query *gorm.DB, sortBy, sortOrder string) *gorm.DB {
	dir := "DESC"
	if sortOrder == "asc" {
		dir = "ASC"
	}
	return query.Order(getSortColumn(sortBy) + " " + dir)
}

//
// =====================
// Base subquery
// =====================
//

func buildResultsSubQuery(filter AdminResultsFilter) *gorm.DB {
	scoreSQL := `
		CASE
			WHEN r.status = 'completed'
			AND (r.correct_answers + r.wrong_answers) > 0
			THEN ROUND((r.correct_answers * 100.0 / (r.correct_answers + r.wrong_answers)), 2)
			ELSE 0
		END AS score
	`

	selectSQL := `
		r.id,
		r.user_id,
		r.test_id,
		r.correct_answers,
		r.wrong_answers,
		(r.correct_answers + r.wrong_answers) AS total_questions,
		r.time_taken,
		r.status,
		r.answers,
		r.started_at,
		r.updated_at,

		u.username   AS user_username,
		u.email      AS user_email,
		u.first_name AS user_first_name,
		u.last_name  AS user_last_name,
		u.role       AS user_role,

		t.title          AS test_title,
		t.description    AS test_description,
		t.main_topic     AS test_main_topic,
		t.sub_topic      AS test_sub_topic,
		t.specific_topic AS test_specific_topic,
		t.level          AS test_level,

		` + scoreSQL

	query := config.DB.
		Table("results r").
		Select(selectSQL).
		Joins("LEFT JOIN users u ON r.user_id = u.id").
		Joins("LEFT JOIN tests t ON r.test_id = t.id")

	return applyCommonFilters(query, filter)
}

//
// =====================
// Endpoints
// =====================
//

func GetResultsList(c *gin.Context) {
	var filter AdminResultsFilter
	if err := c.ShouldBindQuery(&filter); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if filter.Page == 0 {
		filter.Page = 1
	}
	if filter.PageSize == 0 {
		filter.PageSize = 20
	}
	if filter.SortBy == "" {
		filter.SortBy = "updated_at"
	}
	if filter.SortOrder == "" {
		filter.SortOrder = "desc"
	}

	baseQuery := buildResultsSubQuery(filter)
	mainQuery := config.DB.Table("(?) AS subq", baseQuery)

	if filter.MinScore != nil && filter.MaxScore != nil {
		mainQuery = mainQuery.Where("score BETWEEN ? AND ?", *filter.MinScore, *filter.MaxScore)
	} else if filter.MinScore != nil {
		mainQuery = mainQuery.Where("score >= ?", *filter.MinScore)
	} else if filter.MaxScore != nil {
		mainQuery = mainQuery.Where("score <= ?", *filter.MaxScore)
	}

	var totalResults int64
	config.DB.Table("results").Count(&totalResults)

	var totalFilteredResults int64
	if err := mainQuery.Count(&totalFilteredResults).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	mainQuery = applySorting(mainQuery, filter.SortBy, filter.SortOrder)

	offset := (filter.Page - 1) * filter.PageSize
	var results []AdminResultItem

	if err := mainQuery.
		Offset(offset).
		Limit(filter.PageSize).
		Find(&results).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	mainTopics, _ := models.GetMainTopics()

	c.JSON(http.StatusOK, AdminResultsResponse{
		Results: results,
		FiltersApplied: gin.H{
			"page":       filter.Page,
			"page_size":  filter.PageSize,
			"sort_by":    filter.SortBy,
			"sort_order": filter.SortOrder,
		},
		AvailableFilters: gin.H{
			"main_topics": mainTopics,
			"levels":      models.GetPredefinedLevels(),
			"statuses":    models.GetPredefinedStatus(),
			"roles":       []string{"user", "admin"},
		},
		Stats: gin.H{
			"total_results":          totalResults,
			"total_filtered_results": totalFilteredResults,
		},
	})
}

//
// =====================
// Deletes (sin cambios)
// =====================
//

func DeleteResult(c *gin.Context) {
	id := c.Param("id")

	var result models.Result
	if err := config.DB.First(&result, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Resultado no encontrado"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al buscar el resultado"})
		return
	}

	config.DB.Delete(&result)
	c.JSON(http.StatusOK, gin.H{"message": "Resultado eliminado", "id": id})
}

type DeleteBulkRequest struct {
	IDs []uint `json:"ids" binding:"required,min=1"`
}

func DeleteResultsBulk(c *gin.Context) {
	var req DeleteBulkRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	res := config.DB.Where("id IN ?", req.IDs).Delete(&models.Result{})
	if res.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": res.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":       fmt.Sprintf("%d resultados eliminados", res.RowsAffected),
		"deleted_count": res.RowsAffected,
	})
}
