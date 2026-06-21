package shared

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
    "os"
    "strings"
    "io"
    "time"

    "angotest/config"
    "angotest/models"

    "github.com/gin-gonic/gin"
    "gorm.io/gorm"
)

// Configuración de proveedores de IA
type AIProviderConfig struct {
    Name        string
    APIKey      string
    BaseURL     string
    Model       string
    MaxTokens   int
    Temperature float64
}

// Obtener configuración del proveedor
func getAIProvider() *AIProviderConfig {
    groqAPIKey := os.Getenv("GROQ_API_KEY")
    if groqAPIKey != "" {
        return &AIProviderConfig{
            Name:        "groq",
            APIKey:      groqAPIKey,
            BaseURL:     "https://api.groq.com/openai/v1/chat/completions",
            Model:       os.Getenv("GROQ_MODEL"),
            MaxTokens:   os.Getenv("AI_MAXTOKENS", 8000),
            Temperature: os.Getenv("AI_TEMPERATURE", 0.5),
        }
    }
    return nil
}

// Estructura mejorada para solicitud de IA
type AIRequestPayload struct {
    Model       string                  `json:"model"`
    Messages    []AIMessage             `json:"messages"`
    Temperature float64                 `json:"temperature,omitempty"`
    MaxTokens   int                     `json:"max_tokens,omitempty"`
    Stream      bool                    `json:"stream,omitempty"`
    ResponseFormat *AIResponseFormat    `json:"response_format,omitempty"`
}

type AIMessage struct {
    Role    string `json:"role"`
    Content string `json:"content"`
}

type AIResponseFormat struct {
    Type string `json:"type"`
}

// Estructura modificada para nueva jerarquía
type GenerateTestInput struct {
    MainTopic     string `json:"main_topic"`
    SubTopic      string `json:"sub_topic"`
    SpecificTopic string `json:"specific_topic"`
    Level         string `json:"level" binding:"required,oneof=Principiante Intermedio Avanzado"`
    NumQuestions  int    `json:"num_questions" binding:"required,oneof=10 20 30 40 50"`
    NumAnswers    int    `json:"num_answers" binding:"required,oneof=3 4"`
    Language      string `json:"language" binding:"omitempty,oneof=es en fr de it pt"`
    GenerationMode string `json:"generation_mode"`
    AIPrompt      string `json:"ai_prompt"`
}

// Estructura para respuesta de IA
type AIResponse struct {
    Title       string `json:"title"`
    Description string `json:"description"`
    // (opcionales)
    MainTopic     string `json:"main_topic,omitempty"`
    SubTopic      string `json:"sub_topic,omitempty"`
    SpecificTopic string `json:"specific_topic,omitempty"`    
   
    Questions   []struct {
        QuestionText string `json:"question_text"`
        Answers      []struct {
            AnswerText string `json:"answer_text"`
            IsCorrect  bool   `json:"is_correct"`
        } `json:"answers"`
    } `json:"questions"`
}

// Generar test mock para desarrollo
func generateMockTest(input GenerateTestInput) *models.Test {
    test := &models.Test{
        Title:         fmt.Sprintf("Test de %s - %s - %s", input.MainTopic, input.SubTopic, input.SpecificTopic),
        Description:   fmt.Sprintf("Test sobre %s, en la categoría %s, tema específico: %s", 
            input.MainTopic, input.SubTopic, input.SpecificTopic),
        MainTopic:     input.MainTopic,
        SubTopic:      input.SubTopic,
        SpecificTopic: input.SpecificTopic,
        Level:         input.Level,
        CreatedBy:     0,        
        CreatedAt:     time.Now(),
    }
    
    // Generar preguntas mock
    for i := 1; i <= input.NumQuestions; i++ {
        question := models.Question{
            QuestionText: fmt.Sprintf("Pregunta %d sobre %s (%s): %s", 
                i, input.SpecificTopic, input.SubTopic, 
                fmt.Sprintf("¿Cuál es la respuesta correcta para un nivel %s?", input.Level)),
        }
        
        // Generar respuestas
        correctIndex := i % input.NumAnswers
        for j := 0; j < input.NumAnswers; j++ {
            isCorrect := j == correctIndex
            correctText := ""
            if isCorrect {
                correctText = " (Correcta)"
            }
            
            answer := models.Answer{
                AnswerText: fmt.Sprintf("Opción %c%s sobre %s en %s", 
                    'A'+j, correctText, input.SpecificTopic, input.SubTopic),
                IsCorrect: isCorrect,
            }
            question.Answers = append(question.Answers, answer)
        }
        
        test.Questions = append(test.Questions, question)
    }
    
    return test
}

// Verificar y actualizar quota del usuario
func checkUserQuota(userID uint) (bool, error) {
    monthYear := time.Now().Format("2006-01")
    
    var quota models.UserQuota
    err := config.DB.Where("user_id = ? AND month_year = ?", userID, monthYear).First(&quota).Error
    
    if err == gorm.ErrRecordNotFound {
        maxRequests := 5
        
        var systemConfig models.SystemConfig
        if err := config.DB.Where("key = ?", "ai_requests_per_month").First(&systemConfig).Error; err == nil {
            fmt.Sscanf(systemConfig.Value, "%d", &maxRequests)
        }
        
        quota = models.UserQuota{
            UserID:       userID,
            MonthYear:    monthYear,
            MaxRequests:  maxRequests,
            UsedRequests: 0,
        }
        
        if err := config.DB.Create(&quota).Error; err != nil {
            return false, err
        }
        
        return true, nil
    }
    
    if err != nil {
        return false, err
    }
    
    if quota.UsedRequests >= quota.MaxRequests {
        return false, nil
    }
    
    quota.UsedRequests++
    if err := config.DB.Save(&quota).Error; err != nil {
        return false, err
    }
    
    return true, nil
}


// Generar test con IA
func GenerateAITest(c *gin.Context) {
    userIDIfc, exists := c.Get("user_id")
    if !exists {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "Usuario no autenticado"})
        return
    }
    userID, ok := userIDIfc.(uint)
    if !ok {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "ID de usuario inválido"})
        return
    }
    
    var input GenerateTestInput
    if err := c.ShouldBindJSON(&input); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    // Modo normal (con temas especificados)
    if input.GenerationMode != "prompt" {
        if input.MainTopic == "" || input.SubTopic == "" || input.SpecificTopic == "" {
            c.JSON(http.StatusBadRequest, gin.H{
                "error": "main_topic, sub_topic y specific_topic son obligatorios si no se usa ai_prompt",
            })
            return
        }

        // Validar jerarquía de temas usando la función del modelo
        isValid, err := models.ValidateTopicHierarchy(input.MainTopic, input.SubTopic, input.SpecificTopic)
        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{
                "error": "Error al validar temas",
                "details": err.Error(),
            })
            return
        }
        
        if !isValid {
            // Obtener temas principales válidos para sugerencias usando la función del modelo
            mainTopics, _ := models.GetMainTopics()
            c.JSON(http.StatusBadRequest, gin.H{
                "error": "Combinación de temas inválida",
                "valid_main_topics": mainTopics,
                "suggestion": "Use el endpoint /api/topics/validate para obtener sugerencias",
            })
            return
        }        
    }
        
    // Validar nivel
    validLevels := models.GetPredefinedLevels()
    if !models.ContainsString(validLevels, input.Level) {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "Nivel no válido",
            "valid_levels": validLevels,
        })
        return
    }
    
    // Validar número de preguntas
    validNumQuestions := false
    for _, n := range models.GetQuestionOptions() {
        if n == input.NumQuestions {
            validNumQuestions = true
            break
        }
    }
    if !validNumQuestions {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "Número de preguntas no válido",
            "valid_options": models.GetQuestionOptions(),
        })
        return
    }
    
    // Validar número de respuestas
    validNumAnswers := false
    for _, n := range models.GetAnswerOptions() {
        if n == input.NumAnswers {
            validNumAnswers = true
            break
        }
    }
    if !validNumAnswers {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "Número de respuestas no válido",
            "valid_options": models.GetAnswerOptions(),
        })
        return
    }
    
    // Verificar quota del usuario
    hasQuota, err := checkUserQuota(userID)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al verificar quota"})
        return
    }
    
    if !hasQuota {
        c.JSON(http.StatusForbidden, gin.H{
            "error": "Has alcanzado el límite de tests generados para este mes",
            "code":  "QUOTA_EXCEEDED",
        })
        return
    }
        
    test, err := generateTestWithAI(input)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Error generando test: " + err.Error()})
        return
    }

    test.CreatedAt = time.Now()
    test.CreatedBy = userID

    if err := config.DB.Create(&test).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al guardar test: " + err.Error()})
        return
    }
    
    // Insertar nuevos topics si no existían (modo libre) usando la función del modelo
    if input.GenerationMode == "prompt" && input.AIPrompt != "" {
        // Verificar si los topics ya existen
        isValid, _ := models.ValidateTopicHierarchy(
            test.MainTopic,
            test.SubTopic,
            test.SpecificTopic,
        )
        
        if !isValid {
            // Insertar como nuevo topic usando la función del modelo
            err := models.InsertOrUpdateTopic(
                test.MainTopic,
                test.SubTopic,
                test.SpecificTopic,
                true,
            )
            if err != nil {
                // Solo log el error, no fallar la creación del test
                fmt.Printf("Warning: No se pudo guardar nuevo topic: %v\n", err)
            } else {
                // Invalidar cache ya que añadimos un nuevo topic
                models.InvalidateTopicsCache()
            }
        }
    }

    c.JSON(http.StatusOK, gin.H{
        "message": "Test generado exitosamente",
        "generated_test_id": test.ID,
        "test": gin.H{
            "id": test.ID,
            "title": test.Title,
            "description": test.Description,
            "main_topic": test.MainTopic,
            "sub_topic": test.SubTopic,
            "specific_topic": test.SpecificTopic,
            "level": test.Level,
            "questions_count": len(test.Questions),
        },
        "status": "completed",
        "quota_used": true,
    })
}


// Función principal para generar test con IA
func generateTestWithAI(input GenerateTestInput) (*models.Test, error) {
    provider := getAIProvider()
    if provider == nil {
        return generateMockTest(input), nil
    }

    // Construir prompt con la nueva jerarquía
    prompt := buildAIPrompt(input)
    
    // Preparar mensajes
    messages := []AIMessage{
        {
            Role:    "system",
            Content: getSystemPrompt(provider.Name),
        },
        {
            Role:    "user",
            Content: prompt,
        },
    }

    // Configurar payload según proveedor
    payload := AIRequestPayload{
        Model:       provider.Model,
        Messages:    messages,
        Temperature: provider.Temperature,
        MaxTokens:   provider.MaxTokens,
        Stream:      false,
    }

    if provider.Name == "groq" && strings.Contains(provider.Model, "llama3") {
        payload.ResponseFormat = &AIResponseFormat{Type: "json_object"}
    }

    // Hacer la solicitud
    return makeAIRequest(provider, payload, input)
}

// Obtener quota del usuario actual
func GetCurrentUserQuota(c *gin.Context) {
    userIDIfc, _ := c.Get("user_id")
    userID := userIDIfc.(uint)
    
    monthYear := time.Now().Format("2006-01")
    
    var quota models.UserQuota
    err := config.DB.Where("user_id = ? AND month_year = ?", userID, monthYear).First(&quota).Error
    
    if err == gorm.ErrRecordNotFound {
        maxRequests := 5
        var sysConfig models.SystemConfig
        if err := config.DB.Where("key = ?", "ai_requests_per_month").First(&sysConfig).Error; err == nil {
            fmt.Sscanf(sysConfig.Value, "%d", &maxRequests)
        }
        
        quota = models.UserQuota{
            UserID:       userID,
            MonthYear:    monthYear,
            MaxRequests:  maxRequests,
            UsedRequests: 0,
        }
        
        config.DB.Create(&quota)
    }
    
    response := gin.H{
        "month_year":         monthYear,
        "max_requests":       quota.MaxRequests,
        "used_requests":      quota.UsedRequests,
        "remaining_requests": quota.MaxRequests - quota.UsedRequests,
        "percentage_used":    float64(quota.UsedRequests) / float64(quota.MaxRequests) * 100,
    }
    
    c.JSON(http.StatusOK, response)
}

// Hacer solicitud a la API del proveedor
func makeAIRequest(provider *AIProviderConfig, payload AIRequestPayload, input GenerateTestInput) (*models.Test, error) {
    requestBody, err := json.Marshal(payload)
    if err != nil {
        return generateMockTest(input), err
    }

    req, err := http.NewRequest("POST", provider.BaseURL, bytes.NewBuffer(requestBody))
    if err != nil {
        return generateMockTest(input), err
    }

    req.Header.Set("Content-Type", "application/json")
    req.Header.Set("Authorization", "Bearer "+provider.APIKey)
    
    if provider.Name == "groq" {
        req.Header.Set("User-Agent", "AngoTest/1.0")
    }

    client := &http.Client{Timeout: 90 * time.Second}
    resp, err := client.Do(req)
    if err != nil {
        return generateMockTest(input), fmt.Errorf("error de conexión con %s: %v", provider.Name, err)
    }
    defer resp.Body.Close()

    if resp.StatusCode != http.StatusOK {
        body, _ := io.ReadAll(resp.Body)
        return generateMockTest(input), fmt.Errorf("error %s API (status %d): %s", 
            provider.Name, resp.StatusCode, string(body))
    }

    var result map[string]interface{}
    if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
        return generateMockTest(input), fmt.Errorf("error al parsear respuesta de %s: %v", provider.Name, err)
    }

    return parseAIResponse(result, input, provider.Name)
}

// Prompt del sistema según proveedor
func getSystemPrompt(provider string) string {
    switch provider {
    case "groq":
        return `Eres un experto en creación de tests educativos. 
Genera preguntas y respuestas claras y concisas, con exactamente una respuesta correcta por pregunta.
Formato de respuesta: ÚNICAMENTE JSON válido sin markdown.
Las respuestas incorrectas deben ser plausibles pero incorrectas.
La jerarquía de temas debe seguir esta estructura: main_topic > sub_topic > specific_topic.`
    
    case "openai":
        return `Eres un experto en creación de tests educativos. 
Genera preguntas y respuestas claras, con exactamente una respuesta correcta por pregunta.
Responde ÚNICAMENTE en formato JSON válido.
La jerarquía de temas debe seguir: main_topic > sub_topic > specific_topic.`
    
    default:
        return `Eres un experto en creación de tests educativos. 
Genera preguntas y respuestas claras, con exactamente una respuesta correcta por pregunta.
Formato de respuesta: JSON válido.
La jerarquía de temas debe seguir: main_topic > sub_topic > specific_topic.`
    }
}

// Construir prompt optimizado con nueva jerarquía (actualizada)
func buildAIPrompt(input GenerateTestInput) string {
    languageNames := map[string]string{
        "es": "español",
        "en": "inglés",
        "fr": "francés",
        "de": "alemán",
        "it": "italiano",
        "pt": "portugués",
    }

    langName := languageNames[input.Language]
    if langName == "" {
        langName = "español"
    }

    isFreeMode := input.GenerationMode == "prompt" && input.AIPrompt != ""

    var basePrompt string

    if isFreeMode {
        // 🔹 MODO LIBRE / IA INFIERE JERARQUÍA
        topicsSummary := buildTopicsSummary(2)
        
        basePrompt = fmt.Sprintf(`Genera un test educativo con estas especificaciones.

        DESCRIPCIÓN DEL CONTENIDO:
        %s

        %s

        TAREA DE CLASIFICACIÓN:
        1. Analiza el contenido descrito por el usuario.
        2. Intenta clasificar el test dentro de la estructura educativa existente.
        3. Si el contenido NO encaja claramente, crea una nueva jerarquía educativa adecuada.
        4. La jerarquía final debe tener exactamente:
        - un main_topic (tema principal)
        - un sub_topic (subtema)
        - un specific_topic (tema específico)
        5. No fuerces el uso de categorías existentes si no son apropiadas.

        ESPECIFICACIONES DEL TEST:
        - Nivel de dificultad: %s
        - Número de preguntas: %d
        - Opciones por pregunta: %d
        - Idioma: %s (%s)

        REQUISITOS TÉCNICOS:
        1. Genera EXACTAMENTE %d preguntas.
        2. Cada pregunta tiene EXACTAMENTE %d opciones de respuesta.
        3. SOLO UNA opción es correcta por pregunta ("is_correct": true).
        4. Las respuestas incorrectas deben ser plausibles pero incorrectas.
        5. No repitas respuestas dentro de la misma pregunta.

        FORMATO DE RESPUESTA (JSON):
        {
        "title": "Título creativo y descriptivo del test",
        "description": "Breve descripción (1-2 frases)",
        "main_topic": "Tema principal. Usa uno existente si encaja, si no, crea uno nuevo",
        "sub_topic": "Subtema. Usa uno existente si encaja, si no, crea uno nuevo",
        "specific_topic": "Tema específico. Usa uno existente si encaja, si no, crea uno nuevo",

        "questions": [
            {
            "question_text": "Texto claro de la pregunta",
            "answers": [
                {"answer_text": "Opción A", "is_correct": true/false},
                {"answer_text": "Opción B", "is_correct": true/false},
                {"answer_text": "Opción C", "is_correct": true/false},
                {"answer_text": "Opción D", "is_correct": true/false}
            ]
            }
        ]
        }

        Ejemplo válido: exactamente una respuesta correcta por pregunta.
        Genera contenido educativo claro, preciso y de calidad.`,
            input.AIPrompt,
            topicsSummary,
            input.Level,
            input.NumQuestions,
            input.NumAnswers,
            langName,
            input.Language,
            input.NumQuestions,
            input.NumAnswers,
        )
    } else {
        // 🔹 MODO GUIADO / JERARQUÍA FIJA
        // Obtener temas existentes para el contexto
        hierarchy, _ := models.GetTopics(false)
        
        basePrompt = fmt.Sprintf(`Genera un test educativo con estas especificaciones:

JERARQUÍA DEL CONTENIDO (estos son temas validados en el sistema):
- Tema principal (main_topic): %s
- Subtema (sub_topic): %s
- Tema específico (specific_topic): %s
- Nivel de dificultad: %s
- Número de preguntas: %d
- Opciones por pregunta: %d
- Idioma: %s (%s)

TEMAS RELACIONADOS EN EL SISTEMA:
%s

REQUISITOS TÉCNICOS:
1. Genera EXACTAMENTE %d preguntas
2. Cada pregunta tiene EXACTAMENTE %d opciones de respuesta
3. SOLO UNA opción es correcta por pregunta (marcada con "is_correct": true)
4. Las respuestas incorrectas deben ser verosímiles pero claramente incorrectas
5. Ninguna respuesta debe repetirse en la misma pregunta
6. El contenido debe ser apropiado para nivel %s
7. Las preguntas deben estar enfocadas específicamente en: %s`,
            input.MainTopic,
            input.SubTopic,
            input.SpecificTopic,
            input.Level,
            input.NumQuestions,
            input.NumAnswers,
            langName,
            input.Language,
            getRelatedTopicsSummary(hierarchy, input.MainTopic, input.SubTopic),
            input.NumQuestions,
            input.NumAnswers,
            input.Level,
            input.SpecificTopic,
        )
    }

    // Formato de respuesta
    basePrompt += `

FORMATO DE RESPUESTA (JSON):
{
  "title": "Título creativo y descriptivo del test",
  "description": "Breve descripción (1-2 frases) del test",`

    if isFreeMode {
        basePrompt += `
  "main_topic": "Tema principal clasificado",
  "sub_topic": "Subtema clasificado", 
  "specific_topic": "Tema específico clasificado",`
    }

    basePrompt += `
  "questions": [
    {
      "question_text": "Texto claro de la pregunta",
      "answers": [
        {"answer_text": "Opción A", "is_correct": true/false},
        {"answer_text": "Opción B", "is_correct": true/false},
        {"answer_text": "Opción C", "is_correct": true/false},
        {"answer_text": "Opción D", "is_correct": true/false}
      ]
    }
  ]
}

NOTA: Solo responde con el JSON válido, sin texto adicional ni markdown.
Ejemplo válido: exactamente una respuesta correcta por pregunta.
Genera contenido educativo claro, variado y de calidad.`

    return basePrompt
}

// Parsear respuesta optimizado para diferentes proveedores
func parseAIResponse(result map[string]interface{}, input GenerateTestInput, provider string) (*models.Test, error) {
    var content string
    isFreeMode := input.GenerationMode == "prompt" && input.AIPrompt != ""
    
    content = extractContentFromOpenAIFormat(result)
    
    if content == "" {
        return generateMockTest(input), fmt.Errorf("respuesta vacía de %s", provider)
    }

    content = cleanAIContent(content, provider)
    
    var aiResponse AIResponse
    if err := json.Unmarshal([]byte(content), &aiResponse); err != nil {
        repairedContent := repairJSON(content)
        if err := json.Unmarshal([]byte(repairedContent), &aiResponse); err != nil {
            return generateMockTest(input), fmt.Errorf("error al parsear JSON de %s: %v. Contenido: %s", 
                provider, err, content[:min(200, len(content))])
        }
    }

    if len(aiResponse.Questions) == 0 {
        return generateMockTest(input), fmt.Errorf("respuesta de %s no contiene preguntas", provider)
    }

    // Determinar temas según el modo
    mainTopic := input.MainTopic
    subTopic := input.SubTopic
    specificTopic := input.SpecificTopic

    if isFreeMode {
        // Usar lo que devuelva la IA en modo libre
        if aiResponse.MainTopic != "" {
            mainTopic = aiResponse.MainTopic
        }
        if aiResponse.SubTopic != "" {
            subTopic = aiResponse.SubTopic
        }
        if aiResponse.SpecificTopic != "" {
            specificTopic = aiResponse.SpecificTopic
        }
        
        // Si la IA no devolvió temas, usar valores por defecto
        if mainTopic == "" {
            mainTopic = "General"
        }
        if subTopic == "" {
            subTopic = "General"
        }
        if specificTopic == "" {
            specificTopic = "General"
        }
    }

    test := &models.Test{
        Title:         truncateString(aiResponse.Title, 250),
        Description:   truncateString(aiResponse.Description, 500),
        MainTopic:     mainTopic,
        SubTopic:      subTopic,
        SpecificTopic: specificTopic,
        Level:         input.Level,
        CreatedBy:     0,        
        CreatedAt:     time.Now(),
    }

    processedQuestions := 0
    for _, q := range aiResponse.Questions {
        if processedQuestions >= input.NumQuestions {
            break
        }
        
        if q.QuestionText == "" || len(q.Answers) < input.NumAnswers {
            continue
        }
        
        question := models.Question{
            QuestionText: truncateString(q.QuestionText, 1000),
        }
        
        correctCount := 0
        answersToAdd := min(len(q.Answers), input.NumAnswers)
        
        for i := 0; i < answersToAdd; i++ {
            answer := models.Answer{
                AnswerText: truncateString(q.Answers[i].AnswerText, 500),
                IsCorrect:  q.Answers[i].IsCorrect,
            }
            if answer.IsCorrect {
                correctCount++
            }
            question.Answers = append(question.Answers, answer)
        }
        
        // Asegurar exactamente una respuesta correcta
        if correctCount != 1 {
            if answersToAdd > 0 {
                // Si no hay correctas, marcar la primera como correcta
                if correctCount == 0 {
                    question.Answers[0].IsCorrect = true
                }
                // Si hay más de una correcta, dejar solo la primera como correcta
                for i := 1; i < len(question.Answers); i++ {
                    question.Answers[i].IsCorrect = false
                }
            }
        }
        
        test.Questions = append(test.Questions, question)
        processedQuestions++
    }
    
    // Completar con preguntas mock si no hay suficientes
    if len(test.Questions) < input.NumQuestions {
        remaining := input.NumQuestions - len(test.Questions)
        mockTest := generateMockTest(input)
        for i := 0; i < remaining && i < len(mockTest.Questions); i++ {
            test.Questions = append(test.Questions, mockTest.Questions[i])
        }
    }
    
    return test, nil
}

// Funciones helper
func extractContentFromOpenAIFormat(result map[string]interface{}) string {
    choices, ok := result["choices"].([]interface{})
    if !ok || len(choices) == 0 {
        return ""
    }
    
    choice, ok := choices[0].(map[string]interface{})
    if !ok {
        return ""
    }
    
    message, ok := choice["message"].(map[string]interface{})
    if !ok {
        return ""
    }
    
    content, ok := message["content"].(string)
    if !ok {
        return ""
    }
    
    return content
}

func cleanAIContent(content, provider string) string {
    content = strings.TrimSpace(content)
    
    patterns := []string{
        "```json\n", "```json", "```\n", "```",
        "Here's the test in JSON format:",
        "Here is the test in JSON format:",
        "Generated test:",
        "```JSON",
        "El test generado en formato JSON es:",
        "Aquí tienes el test en formato JSON:",
    }
    
    for _, pattern := range patterns {
        if idx := strings.Index(content, pattern); idx != -1 {
            content = content[idx+len(pattern):]
            break
        }
    }
    
    if strings.HasSuffix(content, "```") {
        content = content[:len(content)-3]
    }
    
    return strings.TrimSpace(content)
}

func repairJSON(content string) string {
    content = strings.TrimSpace(content)
    
    if !strings.HasPrefix(content, "{") {
        if idx := strings.Index(content, "{"); idx != -1 {
            content = content[idx:]
        }
    }
    
    if !strings.HasSuffix(content, "}") {
        if idx := strings.LastIndex(content, "}"); idx != -1 {
            content = content[:idx+1]
        }
    }
    
    // Intentar arreglar comillas simples
    content = strings.ReplaceAll(content, `'`, `"`)
    
    return content
}

func truncateString(s string, maxLength int) string {
    if len(s) <= maxLength {
        return s
    }
    return s[:maxLength]
}

func min(a, b int) int {
    if a < b {
        return a
    }
    return b
}

// Helper para generar resumen de jerarquía (actualizada para usar DB)
func buildTopicsSummary(maxSpecificPerSub int) string {
    var b strings.Builder

    b.WriteString("ESTRUCTURA EDUCATIVA EXISTENTE (usar si el contenido encaja):\n\n")

    // Obtener jerarquía actual desde DB usando la función del modelo
    hierarchy, err := models.GetTopics(false)
    if err != nil {
        b.WriteString("No se pudo cargar estructura de temas.\n")
        return b.String()
    }

    mainTopics, _ := models.GetMainTopics()
    
    b.WriteString(fmt.Sprintf("Temas principales disponibles (%d):\n", len(mainTopics)))
    for _, main := range mainTopics {
        b.WriteString(fmt.Sprintf("- %s\n", main))
    }
    b.WriteString("\n")

    for main, subs := range hierarchy {
        b.WriteString(fmt.Sprintf("📚 %s\n", main))

        for sub, specifics := range subs {
            b.WriteString(fmt.Sprintf("  ├─ 📖 %s\n", sub))

            limit := maxSpecificPerSub
            if len(specifics) < limit {
                limit = len(specifics)
            }

            for i := 0; i < limit && i < len(specifics); i++ {
                b.WriteString(fmt.Sprintf("  │   ├─ • %s\n", specifics[i]))
            }
            
            if len(specifics) > limit {
                b.WriteString(fmt.Sprintf("  │   └─ ... y %d temas específicos más\n", len(specifics)-limit))
            }
        }
        b.WriteString("\n")
    }

    b.WriteString(
        "INSTRUCCIÓN: Si el contenido del usuario encaja claramente con alguna de estas categorías, úsalas. " +
            "Si no encaja perfectamente, crea una nueva jerarquía educativa coherente y descriptiva. " +
            "La nueva jerarquía debe seguir el formato: main_topic > sub_topic > specific_topic.\n",
    )

    return b.String()
}

// Helper para obtener temas relacionados
func getRelatedTopicsSummary(hierarchy models.TopicStructure, mainTopic, subTopic string) string {
    var b strings.Builder
    
    if mainTopic != "" {
        b.WriteString(fmt.Sprintf("En el tema principal '%s', hay estos subtemas:\n", mainTopic))
        
        if subs, exists := hierarchy[mainTopic]; exists {
            for sub, specifics := range subs {
                b.WriteString(fmt.Sprintf("- %s (con %d temas específicos", sub, len(specifics)))
                if len(specifics) > 0 && len(specifics) <= 3 {
                    b.WriteString(": ")
                    for i, spec := range specifics {
                        if i > 0 {
                            b.WriteString(", ")
                        }
                        b.WriteString(spec)
                    }
                }
                b.WriteString(")\n")
            }
        }
        
        if subTopic != "" {
            b.WriteString(fmt.Sprintf("\nSubtema seleccionado: '%s'\n", subTopic))
            if subs, exists := hierarchy[mainTopic]; exists {
                if specifics, exists := subs[subTopic]; exists {
                    b.WriteString(fmt.Sprintf("Temas específicos en este subtema (%d):\n", len(specifics)))
                    for i, spec := range specifics {
                        b.WriteString(fmt.Sprintf("- %s\n", spec))
                        if i >= 5 { // Limitar a 5
                            b.WriteString(fmt.Sprintf("... y %d más\n", len(specifics)-i-1))
                            break
                        }
                    }
                }
            }
        }
    }
    
    return b.String()
}


// Helper para parsear uint
func parseUint(s string) uint {
    var result uint
    fmt.Sscanf(s, "%d", &result)
    return result
}

// GetTopicStatistics obtiene estadísticas de temas
func GetTopicStatistics(c *gin.Context) {
    summaries, err := models.GetTopicStatistics()
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "Error al obtener estadísticas de temas",
            "details": err.Error(),
        })
        return
    }
    
    // Agrupar por tema principal
    totalTests := 0
    
    for _, summary := range summaries {
        totalTests += summary.TestCount
    }
    
    c.JSON(http.StatusOK, gin.H{
        "statistics": summaries,
        "total_tests": totalTests,
        "unique_topic_combinations": len(summaries),
        "timestamp": time.Now(),
    })
}