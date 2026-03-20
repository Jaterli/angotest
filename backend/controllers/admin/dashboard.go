package admin

import (
    "net/http"
    "time"	

    "angotest/config"
    "angotest/models"

    "github.com/gin-gonic/gin"
)

// ====== Estructuras para el dashboard ======

// DashboardResponse - Respuesta principal del dashboard
type DashboardResponse struct {
    Totals       DashboardTotals    `json:"totals"`
    TopTests     TopTestsLists      `json:"top_tests"`
    UserLists    UserLists          `json:"user_lists"`
}

// DashboardTotals - Totales del dashboard
type DashboardTotals struct {
    TotalUsers        int64 `json:"total_users"`
    ActiveUsers       int64 `json:"active_users"`
    TotalTests        int64 `json:"total_tests"`
    InactiveTests     int64 `json:"inactive_tests"`
    CompletedTests    int64 `json:"completed_tests"`
    InProgressTests   int64 `json:"in_progress_tests"`
    ExpiredTests      int64 `json:"expired_tests"`
    AdvancedTests     int64 `json:"advanced_tests"`
    IntermediateTests int64 `json:"intermediate_tests"`
    BeginnerTests     int64 `json:"beginner_tests"`
}

// TestWithCountForDashboard - Test con conteo
type TestWithCountForDashboard struct {
    ID      uint   `json:"id"`
    Title   string `json:"title"`
    Count   int64  `json:"count"`
}

// TopTestsLists - Listas de tests con diferentes métricas
type TopTestsLists struct {
    MostCompleted        []TestWithCountForDashboard `json:"most_completed"`
    MostIncomplete       []TestWithCountForDashboard `json:"most_incomplete"`
    MostExpired          []TestWithCountForDashboard `json:"most_expired"`
    LeastStartedOldest   []TestWithDate              `json:"least_started_oldest"`
    HighestAccuracy      []TestWithRate              `json:"highest_accuracy"`
    LowestAccuracy       []TestWithRate              `json:"lowest_accuracy"`
    HighestAvgTime       []TestWithTime              `json:"highest_avg_time"`
    LowestAvgTime        []TestWithTime              `json:"lowest_avg_time"`
}

// UserLists - Listas de usuarios
type UserLists struct {
    NewUsersByMonth   []UserWithCount  `json:"new_users_by_month"`
    MostActiveUsers   []UserWithCount  `json:"most_active_users"`
    LeastActiveOldest []UserWithDate   `json:"least_active_oldest"`
    RecentLogin       []UserWithDate   `json:"recent_login"`
    OldestLogin       []UserWithDate   `json:"oldest_login"`
}

// TestWithDate - Test con fecha
type TestWithDate struct {
    ID          uint      `json:"id"`
    Title       string    `json:"title"`
    AttemptCount int64     `json:"attempt_count"`
    Date        time.Time `json:"date"`	
}

// TestWithRate - Test con tasa de aciertos
type TestWithRate struct {
    ID           uint    `json:"id"`
    Title        string  `json:"title"`
    AccuracyRate float64 `json:"accuracy_rate"`
}

// TestWithTime - Test con tiempo promedio
type TestWithTime struct {
    ID          uint    `json:"id"`
    Title       string  `json:"title"`
    AvgTime     float64 `json:"avg_time"`
}

// UserWithCount - Usuario con conteo
type UserWithCount struct {
    ID       uint   `json:"id"`
    Username string `json:"username"`
    Role     string `json:"role"`
    Count    int64  `json:"count"`
}

// UserWithDate - Usuario con fecha
type UserWithDate struct {
    ID       uint      `json:"id"`
    Username string    `json:"username"`
    Role     string    `json:"role"`
    Date     time.Time `json:"date"`
}

// DashboardFilters - Filtros para el dashboard (MODIFICADO)
type DashboardFilters struct {
    StartDate   string `form:"start_date" binding:"omitempty,datetime=2006-01-02"`
    EndDate     string `form:"end_date" binding:"omitempty,datetime=2006-01-02"`
    Limit       int    `form:"limit" binding:"omitempty,min=1,max=50"`
}

// ====== Endpoint principal del dashboard ======
func GetAdminDashboard(c *gin.Context) {
    var filters DashboardFilters
    if err := c.ShouldBindQuery(&filters); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    // Configurar valores por defecto
    if filters.Limit == 0 {
        filters.Limit = 10 // Top 10 por defecto
    }

    // Preparar la respuesta
    dashboard := DashboardResponse{
        Totals:    DashboardTotals{},
        TopTests:  TopTestsLists{},
        UserLists: UserLists{},
    }

    // Obtener todos los totales
    if err := getDashboardTotals(c, &dashboard.Totals, filters); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener totales: " + err.Error()})
        return
    }

    // Obtener listas de tests
    if err := getTopTestsLists(c, &dashboard.TopTests, filters); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener listas de tests: " + err.Error()})
        return
    }

    // Obtener listas de usuarios
    if err := getUserLists(c, &dashboard.UserLists, filters); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener listas de usuarios: " + err.Error()})
        return
    }

    c.JSON(http.StatusOK, dashboard)
}

// ====== Funciones auxiliares ======

// getDashboardTotals - Obtiene todos los totales del dashboard
func getDashboardTotals(c *gin.Context, totals *DashboardTotals, filters DashboardFilters) error {
    db := config.DB
    activeThreshold := 5 // Número de tests para considerar usuario activo

    dateCondition := getDateCondition(filters, "user")

    // Total de usuarios registrados
    query := db.Model(&models.User{})
    if dateCondition != "" {
        query = query.Where(dateCondition)
    }
    if err := query.Count(&totals.TotalUsers).Error; err != nil {
        return err
    }

    // Usuarios activos (con al menos activeThreshold tests completados)
    activeQuery := db.Model(&models.User{}).
        Joins("JOIN results ON results.user_id = users.id AND results.status = 'completed'")
    if dateCondition != "" {
        // Adaptar la condición para la tabla results
        resultDateCondition := getDateCondition(filters, "result")
        if resultDateCondition != "" {
            activeQuery = activeQuery.Where(resultDateCondition)
        }
    }
    if err := activeQuery.
        Group("users.id").
        Having("COUNT(results.id) >= ?", activeThreshold).
        Count(&totals.ActiveUsers).Error; err != nil {
        return err
    }

    // Tests totales creados
    // if err := db.Model(&models.Test{}).Count(&totals.TotalTests).Error; err != nil {
    //     return err
    // }

    // Tests desactivados (no dependen de fecha)
    // if err := db.Model(&models.Test{}).Where("is_active = ?", false).Count(&totals.InactiveTests).Error; err != nil {
    //     return err
    // }
  
    var counts struct {
        Completed  int64
        InProgress int64
        Expired    int64
    }
    
    resultDateCondition := getDateCondition(filters, "result")
    resultQuery := db.Model(&models.Result{}).Table("results AS r")
    if resultDateCondition != "" {
        resultQuery = resultQuery.Where(resultDateCondition)
    }

    if err := resultQuery.
        Select(`
            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
            SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
            SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) as expired
        `).
        Scan(&counts).Error; err != nil {
        return err
    }
    
    totals.CompletedTests = counts.Completed
    totals.InProgressTests = counts.InProgress
    totals.ExpiredTests = counts.Expired

    testDateCondition := getDateCondition(filters, "test")
    
    testQuery := db.Model(&models.Test{})
    if testDateCondition != "" {
        testQuery = testQuery.Where(testDateCondition)
    }

    if err := testQuery.Count(&totals.TotalTests).Error; err != nil {
        return err
    }    

    if err := testQuery.Model(&models.Test{}).Where("is_active = ?", false).Count(&totals.InactiveTests).Error; err != nil {
        return err
    }    

    if err := testQuery.Where("level = ?", "Avanzado").Count(&totals.AdvancedTests).Error; err != nil {
        return err
    }

    if err := testQuery.Where("level = ?", "Intermedio").Count(&totals.IntermediateTests).Error; err != nil {
        return err
    }

    if err := testQuery.Where("level = ?", "Principiante").Count(&totals.BeginnerTests).Error; err != nil {
        return err
    }

    return nil
}

// getTopTestsLists - Obtiene las listas de tests
func getTopTestsLists(c *gin.Context, lists *TopTestsLists, filters DashboardFilters) error {
    // 1. Tests con más completados
    if err := getMostCompletedTests(&lists.MostCompleted, filters); err != nil {
        return err
    }

    // 2. Tests con más incompletos (en progreso)
    if err := getMostIncompleteTests(&lists.MostIncomplete, filters); err != nil {
        return err
    }

    // 3. Tests con más expiraciones
    if err := getMostExpiredTests(&lists.MostExpired, filters); err != nil {
        return err
    }

    // 4. Tests menos iniciados y más antiguos
    if err := getLeastStartedOldestTests(&lists.LeastStartedOldest, filters); err != nil {
        return err
    }

    // 5. Tests con mayor tasa de aciertos
    if err := getTestsByAccuracy(&lists.HighestAccuracy, filters, true); err != nil {
        return err
    }

    // 6. Tests con menor tasa de aciertos
    if err := getTestsByAccuracy(&lists.LowestAccuracy, filters, false); err != nil {
        return err
    }

    // 7. Tests con mayor tiempo promedio
    if err := getTestsByAvgTime(&lists.HighestAvgTime, filters, true); err != nil {
        return err
    }

    // 8. Tests con menor tiempo promedio
    if err := getTestsByAvgTime(&lists.LowestAvgTime, filters, false); err != nil {
        return err
    }

    return nil
}

// getUserLists - Obtiene las listas de usuarios
func getUserLists(c *gin.Context, lists *UserLists, filters DashboardFilters) error {
    // 1. Nuevos usuarios por período
    if err := getNewUsersByPeriod(&lists.NewUsersByMonth, filters); err != nil {
        return err
    }

    // 2. Usuarios más activos
    if err := getMostActiveUsers(&lists.MostActiveUsers, filters); err != nil {
        return err
    }

    // 3. Usuarios menos activos y más antiguos
    if err := getLeastActiveOldestUsers(&lists.LeastActiveOldest, filters); err != nil {
        return err
    }

    // 4. Usuarios con login más reciente
    if err := getUsersByLoginDate(&lists.RecentLogin, filters, true); err != nil {
        return err
    }

    // 5. Usuarios con login más antiguo
    if err := getUsersByLoginDate(&lists.OldestLogin, filters, false); err != nil {
        return err
    }

    return nil
}

// ====== Funciones específicas para cada métrica ======

func getMostCompletedTests(results *[]TestWithCountForDashboard, filters DashboardFilters) error {
    dateCondition := getDateCondition(filters, "result")
    
    query := `
        SELECT 
            t.id,
            t.title,
            COUNT(r.id) as count
        FROM tests t
        LEFT JOIN results r ON r.test_id = t.id AND r.status = 'completed'
    `
    
    if dateCondition != "" {
        // Extraer la condición sin el alias de tabla para usarla en el WHERE
        whereClause := extractWhereClause(dateCondition, "r")
        query += " WHERE " + whereClause
    }
    
    query += `
        GROUP BY t.id, t.title
        ORDER BY count DESC
        LIMIT ?
    `
    
    return config.DB.Raw(query, filters.Limit).Scan(results).Error
}

func getMostIncompleteTests(results *[]TestWithCountForDashboard, filters DashboardFilters) error {
    dateCondition := getDateCondition(filters, "result")
    
    query := `
        SELECT 
            t.id,
            t.title,
            COUNT(r.id) as count
        FROM tests t
        LEFT JOIN results r ON r.test_id = t.id AND r.status = 'in_progress'
    `
    
    if dateCondition != "" {
        whereClause := extractWhereClause(dateCondition, "r")
        query += " WHERE " + whereClause
    }
    
    query += `
        GROUP BY t.id, t.title
        ORDER BY count DESC
        LIMIT ?
    `
    
    return config.DB.Raw(query, filters.Limit).Scan(results).Error
}

func getMostExpiredTests(results *[]TestWithCountForDashboard, filters DashboardFilters) error {   
    dateCondition := getDateCondition(filters, "result")
    
    query := `
        SELECT 
            t.id,
            t.title,
            COUNT(r.id) as count
        FROM tests t
        LEFT JOIN results r ON r.test_id = t.id AND r.status = 'expired'
    `
    
    if dateCondition != "" {
        whereClause := extractWhereClause(dateCondition, "r")
        query += " WHERE " + whereClause
    }
    
    query += `
        GROUP BY t.id, t.title
        ORDER BY count DESC
        LIMIT ?
    `    
    return config.DB.Raw(query, filters.Limit).Scan(results).Error
}

func getLeastStartedOldestTests(results *[]TestWithDate, filters DashboardFilters) error {
    dateCondition := getDateCondition(filters, "test")
    
    baseQuery := `
        SELECT 
            t.id,
            t.title,
            t.created_at as date,
            COUNT(r.id) as attempt_count
        FROM tests t
        LEFT JOIN results r ON r.test_id = t.id
    `
    
    if dateCondition != "" {
        whereClause := extractWhereClause(dateCondition, "t")
        baseQuery += " WHERE " + whereClause
    }
    
    query := baseQuery + `
        GROUP BY t.id, t.title, t.created_at
        ORDER BY COUNT(r.id) ASC, t.created_at ASC
        LIMIT ?
    `    
    return config.DB.Raw(query, filters.Limit).Scan(results).Error
}

func getTestsByAccuracy(results *[]TestWithRate, filters DashboardFilters, highest bool) error {
    orderBy := "DESC"
    if !highest {
        orderBy = "ASC"
    }
    
    dateCondition := getDateCondition(filters, "result")
    
    baseQuery := `
        SELECT 
            t.id,
            t.title,
            CASE 
                WHEN COUNT(r.id) = 0 THEN 0
                ELSE AVG(r.correct_answers * 100.0 / NULLIF((r.correct_answers + r.wrong_answers), 0))
            END as accuracy_rate
        FROM tests t
        LEFT JOIN results r ON r.test_id = t.id AND r.status = 'completed'
    `
    
    if dateCondition != "" {
        whereClause := extractWhereClause(dateCondition, "r")
        baseQuery += " WHERE " + whereClause
    }
    
    query := baseQuery + `
        GROUP BY t.id, t.title
        HAVING COUNT(r.id) > 0
        ORDER BY accuracy_rate ` + orderBy + `
        LIMIT ?
    `
    
    return config.DB.Raw(query, filters.Limit).Scan(results).Error
}

func getTestsByAvgTime(results *[]TestWithTime, filters DashboardFilters, highest bool) error {
    orderBy := "DESC"
    if !highest {
        orderBy = "ASC"
    }
    
    dateCondition := getDateCondition(filters, "result")
    
    baseQuery := `
        SELECT 
            t.id,
            t.title,
            AVG(r.time_taken) as avg_time
        FROM tests t
        LEFT JOIN results r ON r.test_id = t.id AND r.status = 'completed'
    `
    
    if dateCondition != "" {
        whereClause := extractWhereClause(dateCondition, "r")
        baseQuery += " WHERE " + whereClause
    }
    
    query := baseQuery + `
        GROUP BY t.id, t.title
        HAVING COUNT(r.id) > 0
        ORDER BY avg_time ` + orderBy + `
        LIMIT ?
    `
    
    return config.DB.Raw(query, filters.Limit).Scan(results).Error
}

func getNewUsersByPeriod(results *[]UserWithCount, filters DashboardFilters) error {
    dateCondition := getDateCondition(filters, "user")
    
    baseQuery := `
        SELECT 
            u.id,
            u.username,
            u.role,
            COUNT(*) as count
        FROM users u
    `
    
    if dateCondition != "" {
        baseQuery += " WHERE " + dateCondition
    }
    
    query := baseQuery + `
        GROUP BY u.id, u.username, u.role
        ORDER BY count DESC
        LIMIT ?
    `
    
    return config.DB.Raw(query, filters.Limit).Scan(results).Error
}

func getMostActiveUsers(results *[]UserWithCount, filters DashboardFilters) error {
    dateCondition := getDateCondition(filters, "result")
    
    baseQuery := `
        SELECT 
            u.id,
            u.username,
            u.role,
            COUNT(r.id) as count
        FROM users u
        LEFT JOIN results r ON r.user_id = u.id AND r.status = 'completed'
    `
    
    if dateCondition != "" {
        whereClause := extractWhereClause(dateCondition, "r")
        baseQuery += " WHERE " + whereClause
    }
    
    query := baseQuery + `
        GROUP BY u.id, u.username, u.role
        HAVING COUNT(r.id) > 0
        ORDER BY count DESC
        LIMIT ?
    `
    
    return config.DB.Raw(query, filters.Limit).Scan(results).Error
}

func getLeastActiveOldestUsers(results *[]UserWithDate, filters DashboardFilters) error {
    query := `
        SELECT 
            u.id,
            u.username,
            u.role,
            u.registered_at as date
        FROM users u
        LEFT JOIN results r ON r.user_id = u.id AND r.status = 'completed'
        GROUP BY u.id, u.username, u.role, u.registered_at
        HAVING COUNT(r.id) = 0
        ORDER BY u.registered_at ASC
        LIMIT ?
    `
    
    return config.DB.Raw(query, filters.Limit).Scan(results).Error
}

func getUsersByLoginDate(results *[]UserWithDate, filters DashboardFilters, recent bool) error {
    orderBy := "DESC"
    if !recent {
        orderBy = "ASC"
    }
    
    query := `
        SELECT 
            u.id,
            u.username,
            u.role,
            u.login_at as date
        FROM users u
        WHERE u.login_at IS NOT NULL
        ORDER BY u.login_at ` + orderBy + `
        LIMIT ?
    `
    
    return config.DB.Raw(query, filters.Limit).Scan(results).Error
}

// extractWhereClause - Extrae la condición WHERE sin el alias de tabla
func extractWhereClause(condition string, tableAlias string) string {
    // Si la condición ya tiene el formato "table.column = value", 
    // reemplazamos el alias de tabla genérico por el específico
    // Esto es un helper simple - en producción podrías necesitar algo más robusto
    if condition != "" {
        // Reemplazar condiciones genéricas por las específicas según el alias
        // Por ejemplo: "created_at >= '2024-01-01'" -> "t.created_at >= '2024-01-01'"
        if tableAlias != "" {
            // Esta es una implementación simplificada
            // Asumimos que la condición se refiere a columnas que existen en la tabla
            return condition
        }
    }
    return condition
}

// getDateCondition - Genera la condición WHERE basada en los filtros (MODIFICADO)
func getDateCondition(filters DashboardFilters, model string) string {
    var dateColumn string
    
    switch model {
    case "test":
        dateColumn = "created_at"
    case "user":
        dateColumn = "registered_at"
    case "result":
        dateColumn = "started_at"
    default:
        dateColumn = "created_at"
    }

    // Si tenemos fechas específicas, usarlas
    if filters.StartDate != "" && filters.EndDate != "" {
        startDate := filters.StartDate
        endDate := filters.EndDate
        
        // Asegurar que endDate incluya todo el día
        endDateTime, _ := time.Parse("2006-01-02", endDate)
        endDateTime = endDateTime.Add(24 * time.Hour).Add(-time.Second)
        
        return dateColumn + " >= '" + startDate + "' AND " + dateColumn + " <= '" + endDateTime.Format("2006-01-02 15:04:05") + "'"
    }
    
    // Si solo tenemos start_date
    if filters.StartDate != "" {
        return dateColumn + " >= '" + filters.StartDate + "'"
    }
    
    // Si solo tenemos end_date
    if filters.EndDate != "" {
        endDateTime, _ := time.Parse("2006-01-02", filters.EndDate)
        endDateTime = endDateTime.Add(24 * time.Hour).Add(-time.Second)
        return dateColumn + " <= '" + endDateTime.Format("2006-01-02 15:04:05") + "'"
    }
    
    return ""
}


// ====== Endpoint separado para estadísticas detalladas de tests ======
func GetTestDetailedStats(c *gin.Context) {
    testID := c.Param("test_id")
    
    var stats struct {
        TotalAttempts     int64   `json:"total_attempts"`
        CompletedAttempts int64   `json:"completed_attempts"`
        InProgressAttempts int64  `json:"in_progress_attempts"`
        AvgAccuracy       float64 `json:"avg_accuracy"`
        AvgTime           float64 `json:"avg_time"`
        CompletionRate    float64 `json:"completion_rate"`
        DifficultyLevel   string  `json:"difficulty_level"`
        TestTitle         string  `json:"test_title"`
        TopicHierarchy    struct {
            MainTopic     string `json:"main_topic"`
            SubTopic      string `json:"sub_topic"`
            SpecificTopic string `json:"specific_topic"`
        } `json:"topic_hierarchy"`
    }
    
    // Obtener información básica del test
    var test models.Test
    if err := config.DB.First(&test, testID).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "Test no encontrado"})
        return
    }
    
    stats.TestTitle = test.Title
    stats.TopicHierarchy.MainTopic = test.MainTopic
    stats.TopicHierarchy.SubTopic = test.SubTopic
    stats.TopicHierarchy.SpecificTopic = test.SpecificTopic
    stats.DifficultyLevel = test.Level
    
    // Obtener estadísticas de resultados
    var resultStats struct {
        TotalAttempts     int64
        CompletedAttempts int64
        InProgressAttempts int64
        AvgCorrectAnswers float64
        AvgWrongAnswers   float64
        AvgTimeTaken      float64
    }
    
    err := config.DB.Model(&models.Result{}).
        Select(`
            COUNT(*) as total_attempts,
            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_attempts,
            SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_attempts,
            AVG(correct_answers) as avg_correct_answers,
            AVG(wrong_answers) as avg_wrong_answers,
            AVG(time_taken) as avg_time_taken
        `).
        Where("test_id = ?", testID).
        Scan(&resultStats).Error
    
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener estadísticas: " + err.Error()})
        return
    }
    
    stats.TotalAttempts = resultStats.TotalAttempts
    stats.CompletedAttempts = resultStats.CompletedAttempts
    stats.InProgressAttempts = resultStats.InProgressAttempts
    
    // Calcular tasas y promedios
    if resultStats.TotalAttempts > 0 {
        stats.CompletionRate = float64(resultStats.CompletedAttempts) / float64(resultStats.TotalAttempts) * 100
    }
    
    if resultStats.CompletedAttempts > 0 {
        stats.AvgAccuracy = resultStats.AvgCorrectAnswers / (resultStats.AvgCorrectAnswers + resultStats.AvgWrongAnswers) * 100
        stats.AvgTime = resultStats.AvgTimeTaken
    }
    
    c.JSON(http.StatusOK, stats)
}

// ====== Endpoint para estadísticas de usuarios ======
func GetUserDetailedStats(c *gin.Context) {
    userID := c.Param("user_id")
    
    var stats struct {
        UserInfo struct {
            Username   string    `json:"username"`
            Email      string    `json:"email"`
            RegisteredAt  time.Time `json:"registered_at"`
            LastLogin  time.Time `json:"last_login"`
            Role       string    `json:"role"`
        } `json:"user_info"`
        TestStats struct {
            TotalTests         int64   `json:"total_tests"`
            CompletedTests     int64   `json:"completed_tests"`
            InProgressTests    int64   `json:"in_progress_tests"`
            ExpiredTests       int64   `json:"expired_tests"`
            AvgAccuracy        float64 `json:"avg_accuracy"`
            AvgTimePerTest     float64 `json:"avg_time_per_test"`
            FavoriteTopic      string  `json:"favorite_topic"`
            FavoriteLevel      string  `json:"favorite_level"`
        } `json:"test_stats"`
        RecentActivity []struct {
            TestTitle  string    `json:"test_title"`
            Status     string    `json:"status"`
            Accuracy   float64   `json:"accuracy"`
            TimeTaken  int       `json:"time_taken"`
            StartedAt  time.Time `json:"started_at"`
        } `json:"recent_activity"`
    }
    
    // Obtener información del usuario
    var user models.User
    if err := config.DB.First(&user, userID).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "Usuario no encontrado"})
        return
    }
    
    stats.UserInfo.Username = user.Username
    stats.UserInfo.Email = user.Email
    stats.UserInfo.RegisteredAt = user.RegisteredAt
    stats.UserInfo.LastLogin = user.LoginAt
    stats.UserInfo.Role = user.Role
    
    // Obtener estadísticas de resultados del usuario
    var resultStats struct {
        TotalResults    int64
        Completed       int64
        InProgress      int64
        Expired       int64
        AvgCorrect      float64
        AvgWrong        float64
        AvgTime         float64
    }
    
    err := config.DB.Model(&models.Result{}).
        Select(`
            COUNT(*) as total_results,
            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
            SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
            SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) as expired,
            AVG(correct_answers) as avg_correct,
            AVG(wrong_answers) as avg_wrong,
            AVG(time_taken) as avg_time
        `).
        Where("user_id = ?", userID).
        Scan(&resultStats).Error
    
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener estadísticas: " + err.Error()})
        return
    }
    
    stats.TestStats.TotalTests = resultStats.TotalResults
    stats.TestStats.CompletedTests = resultStats.Completed
    stats.TestStats.InProgressTests = resultStats.InProgress
    stats.TestStats.ExpiredTests = resultStats.Expired
    
    if resultStats.Completed > 0 {
        stats.TestStats.AvgAccuracy = resultStats.AvgCorrect / (resultStats.AvgCorrect + resultStats.AvgWrong) * 100
        stats.TestStats.AvgTimePerTest = resultStats.AvgTime
    }
    
    // Obtener tema favorito
    var favoriteTopic struct {
        MainTopic string
        Count     int64
    }
    
    config.DB.Model(&models.Result{}).
        Select("tests.main_topic, COUNT(*) as count").
        Joins("JOIN tests ON tests.id = results.test_id").
        Where("results.user_id = ?", userID).
        Group("tests.main_topic").
        Order("count DESC").
        Limit(1).
        Scan(&favoriteTopic)
    
    stats.TestStats.FavoriteTopic = favoriteTopic.MainTopic
    
    // Obtener nivel favorito
    var favoriteLevel struct {
        Level string
        Count int64
    }
    
    config.DB.Model(&models.Result{}).
        Select("tests.level, COUNT(*) as count").
        Joins("JOIN tests ON tests.id = results.test_id").
        Where("results.user_id = ?", userID).
        Group("tests.level").
        Order("count DESC").
        Limit(1).
        Scan(&favoriteLevel)
    
    stats.TestStats.FavoriteLevel = favoriteLevel.Level
    
    // Obtener actividad reciente (últimos 10 tests)
    config.DB.Model(&models.Result{}).
        Select(`
            tests.title as test_title,
            results.status,
            CASE 
                WHEN results.status = 'completed' THEN 
                    results.correct_answers * 100.0 / (results.correct_answers + results.wrong_answers)
                ELSE 0 
            END as accuracy,
            results.time_taken,
            results.started_at
        `).
        Joins("JOIN tests ON tests.id = results.test_id").
        Where("results.user_id = ?", userID).
        Order("results.started_at DESC").
        Limit(10).
        Scan(&stats.RecentActivity)
    
    c.JSON(http.StatusOK, stats)
}