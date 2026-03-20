// schedulers/mark_in_progress_as_expired.go
package schedulers

import (
	"log"
	"time"
	"strconv"

	"angotest/config"
	"angotest/models"
)

// MarkInProgressAsExpiredScheduler es la versión para el scheduler (sin Gin)
func MarkInProgressAsExpiredScheduler() {
	startTime := time.Now()
	
	// Obtener la configuración de días desde system_configs
	var systemConfig models.SystemConfig
	days := 30 // valor por defecto
	
	if err := config.DB.Where("key = ?", "mark_in_progress_as_expired_after_days").First(&systemConfig).Error; err == nil {
		if val, err := strconv.Atoi(systemConfig.Value); err == nil {
			days = val
		}
	}
	
	processExpiredTestsScheduler(days, startTime)
}

// processExpiredTestsScheduler realiza la actualización de los tests (sin Gin)
func processExpiredTestsScheduler(days int, startTime time.Time) {
	// Calcular la fecha límite (started_at debe ser menor a esta fecha)
	thresholdDate := time.Now().AddDate(0, 0, -days)
	
	// Actualizar los resultados que están en in_progress y tienen started_at anterior a la fecha límite
	result := config.DB.Model(&models.Result{}).
		Where("status = ?", "in_progress").
		Where("started_at < ?", thresholdDate).
		Update("status", "expired")
	
	if result.Error != nil {
		log.Printf("❌ Error al actualizar los tests: %v", result.Error)
		return
	}
	
	executionTime := time.Since(startTime)
	
	if result.RowsAffected > 0 {
		log.Printf("✅ %d tests marcados como expirados en %v (threshold: %s)", 
			result.RowsAffected, 
			executionTime,
			thresholdDate.Format("2006-01-02 15:04:05"))
	} else {
		log.Printf("ℹ️ No se encontraron tests in_progress anteriores a %s", 
			thresholdDate.Format("2006-01-02"))
	}
}