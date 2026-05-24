package routes

import (
	"angotest/controllers/user"
	"angotest/controllers/admin"
	"angotest/controllers/shared"
	"angotest/middleware"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(r *gin.Engine) {
	api := r.Group("/api")
	{
		
		topicsCtrl := &shared.TopicsController{}		
		invitationCtrl := &shared.InvitationController{}

	    // Rutas públicas (sin autenticación)
		public := api.Group("/")
		{
			public.POST("/auth/register", shared.Register)
			public.POST("/auth/login", shared.Login)
			public.POST("/auth/logout", shared.Logout)
			public.GET("/auth/check-auth", shared.CheckAuth)			

			// Topics
			public.GET("/topics", topicsCtrl.GetTopics)
			public.GET("/topics/main", topicsCtrl.GetMainTopics)
			public.GET("/topics/:main_topic/sub_topics", topicsCtrl.GetSubTopics)
			public.GET("/topics/:main_topic/:sub_topic/specific_topics", topicsCtrl.GetSpecificTopics)
			public.POST("/topics/validate", topicsCtrl.ValidateTopic)

			// Aceptar invitaciones a realizar test
			public.GET("/invitations/check-invitation", middleware.OptionalAuthMiddleware(), invitationCtrl.CheckInvitation) 
			public.POST("/invitations/accept-invitation", middleware.OptionalAuthMiddleware(), invitationCtrl.AcceptInvitation)	

			public.POST("/auth/forgot-password", shared.ForgotPassword)
			public.POST("/auth/reset-password", shared.ResetPassword)
			public.GET("/auth/validate-reset-token", shared.ValidateResetToken)

   			public.GET("/system-configsForUser/key/:key", shared.GetSystemConfigByKey) // Para que el frontend pueda obtener configuraciones públicas sin necesidad de autenticación

			public.POST("/contact", shared.HandleContact)
		}	

		api.GET("/ping", func(c *gin.Context) {
			c.JSON(200, gin.H{"message": "pong"})
		})


		// ====== RUTAS PARA USUARIOS AUTENTICADOS (user o admin) ======
		userRoutes := api.Group("/")
		userRoutes.Use(middleware.AuthMiddleware(), middleware.UserMiddleware()) // Solo usuarios autenticados

		// Tests para usuarios
		userRoutes.GET("/tests/:test_id", user.GetTestByID)
		userRoutes.POST("/tests/:test_id/save", user.SaveOrUpdateResult)      // Guardar progreso o finalizar
		userRoutes.GET("/tests/:test_id/progress", user.GetTestProgress)      // Obtener progreso
		userRoutes.GET("/tests/not-started", user.GetNotStartedTests)			
		userRoutes.GET("/tests/completed", user.GetMyCompletedTests)
		userRoutes.GET("/tests/in-progress", user.GetMyInProgressTests)
		userRoutes.DELETE("/tests/:test_id/progress", user.DeleteTestProgress) // Eliminar progreso
		userRoutes.GET("/tests/:test_id/questions", user.GetTestQuestions) // Para obtener todas las preguntas paginadas
		userRoutes.GET("/tests/:test_id/questions/:question_number", user.GetSingleQuestion) // Para obtener una pregunta específica		
		userRoutes.GET("/tests/:test_id/next-question", user.GetNextUnansweredQuestion)

		// Resultados
		userRoutes.GET("/results/:result_id/incorrect-answers", user.GetIncorrectAnswers)		

		// Dashboard
		userRoutes.GET("/dashboard/personaldata", user.GetDashboardData)
		userRoutes.GET("/dashboard/rankings", user.GetRankings)		

		// Perfil de usuario
		//userRoutes.GET("/profile/me", user.Me)
		userRoutes.GET("/profile/me", shared.GetCurrentUser)		
		userRoutes.PUT("/profile/update", user.UpdateProfile)
		userRoutes.POST("/profile/update-email-password", user.UpdateEmailPassword) 
		userRoutes.POST("/profile/update-guest-profile", user.UpdateGuestProfile)		
    	userRoutes.DELETE("/profile/deactivate-account", user.DeactivateAccount)		

		// AI Requests para usuarios y admin
		userRoutes.POST("/ai-requests/generate-ai-test", shared.GenerateAITest)
		userRoutes.GET("/ai-requests/quota", shared.GetCurrentUserQuota)
		
		// Invitaciones a hacer determinado test
		userRoutes.POST("/invitations/create", invitationCtrl.CreateInvitation)
		userRoutes.GET("/invitations/my-invitations", invitationCtrl.GetUserInvitations)	

		// ====== RUTAS EXCLUSIVAS PARA ADMINISTRADORES ======
		adminRoutes := api.Group("/admin")
		adminRoutes.Use(middleware.AuthMiddleware(), middleware.AdminMiddleware()) // Solo administradores
		
		// CRUD de tests
		adminRoutes.GET("/tests/all", admin.GetAllTests)
		//adminRoutes.GET("/tests/filter-options", admin.GetTestsFilterOptions)
		adminRoutes.GET("/tests/:test_id", admin.GetTestByID)
		adminRoutes.POST("/tests/create", admin.CreateTest)
		adminRoutes.PUT("/tests/:test_id/edit", admin.UpdateTest)
		adminRoutes.DELETE("/tests/:test_id/delete", admin.DeleteTest)
		
		// Gestión de users
		adminRoutes.PUT("/users/update", admin.UpdateUser)
		adminRoutes.GET("/users/stats", admin.GetUsersWithStats)			
		adminRoutes.GET("/users/:user_id/profile", admin.GetUserProfile)
		adminRoutes.DELETE("/users/:user_id/delete", admin.DeleteUser)  // Eliminar usuario y dependencias
		adminRoutes.GET("/users/:user_id/results", admin.GetUserResults)
		adminRoutes.GET("/users/:user_id/results/:result_id", admin.GetUserResultDetails)

		// Listado de results
		adminRoutes.GET("/results", admin.GetResultsList)
		adminRoutes.DELETE("/results/:id", admin.DeleteResult) // Eliminar resultado por id
		adminRoutes.DELETE("/results/bulk", admin.DeleteResultsBulk)  // Eliminación masiva de resultados	

		// Gestión de invitaciones
        adminRoutes.GET("/invitations", admin.GetInvitations)
        adminRoutes.GET("/invitations/stats", admin.GetInvitationStats)
        adminRoutes.DELETE("/invitations/:id", admin.DeleteInvitation)
        adminRoutes.DELETE("/invitations/bulk", admin.DeleteInvitationsBulk)

		// Gestión de cuotas
		// Obtener todas las cuotas
		qc := &admin.UserQuotaController{}
		adminRoutes.GET("/quotas", qc.GetAllUserQuotas)
		adminRoutes.GET("/quotas/user/:user_id", qc.GetUserQuota)
		adminRoutes.POST("/quotas", qc.CreateUserQuota)
		adminRoutes.PUT("/quotas/:id", qc.UpdateUserQuota)		
		adminRoutes.DELETE("/quotas/:id", qc.DeleteUserQuota)
		adminRoutes.DELETE("/quotas/bulk", qc.DeleteQuotasBulk)

	    // Rutas para SystemConfig
		systemConfigsCtrl := &admin.SystemConfigController{}
		adminRoutes.GET("/system-configs", systemConfigsCtrl.GetSystemConfigs)
		adminRoutes.GET("/system-configs/:id", systemConfigsCtrl.GetSystemConfig)
		adminRoutes.GET("/system-configs/key/:key", systemConfigsCtrl.GetSystemConfigByKey)
		adminRoutes.POST("/system-configs", systemConfigsCtrl.CreateSystemConfig)
		adminRoutes.POST("/system-configs/bulk-update", systemConfigsCtrl.BulkUpdateSystemConfigs)
		adminRoutes.PUT("/system-configs/:id", systemConfigsCtrl.UpdateSystemConfig)
		adminRoutes.PATCH("/system-configs/:id", systemConfigsCtrl.UpdateSystemConfig)
		adminRoutes.DELETE("/system-configs/:id", systemConfigsCtrl.DeleteSystemConfig)


		// Dashboard admin
		adminRoutes.GET("/dashboard", admin.GetAdminDashboard)
		adminRoutes.GET("/dashboard/tests/:test_id/stats", admin.GetTestDetailedStats)
		adminRoutes.GET("/dashboard/users/:user_id/stats", admin.GetUserDetailedStats)

        adminRoutes.POST("/topics/refresh-cache", topicsCtrl.RefreshCache)
        adminRoutes.GET("/topics/statistics", topicsCtrl.GetTopicStatistics)		

	}
}
