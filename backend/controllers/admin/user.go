package admin

import (
    "net/http"
    "strconv"
    "time"
    "fmt"
    "strings"
    "errors"
    
    "angotest/config"
    "angotest/models"

    "github.com/gin-gonic/gin"
  	"gorm.io/gorm"
)

type UpdateUserInput struct {
    FirstName string `json:"first_name"`
    LastName  string `json:"last_name"`
    Email     string `json:"email"`
    Phone     string `json:"phone"`
    Address   string `json:"address"`
    Country   string `json:"country"`
    BirthDate string `json:"birth_date"` // formato YYYY-MM-DD
    Role      string `json:"role"`
}

func GetUserByID(c *gin.Context) {
    idStr := c.Param("user_id")
    id, err := strconv.ParseUint(idStr, 10, 32)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
        return
    }

    var user models.User
    if err := config.DB.First(&user, id).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "usuario no encontrado"})
        return
    }

    c.JSON(http.StatusOK, gin.H{"user": models.ToUserResponse(&user)})
}


// ====== Obtener datos básicos de perfil de usuario ======
func GetUserProfile(c *gin.Context) {
    userID := c.Param("user_id")
    
    var user models.User
    if err := config.DB.Select(
        "id", 
        "username", 
        "email", 
        "first_name", 
        "last_name", 
        "phone", 
        "address", 
        "country", 
        "birth_date", 
        "role", 
        "registered_at",
        "login_at",
    ).First(&user, userID).Error; err != nil {
        if errors.Is(err, gorm.ErrRecordNotFound) {
            c.JSON(http.StatusNotFound, gin.H{"error": "usuario no encontrado"})
        } else {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "error al obtener perfil de usuario"})
        }
        return
    }
    
    c.JSON(http.StatusOK, gin.H{"user": user})
}


func UpdateUser(c *gin.Context) {
    idStr := c.Param("user_id")
    id, err := strconv.ParseUint(idStr, 10, 32)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
        return
    }

    var user models.User
    if err := config.DB.First(&user, id).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "usuario no encontrado"})
        return
    }

    var input UpdateUserInput
    if err := c.ShouldBindJSON(&input); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    // Actualizar campos
    if input.FirstName != "" {
        user.FirstName = input.FirstName
    }
    if input.LastName != "" {
        user.LastName = input.LastName
    }
    if input.Email != "" {
        user.Email = input.Email
    }
    if input.Phone != "" {
        user.Phone = input.Phone
    }
    if input.Address != "" {
        user.Address = input.Address
    }
    if input.Country != "" {
        user.Country = input.Country
    }
    if input.BirthDate != "" {
        // Parsear fecha (ya implementado)
    }
    if input.Role != "" && (input.Role == "user" || input.Role == "admin") {
        user.Role = input.Role
    }

    if err := config.DB.Save(&user).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "error al actualizar usuario"})
        return
    }

    c.JSON(http.StatusOK, gin.H{"user": models.ToUserResponse(&user), "message": "Usuario actualizado correctamente"})
}


// ====== Obtener usuarios con estadísticas completas (con paginación, filtrado y ordenación) ======
type UsersStatsRequest struct {
    Page     int    `form:"page" binding:"omitempty,min=1"`
    PageSize int    `form:"page_size" binding:"omitempty,min=1,max=100"`
    SortBy   string `form:"sort_by" binding:"omitempty,oneof=id username email role registered_at login_at tests_completed average_score"`
    SortOrder string `form:"sort_order" binding:"omitempty,oneof=asc desc"`
    Role     string `form:"role" binding:"omitempty"`
    Search   string `form:"search" binding:"omitempty"`
}

func GetUsersWithStats(c *gin.Context) {
    var req UsersStatsRequest
    if err := c.ShouldBindQuery(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    // Valores por defecto
    if req.Page == 0 {
        req.Page = 1
    }
    if req.PageSize == 0 {
        req.PageSize = 10
    }
    if req.SortBy == "" {
        req.SortBy = "registered_at"
    }
    if req.SortOrder == "" {
        req.SortOrder = "desc"
    }

    type UserStats struct {
        ID                 uint      `json:"id"`
        Username           string    `json:"username"`
        Email              string    `json:"email"`
        FirstName          string    `json:"first_name"`
        LastName           string    `json:"last_name"`
        Phone              string    `json:"phone"`
        Address            string    `json:"address"`
        Country            string    `json:"country"`
        BirthDate          time.Time `json:"birth_date"`
        Role               string    `json:"role"`
        RegisteredAt          time.Time `json:"registered_at"`
        LoginAt            time.Time `json:"login_at"`
        
        // Estadísticas de tests
        TestsCompleted     int       `json:"tests_completed"`
        TestsInProgress    int       `json:"tests_in_progress"`
        TestsNotStarted    int       `json:"tests_not_started"`
        AverageScore       float64   `json:"average_score"`
        TotalTestsTaken    int       `json:"total_tests_taken"`
    }

    // Construir consulta base
    baseQuery := `
        SELECT 
            users.id,
            users.username,
            users.email,
            users.first_name,
            users.last_name,
            users.phone,
            users.address,
            users.country,
            users.birth_date,
            users.role,
            users.registered_at,
            users.login_at,
            
            -- Tests completados
            COALESCE(SUM(CASE WHEN results.status = 'completed' THEN 1 ELSE 0 END), 0) as tests_completed,
            
            -- Tests en progreso
            COALESCE(SUM(CASE WHEN results.status = 'in_progress' THEN 1 ELSE 0 END), 0) as tests_in_progress,
            
            -- Tests no iniciados (todos los tests menos los que tienen algún resultado)
            (SELECT COUNT(*) FROM tests) - 
            COALESCE(COUNT(DISTINCT results.test_id), 0) as tests_not_started,
            
            -- Puntuación media (solo tests completados con preguntas)
            COALESCE(
                AVG(CASE 
                    WHEN results.status = 'completed' AND q.question_count > 0 
                    THEN (results.correct_answers::float / q.question_count * 100) 
                    ELSE NULL 
                END), 
                0
            ) as average_score,
            
            -- Total de tests realizados (completados + en progreso)
            COALESCE(COUNT(results.id), 0) as total_tests_taken
            
        FROM users
        LEFT JOIN results ON results.user_id = users.id
        LEFT JOIN (
            SELECT test_id, COUNT(*) as question_count 
            FROM questions 
            GROUP BY test_id
        ) q ON results.test_id = q.test_id
    `

    // Agregar condiciones WHERE
    var whereConditions []string
    var queryParams []interface{}

    if req.Role != "" {
        whereConditions = append(whereConditions, "users.role = ?")
        queryParams = append(queryParams, req.Role)
    }

    if req.Search != "" {
        searchPattern := "%" + req.Search + "%"
        whereConditions = append(whereConditions, 
            "(users.username ILIKE ? OR users.email ILIKE ? OR users.first_name ILIKE ? OR users.last_name ILIKE ?)")
        queryParams = append(queryParams, searchPattern, searchPattern, searchPattern, searchPattern)
    }

    // Construir WHERE clause
    whereClause := ""
    if len(whereConditions) > 0 {
        whereClause = " WHERE " + strings.Join(whereConditions, " AND ")
    }

    // Agregar GROUP BY
    groupByClause := " GROUP BY users.id"

    // Construir ORDER BY
    orderByClause := fmt.Sprintf(" ORDER BY %s %s", req.SortBy, req.SortOrder)

    // Consulta para contar total de usuarios (sin filtros)
    var totalUsers int64
    config.DB.Model(&models.User{}).Count(&totalUsers)

    // Consulta para contar total de usuarios (sin paginación)
    countQuery := "SELECT COUNT(DISTINCT users.id) FROM users" + whereClause
    var totalFilteredUsers int64
    
    if err := config.DB.Raw(countQuery, queryParams...).Scan(&totalFilteredUsers).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "error al contar usuarios: " + err.Error()})
        return
    }

    // Calcular paginación
    offset := (req.Page - 1) * req.PageSize

    // Consulta para obtener usuarios con paginación
    paginationClause := fmt.Sprintf(" LIMIT %d OFFSET %d", req.PageSize, offset)
    finalQuery := baseQuery + whereClause + groupByClause + orderByClause + paginationClause

    var users []UserStats
    if err := config.DB.Raw(finalQuery, queryParams...).Scan(&users).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "error al obtener usuarios: " + err.Error()})
        return
    }

    // Respuesta con metadatos de paginación
    response := gin.H{
        "users": users,
        "stats": gin.H{
            "total_filtered_users": totalFilteredUsers,
            "total_users": totalUsers,
        },
        "filters": gin.H{
            "page": req.Page,
            "page_size": req.PageSize,                 
            "role": req.Role,
            "search": req.Search,
            "sort_by": req.SortBy,
            "sort_order": req.SortOrder,
        },
    }
    
    c.JSON(http.StatusOK, response)

}

// DeleteUser elimina permanentemente un usuario y transfiere sus tests al usuario ID=1
func DeleteUser(c *gin.Context) {
	idStr := c.Param("user_id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}
	userID := uint(id)

	// Verificar que no se intente eliminar al usuario ID=1
	if userID == 1 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "No se puede eliminar el usuario administrador principal (ID=1)",
		})
		return
	}

	// Buscar usuario (incluyendo soft-deleted)
	var user models.User
	if err := config.DB.Unscoped().First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "usuario no encontrado"})
		return
	}

	// Verificar si es administrador y prevenir eliminación del único admin
	if user.Role == "admin" {
		var adminCount int64
		if err := config.DB.Model(&models.User{}).
			Where("role = ? AND deleted_at IS NULL", "admin").
			Count(&adminCount).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "error al verificar administradores"})
			return
		}

		// Si es el único administrador activo, no permitir eliminar
		if adminCount <= 1 && user.DeletedAt.Time.IsZero() {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "No se puede eliminar el único administrador activo del sistema",
			})
			return
		}
	}

	// Verificar que el usuario destino (ID=1) existe
	var targetUser models.User
	if err := config.DB.First(&targetUser, 1).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "El usuario destino para transferencia (ID=1) no existe",
		})
		return
	}

	// Ejecutar transacción para eliminación permanente con transferencia de tests
	err = config.DB.Transaction(func(tx *gorm.DB) error {
		// 1. ELIMINAR tokens de restablecimiento de contraseña (foreign key constraint)
		if err := tx.Unscoped().
			Where("user_id = ?", userID).
			Delete(&models.PasswordResetToken{}).Error; err != nil {
			return fmt.Errorf("error eliminando tokens de restablecimiento: %v", err)
		}

		// 2. TRANSFERIR TESTS al usuario ID=1 (NO eliminar)
		if err := tx.Model(&models.Test{}).
			Unscoped(). // Incluir tests soft-deleted si los hay
			Where("created_by = ?", userID).
			Update("created_by", 1).Error; err != nil {
			return fmt.Errorf("error transfiriendo tests: %v", err)
		}

		// 3. TRANSFERIR RESULTADOS al usuario ID=1
		if err := tx.Model(&models.Result{}).
			Unscoped().
			Where("user_id = ?", userID).
			Update("user_id", 1).Error; err != nil {
			return fmt.Errorf("error transfiriendo resultados: %v", err)
		}

		// 4. ELIMINAR quotas del usuario (no relevantes)
		if err := tx.Unscoped().
			Where("user_id = ?", userID).
			Delete(&models.UserQuota{}).Error; err != nil {
			return fmt.Errorf("error eliminando quotas: %v", err)
		}

		// 5. ELIMINAR invitaciones ENVIADAS por el usuario
		if err := tx.Unscoped().
			Where("invited_by = ?", userID).
			Delete(&models.TestInvitation{}).Error; err != nil {
			return fmt.Errorf("error eliminando invitaciones enviadas: %v", err)
		}

		// 6. LIMPIAR referencia en invitaciones RECIBIDAS (si el usuario era guest)
		if err := tx.Model(&models.TestInvitation{}).
			Where("guest_user_id = ?", userID).
			Update("guest_user_id", nil).Error; err != nil {
			return fmt.Errorf("error actualizando invitaciones recibidas: %v", err)
		}

		// 7. ELIMINAR PERMANENTEMENTE al usuario
		if err := tx.Unscoped().Delete(&user).Error; err != nil {
			return fmt.Errorf("error eliminando usuario: %v", err)
		}

		return nil
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	// Respuesta exitosa
	c.JSON(http.StatusOK, gin.H{
		"message":              "Usuario eliminado permanentemente",
		"deleted_user_id":      id,
		"deleted_username":     user.Username,
		"transferred_to_user":  1,
		"transferred_to_email": targetUser.Email,
	})
}


// Actualizar quota de usuario (admin)
// type UpdateUserQuotaInput struct {
//     MaxRequests int `json:"max_requests" binding:"required,min=1"`
// }

// func UpdateUserQuota(c *gin.Context) {
//     userID := c.Param("user_id")
    
//     var input UpdateUserQuotaInput
//     if err := c.ShouldBindJSON(&input); err != nil {
//         c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
//         return
//     }
    
//     monthYear := time.Now().Format("2006-01")
    
//     var quota models.UserQuota
//     if err := config.DB.Where("user_id = ? AND month_year = ?", userID, monthYear).First(&quota).Error; err != nil {
//         quota = models.UserQuota{
//             UserID:       parseUint(userID),
//             MonthYear:    monthYear,
//             MaxRequests:  input.MaxRequests,
//             UsedRequests: 0,
//         }
//         if err := config.DB.Create(&quota).Error; err != nil {
//             c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
//             return
//         }
//     } else {
//         quota.MaxRequests = input.MaxRequests
//         if err := config.DB.Save(&quota).Error; err != nil {
//             c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
//             return
//         }
//     }
    
//     c.JSON(http.StatusOK, gin.H{
//         "message": "Quota actualizada",
//         "quota":   quota,
//     })
// }













func parseUint(s string) uint {
    var result uint
    fmt.Sscanf(s, "%d", &result)
    return result
}



