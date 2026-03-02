package admin

import (
	"net/http"
	"strconv"
	"time"

	"angotest/config"
	"angotest/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// InvitationsManagementController maneja la gestión de invitaciones
type InvitationsManagementController struct{}

// GetInvitationsFilterInput define los filtros para obtener invitaciones
type GetInvitationsFilterInput struct {
	Page        int    `form:"page" binding:"min=1"`
	PageSize    int    `form:"page_size" binding:"min=1,max=100"`
	SortBy      string `form:"sort_by"`
	SortOrder   string `form:"sort_order" binding:"omitempty,oneof=asc desc"`
	
	// Filtros
	Search      string `form:"search"`
	TestID      uint   `form:"test_id"`
	InvitedBy   uint   `form:"invited_by"`
	IsUsed      *bool  `form:"is_used"`
	IsGuest     *bool  `form:"is_guest"`
	Status      string `form:"status"` // 'active', 'expired', 'used'
	
	// Fechas
	StartDate   string `form:"start_date"`
	EndDate     string `form:"end_date"`
}

// DeleteInvitationsInput para eliminar múltiples invitaciones
type DeleteInvitationsInput struct {
	IDs []uint `json:"ids" binding:"required,min=1"`
}

// InvitationResponse estructura de respuesta para invitaciones
type InvitationResponse struct {
	ID          uint      `json:"id"`
	TestID      uint      `json:"test_id"`
	TestTitle   string    `json:"test_title"`
	InvitedBy   uint      `json:"invited_by"`
	InviterName string    `json:"inviter_name"`
	Message     string    `json:"message"`
	Token       string    `json:"token"`
	IsUsed      bool      `json:"is_used"`
	IsGuest     bool      `json:"is_guest"`
	GuestUserID *uint     `json:"guest_user_id,omitempty"`
	GuestName   string    `json:"guest_name,omitempty"`
	ExpiresAt   time.Time `json:"expires_at"`
	CreatedAt   time.Time `json:"created_at"`
	
	// Campos calculados
	Status      string    `json:"status"` // 'active', 'used', 'expired'
	InvitationURL string  `json:"invitation_url,omitempty"`
}

// GetInvitations obtiene invitaciones con filtros y paginación
func GetInvitations(c *gin.Context) {
	var input GetInvitationsFilterInput
	
	if err := c.ShouldBindQuery(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	// Valores por defecto
	if input.Page == 0 {
		input.Page = 1
	}
	if input.PageSize == 0 {
		input.PageSize = 20
	}
	if input.SortBy == "" {
		input.SortBy = "created_at"
	}
	if input.SortOrder == "" {
		input.SortOrder = "desc"
	}
	
	// Construir consulta
	db := config.DB.Model(&models.TestInvitation{}).
		Preload("Test").
		Preload("Inviter").
		Preload("GuestUser")
	
	// Aplicar filtros
	if input.Search != "" {
		search := "%" + input.Search + "%"
		db = db.Where("message LIKE ? OR token LIKE ?", search, search)
	}
	
	if input.TestID > 0 {
		db = db.Where("test_id = ?", input.TestID)
	}
	
	if input.InvitedBy > 0 {
		db = db.Where("invited_by = ?", input.InvitedBy)
	}
	
	if input.IsUsed != nil {
		db = db.Where("is_used = ?", *input.IsUsed)
	}
	
	if input.IsGuest != nil {
		db = db.Where("is_guest = ?", *input.IsGuest)
	}
	
	// Filtrar por estado
	if input.Status != "" {
		now := time.Now()
		switch input.Status {
		case "active":
			db = db.Where("is_used = ? AND expires_at > ?", false, now)
		case "used":
			db = db.Where("is_used = ?", true)
		case "expired":
			db = db.Where("expires_at <= ?", now)
		}
	}
	
	// Filtrar por fechas
	if input.StartDate != "" {
		if startDate, err := time.Parse("2006-01-02", input.StartDate); err == nil {
			db = db.Where("created_at >= ?", startDate)
		}
	}
	
	if input.EndDate != "" {
		if endDate, err := time.Parse("2006-01-02", input.EndDate); err == nil {
			db = db.Where("created_at <= ?", endDate.Add(24*time.Hour))
		}
	}
	
	// Obtener total
	var totalCount int64
	if err := db.Count(&totalCount).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "error contando invitaciones"})
		return
	}
	
	// Aplicar ordenamiento
	orderClause := input.SortBy
	if input.SortOrder != "" {
		orderClause += " " + input.SortOrder
	}
	
	// Obtener invitaciones
	var invitations []models.TestInvitation
	offset := (input.Page - 1) * input.PageSize
	
	if err := db.
		Order(orderClause).
		Limit(input.PageSize).
		Offset(offset).
		Find(&invitations).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "error obteniendo invitaciones"})
		return
	}
	
	// Convertir a respuesta
	responses := make([]InvitationResponse, len(invitations))
	now := time.Now()
	
	for i, inv := range invitations {
		status := "active"
		if inv.IsUsed {
			status = "used"
		} else if inv.ExpiresAt.Before(now) {
			status = "expired"
		}
		
		response := InvitationResponse{
			ID:          inv.ID,
			TestID:      inv.TestID,
			TestTitle:   inv.Test.Title,
			InvitedBy:   inv.InvitedBy,
			InviterName: inv.Inviter.Username,
			Message:     inv.Message,
			Token:       inv.Token,
			IsUsed:      inv.IsUsed,
			IsGuest:     inv.IsGuest,
			GuestUserID: inv.GuestUserID,
			ExpiresAt:   inv.ExpiresAt,
			CreatedAt:   inv.CreatedAt,
			Status:      status,
			InvitationURL: "https://"+c.Request.Host + "/invitation/accept?token=" + inv.Token,
		}
		
		if inv.GuestUser != nil {
			response.GuestName = inv.GuestUser.Username
		}
		
		responses[i] = response
	}
	
	// Obtener filtros disponibles
	availableFilters := gin.H{
		"total_invitations": totalCount,
	}
	
	c.JSON(http.StatusOK, gin.H{
		"invitations": responses,
		"pagination": gin.H{
			"page":         input.Page,
			"page_size":    input.PageSize,
			"total_items":  totalCount,
			"total_pages":  (int(totalCount) + input.PageSize - 1) / input.PageSize,
		},
		"filters_applied": input,
		"available_filters": availableFilters,
	})
}

// DeleteInvitation elimina una invitación por ID
func DeleteInvitation(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}
	
	// Verificar si existe
	var invitation models.TestInvitation
	if err := config.DB.First(&invitation, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "invitación no encontrada"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "error buscando invitación"})
		}
		return
	}
	
	// Verificar si está usada (opcional: prevenir eliminación de invitaciones usadas)
	if invitation.IsUsed {
		c.JSON(http.StatusBadRequest, gin.H{"error": "no se puede eliminar una invitación usada"})
		return
	}
	
	// Eliminar
	if err := config.DB.Delete(&invitation).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "error eliminando invitación"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"message": "Invitación eliminada exitosamente",
		"id":      id,
	})
}

// DeleteInvitationsBulk elimina múltiples invitaciones
func DeleteInvitationsBulk(c *gin.Context) {
	var input DeleteInvitationsInput
	
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	// Verificar que todas las invitaciones existan y no estén usadas
	var count int64
	if err := config.DB.Model(&models.TestInvitation{}).
		Where("id IN (?) AND is_used = ?", input.IDs, true).
		Count(&count).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "error verificando invitaciones"})
		return
	}
	
	if count > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "una o más invitaciones ya están usadas y no pueden ser eliminadas"})
		return
	}
	
	// Eliminar en lote
	result := config.DB.Where("id IN (?)", input.IDs).Delete(&models.TestInvitation{})
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "error eliminando invitaciones"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"message":    "Invitaciones eliminadas exitosamente",
		"deleted_count": result.RowsAffected,
		"deleted_ids": input.IDs,
	})
}

// GetInvitationStats obtiene estadísticas de invitaciones
func GetInvitationStats(c *gin.Context) {
	var stats struct {
		Total     int64 `json:"total"`
		Active    int64 `json:"active"`
		Used      int64 `json:"used"`
		Expired   int64 `json:"expired"`
		WithGuest int64 `json:"with_guest"`
	}
	
	now := time.Now()
	
	// Contar total
	config.DB.Model(&models.TestInvitation{}).Count(&stats.Total)
	
	// Contar activas
	config.DB.Model(&models.TestInvitation{}).
		Where("is_used = ? AND expires_at > ?", false, now).
		Count(&stats.Active)
	
	// Contar usadas
	config.DB.Model(&models.TestInvitation{}).
		Where("is_used = ?", true).
		Count(&stats.Used)
	
	// Contar expiradas
	config.DB.Model(&models.TestInvitation{}).
		Where("expires_at <= ?", now).
		Count(&stats.Expired)
	
	// Contar con guest
	config.DB.Model(&models.TestInvitation{}).
		Where("guest_user_id IS NOT NULL").
		Count(&stats.WithGuest)
	
	c.JSON(http.StatusOK, gin.H{
		"stats": stats,
		"timestamp": now,
	})
}