package admin

import (
	"net/http"

    "angotest/config"
    "angotest/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type SystemConfigController struct{}

// GetSystemConfigs obtiene todas las configuraciones
func (sc *SystemConfigController) GetSystemConfigs(c *gin.Context) {
	var systemConfigs []models.SystemConfig
	result := config.DB.Find(&systemConfigs)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener configuraciones"})
		return
	}
	c.JSON(http.StatusOK, systemConfigs)
}

// GetSystemConfig obtiene una configuración por ID
func (sc *SystemConfigController) GetSystemConfig(c *gin.Context) {
	id := c.Param("id")
	var systemConfig models.SystemConfig
	result := config.DB.First(&systemConfig, id)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Configuración no encontrada"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener configuración"})
		}
		return
	}
	c.JSON(http.StatusOK, systemConfig)
}

// GetSystemConfigByKey obtiene el valor de una configuración por su clave
func (sc *SystemConfigController) GetSystemConfigByKey(c *gin.Context) {
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

// CreateSystemConfig crea una nueva configuración
func (sc *SystemConfigController) CreateSystemConfig(c *gin.Context) {
	var input struct {
		Key         string `json:"key" binding:"required"`
		Value       string `json:"value" binding:"required"`
		Description string `json:"description"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos", "details": err.Error()})
		return
	}

	// Verificar si la clave ya existe
	var existingConfig models.SystemConfig
	result := config.DB.Where("key = ?", input.Key).First(&existingConfig)
	if result.Error == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "La clave ya existe"})
		return
	}

	systemConfig := models.SystemConfig{
		Key:         input.Key,
		Value:       input.Value,
		Description: input.Description,
	}

	result = config.DB.Create(&systemConfig)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al crear configuración"})
		return
	}

	c.JSON(http.StatusCreated, systemConfig)
}

// UpdateSystemConfig actualiza una configuración existente
func (sc *SystemConfigController) UpdateSystemConfig(c *gin.Context) {
	id := c.Param("id")
	
	var systemConfig models.SystemConfig
	result := config.DB.First(&systemConfig, id)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Configuración no encontrada"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener configuración"})
		}
		return
	}

	var input struct {
		Key         string `json:"key"`
		Value       string `json:"value"`
		Description string `json:"description"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos"})
		return
	}

	// Si se intenta cambiar la clave, verificar que no exista otra con la misma
	if input.Key != "" && input.Key != systemConfig.Key {
		var existingConfig models.SystemConfig
		result := config.DB.Where("key = ? AND id != ?", input.Key, id).First(&existingConfig)
		if result.Error == nil {
			c.JSON(http.StatusConflict, gin.H{"error": "La clave ya existe en otro registro"})
			return
		}
	}

	// Actualizar campos
	updates := make(map[string]interface{})
	if input.Key != "" {
		updates["key"] = input.Key
	}
	if input.Value != "" {
		updates["value"] = input.Value
	}
	if input.Description != "" {
		updates["description"] = input.Description
	}

	result = config.DB.Model(&systemConfig).Updates(updates)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al actualizar configuración"})
		return
	}

	// Obtener el registro actualizado
	config.DB.First(&systemConfig, id)
	c.JSON(http.StatusOK, systemConfig)
}

// DeleteSystemConfig elimina una configuración
func (sc *SystemConfigController) DeleteSystemConfig(c *gin.Context) {
	id := c.Param("id")
	
	var systemConfig models.SystemConfig
	result := config.DB.First(&systemConfig, id)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Configuración no encontrada"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener configuración"})
		}
		return
	}

	result = config.DB.Delete(&systemConfig)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al eliminar configuración"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Configuración eliminada correctamente", "id": id})
}

// BulkUpdateSystemConfigs actualiza múltiples configuraciones
func (sc *SystemConfigController) BulkUpdateSystemConfigs(c *gin.Context) {
	var configs []struct {
		Key   string `json:"key" binding:"required"`
		Value string `json:"value" binding:"required"`
	}

	if err := c.ShouldBindJSON(&configs); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos"})
		return
	}

	// Iniciar transacción
	tx := config.DB.Begin()

	for _, configItem := range configs {
		result := tx.Model(&models.SystemConfig{}).
			Where("key = ?", configItem.Key).
			Update("value", configItem.Value)

		if result.Error != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al actualizar configuración"})
			return
		}
	}

	tx.Commit()
	c.JSON(http.StatusOK, gin.H{"message": "Configuraciones actualizadas correctamente"})
}