package shared

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"net/http"
	"time"
	"log"

	"angotest/config"
	"angotest/models"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

// InvitationController maneja las invitaciones a tests
type InvitationController struct{}

// CreateInvitationInput datos para crear una invitación
type CreateInvitationInput struct {
	TestID uint   `json:"test_id" binding:"required"`
	Message string `json:"message" binding:"omitempty"`
}

// Helper function para autenticar usuario
func authenticateUser(c *gin.Context, user *models.User, isGuest bool) error {
	return SetAuthCookie(c, user, isGuest)
}

// Helper function para construir respuesta base de invitación
func buildBaseInvitationResponse(invitation *models.TestInvitation) gin.H {
	return gin.H{
		"invitation": gin.H{
			"id":         invitation.ID,
			"test_id":    invitation.TestID,
			"message":    invitation.Message,
			"is_used":    invitation.IsUsed,
			"is_guest":   invitation.IsGuest,
			"guest_user_id": invitation.GuestUserID,
			"expires_at": invitation.ExpiresAt,
			"created_at": invitation.CreatedAt,
		},
		"test": gin.H{
			"id":             invitation.Test.ID,
			"title":          invitation.Test.Title,
			"description":    invitation.Test.Description,
			"main_topic":     invitation.Test.MainTopic,
			"sub_topic":      invitation.Test.SubTopic,
			"specific_topic": invitation.Test.SpecificTopic,
			"level":          invitation.Test.Level,
		},
		"inviter": gin.H{
			"id":         invitation.Inviter.ID,
			"username":   invitation.Inviter.Username,
			"email":      invitation.Inviter.Email,
			"first_name": invitation.Inviter.FirstName,
			"last_name":  invitation.Inviter.LastName,
			"full_name":  fmt.Sprintf("%s %s", invitation.Inviter.FirstName, invitation.Inviter.LastName),
		},
	}
}


// CreateInvitation crea una nueva invitación a un test
func (ic *InvitationController) CreateInvitation(c *gin.Context) {
	var input CreateInvitationInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Obtener usuario que envía la invitación
	userIDIfc, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "usuario no autenticado"})
		return
	}
	inviterID := userIDIfc.(uint)

	// Verificar que el test existe
	var test models.Test
	if err := config.DB.First(&test, input.TestID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "test no encontrado"})
		return
	}

	// Generar token único
	tokenBytes := make([]byte, 32)
	if _, err := rand.Read(tokenBytes); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "error generando token"})
		return
	}
	token := hex.EncodeToString(tokenBytes)

	// Crear invitación
	invitation := models.TestInvitation{
		TestID:    input.TestID,
		InvitedBy: inviterID,
		Message:   input.Message,
		Token:     token,
		ExpiresAt: time.Now().Add(7 * 24 * time.Hour), // Expira en 7 días
	}

	if err := config.DB.Create(&invitation).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "error creando invitación"})
		return
	}

	// Generar URL de invitación
	invitationURL := "https://"+c.Request.Host + "/invitation/accept?token=" + token

	c.JSON(http.StatusCreated, gin.H{
		"invitation": invitation,
		"invitation_url": invitationURL,
		"message": "Invitación creada exitosamente",
	})
}

// checkInvitation maneja la visualización de invitación (para no autenticados)
func (ic *InvitationController) CheckInvitation(c *gin.Context) {
    token := c.Query("token")
    if token == "" {
        c.JSON(http.StatusBadRequest, gin.H{"error": "token de invitación requerido"})
        return
    }

    // Buscar invitación con preloads necesarios
    var invitation models.TestInvitation
    if err := config.DB.
        Preload("Test").
        Preload("Inviter").
        Preload("GuestUser").
        Where("token = ? AND expires_at > ?", token, time.Now()).
        First(&invitation).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "invitación no válida o expirada"})
        return
    }

    // Verificar usuario autenticado
    userIDIfc, exists := c.Get("user_id")
    currentUserID := uint(0)
    if exists {
        currentUserID = userIDIfc.(uint)
    }
    
    response := buildBaseInvitationResponse(&invitation)
    
    // Determinar para qué usuario buscar resultados
    var resultUserID uint
    
    if invitation.GuestUserID != nil {
        // Invitación con guest_user_id: buscar resultados para ese usuario
        resultUserID = *invitation.GuestUserID
    } else if currentUserID > 0 {
        // Usuario autenticado: buscar sus propios resultados
        resultUserID = currentUserID
    } else {
        // Invitación sin usuario asociado aún
        response["result"] = nil
        response["is_authenticated"] = currentUserID > 0
        response["current_user_id"] = currentUserID
        c.JSON(http.StatusOK, response)
        return
    }

    // Buscar resultados existentes
    var existingResult models.Result
    resultFound := false
    
    // Orden de prioridad corregido: 
    // 1. Primero buscar 'in_progress' o 'expired' (puede retomar)
    if err := config.DB.Where("user_id = ? AND test_id = ? AND status IN (?, ?)", 
        resultUserID, invitation.TestID, "in_progress", "expired").
        Order("updated_at DESC").
        First(&existingResult).Error; err == nil {
        response["result"] = existingResult
        resultFound = true
    } else {
        // 2. Si no hay 'in_progress' o 'expired', buscar 'completed'
        if err := config.DB.Where("user_id = ? AND test_id = ? AND status = ?", 
            resultUserID, invitation.TestID, "completed").
            Order("updated_at DESC").
            First(&existingResult).Error; err == nil {
            response["result"] = existingResult
            resultFound = true
        }
    }
    
    // Si no se encontró ningún resultado
    if !resultFound {
        response["result"] = nil
    }

    response["is_authenticated"] = currentUserID > 0
    response["current_user_id"] = currentUserID
    
    c.JSON(http.StatusOK, response)
}


// Helper para transferir resultados de guest a usuario
func transferGuestResults(guestUserID, newUserID uint, testID uint) error {
    // Actualizar resultados del test
    if err := config.DB.Model(&models.Result{}).
        Where("user_id = ? AND test_id = ?", guestUserID, testID).
        Update("user_id", newUserID).Error; err != nil {
        return err
    }
    
    // Opcional: eliminar usuario guest si ya no tiene resultados
    var remainingResults int64
    config.DB.Model(&models.Result{}).
        Where("user_id = ?", guestUserID).
        Count(&remainingResults)
    
    if remainingResults == 0 {
        config.DB.Delete(&models.User{}, guestUserID)
    }
    
    return nil
}

// Helper para crear usuario guest
func createGuestUser(invitationID uint) (*models.User, error) {
	
    guestUsername := fmt.Sprintf("guest_%s_%d", time.Now().Format("20060102150405"), invitationID)
		
    // Generar password temporal
    tempPassword := hex.EncodeToString(make([]byte, 8))
    pwHash, err := bcrypt.GenerateFromPassword([]byte(tempPassword), bcrypt.DefaultCost)
    if err != nil {
        return nil, err
    }
    
    guestUser := &models.User{
        Username:     guestUsername,
        Email:        fmt.Sprintf("%s@guest.temp", guestUsername),
        PasswordHash: string(pwHash),
        FirstName:    "Invitado",
        Role:         "guest",
        BirthDate:    time.Now().AddDate(-18, 0, 0),
    }
    
    if err := config.DB.Create(guestUser).Error; err != nil {
        return nil, err
    }
    
    return guestUser, nil
}

// AcceptInvitation unificado con autenticación automática para guest users existentes
func (ic *InvitationController) AcceptInvitation(c *gin.Context) {
    token := c.Query("token")
    if token == "" {
        c.JSON(http.StatusBadRequest, gin.H{"error": "token de invitación requerido"})
        return
    }

    var input struct {
        AsGuest bool `json:"as_guest"` // Solo relevante cuando no hay guest_user_id
    }
    if err := c.ShouldBindJSON(&input); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    // Buscar invitación
    var invitation models.TestInvitation
    if err := config.DB.
        Preload("Test").
        Preload("Inviter").
        Where("token = ? AND expires_at > ?", token, time.Now()).
        First(&invitation).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "invitación no válida o expirada"})
        return
    }

    // Obtener usuario actual (puede ser nil)
    userIDIfc, _ := c.Get("user_id")
    currentUserID := uint(0)
    var currentUser models.User
    if userIDIfc != nil {
        currentUserID = userIDIfc.(uint)
        config.DB.First(&currentUser, currentUserID)
    }

    response := gin.H{
        "test_id": invitation.TestID,
        "invitation_id": invitation.ID,
    }

    // Lógica principal según los casos
    
    // Caso A: Ya hay guest_user_id
    if invitation.GuestUserID != nil {
        guestUserID := *invitation.GuestUserID
        
        // Subcaso A1: Usuario autenticado es el mismo guest
        if currentUserID == guestUserID {
            // Actualizar invitación si es guest y ahora es usuario regular
            if invitation.IsGuest && currentUser.Role == "user" {
                invitation.IsGuest = false
            }
            invitation.IsUsed = true
            config.DB.Save(&invitation)
            
            response["user_id"] = currentUserID
            response["is_guest"] = invitation.IsGuest
            response["message"] = "Continuando con tu usuario"
        } else if currentUserID > 0 && currentUser.Role == "user" && currentUserID != guestUserID {
            // Subcaso A2: Usuario autenticado como "user" diferente a guestUserID (toma control)
            // Transferir resultados existentes
            if err := transferGuestResults(guestUserID, currentUserID, invitation.TestID); err != nil {
                log.Printf("Error transfiriendo resultados: %v", err)
            }
            
            // Actualizar invitación
            invitation.GuestUserID = &currentUserID
            invitation.IsGuest = (currentUser.Role == "guest")
            invitation.IsUsed = true
            config.DB.Save(&invitation)
            
            response["user_id"] = currentUserID
            response["is_guest"] = invitation.IsGuest
            response["transferred_from_guest"] = true
            response["message"] = "Test asignado a tu cuenta"
        } else {
            // Subcaso A3: No autenticado - Autenticar automáticamente al guest user
            // Buscar el usuario guest
            var guestUser models.User
            if err := config.DB.First(&guestUser, guestUserID).Error; err != nil {
                c.JSON(http.StatusNotFound, gin.H{
                    "error": "Usuario guest no encontrado",
                    "requires_login": true,
                })
                return
            }

            // Autenticar automáticamente al usuario guest
            if err := authenticateUser(c, &guestUser, invitation.IsGuest); err != nil {
                log.Printf("Error autenticando usuario guest: %v", err)
                c.JSON(http.StatusInternalServerError, gin.H{"error": "Error autenticando usuario"})
                return
            }
            
            // Actualizar invitación
            invitation.IsUsed = true
            config.DB.Save(&invitation)
            
            response["user_id"] = guestUserID
            response["is_guest"] = invitation.IsGuest
            response["auto_authenticated"] = true
            response["message"] = "Autenticado automáticamente como usuario invitado"
        }
    } else {
        // Caso B: No hay guest_user_id
        // Subcaso B1: Usuario autenticado
        if currentUserID > 0 {
            invitation.GuestUserID = &currentUserID
            invitation.IsGuest = (currentUser.Role == "guest")
            invitation.IsUsed = true
            config.DB.Save(&invitation)
            
            response["user_id"] = currentUserID
            response["is_guest"] = invitation.IsGuest
            response["message"] = "Test asignado a tu cuenta"
        } else if input.AsGuest {
            // Subcaso B2: Crear guest (solo si input.AsGuest es true)
            guestUser, err := createGuestUser(invitation.ID)
            if err != nil {
                c.JSON(http.StatusInternalServerError, gin.H{"error": "error creando usuario invitado"})
                return
            }
            
            invitation.GuestUserID = &guestUser.ID
            invitation.IsGuest = true
            invitation.IsUsed = true
            config.DB.Save(&invitation)
            
            // Autenticar al guest
            if err := authenticateUser(c, guestUser, true); err != nil {
                c.JSON(http.StatusInternalServerError, gin.H{"error": "error autenticando usuario"})
                return
            }
            
            response["user_id"] = guestUser.ID
            response["is_guest"] = true
            response["auto_authenticated"] = true
            response["message"] = "Cuenta de invitado creada"


        } else {
            // Subcaso B3: Requiere login
            c.JSON(http.StatusUnauthorized, gin.H{
                "error": "Inicia sesión para aceptar la invitación",
                "requires_login": true,
            })
            return
        }
    }

    c.JSON(http.StatusOK, response)
}


// GetUserInvitations obtiene las invitaciones de un usuario
func (ic *InvitationController) GetUserInvitations(c *gin.Context) {
	userIDIfc, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "usuario no autenticado"})
		return
	}
	userID := userIDIfc.(uint)
	
	var invitations []models.TestInvitation
	if err := config.DB.Preload("Test").Preload("Inviter").
		Where("invited_by = ?", userID).
		Order("created_at DESC").
		Find(&invitations).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "error obteniendo invitaciones"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"invitations": invitations})
}