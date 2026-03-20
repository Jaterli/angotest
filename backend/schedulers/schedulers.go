// schedulers/schedulers.go
package schedulers

import (
	"log"
	"time"
	
	"github.com/go-co-op/gocron"
)

// SchedulerManager gestiona todos los schedulers de la aplicación
type SchedulerManager struct {
	scheduler *gocron.Scheduler
}

// NewSchedulerManager crea una nueva instancia del gestor de schedulers
func NewSchedulerManager() *SchedulerManager {
	return &SchedulerManager{
		scheduler: gocron.NewScheduler(time.Local),
	}
}

// InitSchedulers inicializa todos los schedulers
func (sm *SchedulerManager) InitSchedulers() {
	log.Println("🔄 Inicializando schedulers...")
	
	// Inicializar cada scheduler
	sm.startExpiredTestsScheduler()
	// sm.startOtroScheduler() // Para futuros schedulers
	
	// Iniciar el scheduler
	sm.scheduler.StartAsync()
	
	log.Println("✅ Todos los schedulers iniciados correctamente")
	
	// Obtener próxima ejecución
	if nextJob, nextTime := sm.scheduler.NextRun(); nextJob != nil {
		log.Printf("📅 Próxima ejecución: %v", nextTime)
	} else {
		log.Println("📅 No hay tareas programadas")
	}
}

// Stop detiene todos los schedulers
func (sm *SchedulerManager) Stop() {
	if sm.scheduler != nil {
		sm.scheduler.Stop()
		log.Println("🛑 Schedulers detenidos")
	}
}

// startExpiredTestsScheduler configura el scheduler para tests expirados
func (sm *SchedulerManager) startExpiredTestsScheduler() {
	log.Println("⏰ Configurando scheduler de tests expirados")
	
	// Ejecutar cada día a las 02:00 AM
	job, err := sm.scheduler.Every(1).Day().At("02:00").Do(func() {
		log.Printf("▶️ [%s] Ejecutando tarea: marcar tests expirados", 
			time.Now().Format("2006-01-02 15:04:05"))
		
		// Usar la versión del scheduler que no depende de Gin
		MarkInProgressAsExpiredScheduler()
	})
	
	if err != nil {
		log.Printf("❌ Error programando tarea: %v", err)
		return
	}
	
	// Agregar tag para identificar el job
	job.Tag("expired-tests")
	log.Println("✅ Job de tests expirados configurado con tag: 'expired-tests'")
}


