package shared

import (
	"net/http"

    "angotest/config"
    "angotest/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// GetSystemConfigByKey obtiene el valor de una configuración por su clave
func GetSystemConfigByKey(c *gin.Context) {
	key := c.Param("key")
	var systemConfig models.SystemConfig
	
	result := config.DB.Where("key = ?", key).First(&systemConfig)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Configuración no encontrada"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener configuración"})
		}
		return
	}
	
	// Devolver solo el valor como string plano
	c.String(http.StatusOK, systemConfig.Value)
}
