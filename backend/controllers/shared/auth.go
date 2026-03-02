package shared

import (
	"net/http"
	"os"
	"time"
	"log"
	"fmt"
	"encoding/hex"
	"crypto/rand"

	"angotest/config"
	"angotest/models"
	
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type registerInput struct {
	Username    string    `json:"username" binding:"required,min=3"`
	Email       string    `json:"email" binding:"required,email"`
	Password    string    `json:"password" binding:"required,min=6"`
	FirstName   string    `json:"first_name"`
	LastName    string    `json:"last_name"`
	Phone       string    `json:"phone"`
	Address     string    `json:"address"`
	Country     string    `json:"country" binding:"required"`	
	BirthDate   string 	  `json:"birth_date" binding:"required"`
	Role        string    `json:"role"`
}

type loginInput struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type loginResponse struct {
	User *models.UserResponse `json:"user"`
	Message string            `json:"message,omitempty"`
}

type checkAuthResponse struct {
	Authenticated bool                  `json:"authenticated"`
	User          *models.UserResponse  `json:"user,omitempty"`
}

// Tipos para recuperar contraseña
type forgotPasswordInput struct {
	Email string `json:"email" binding:"required,email"`
}

type resetPasswordInput struct {
	Token       string `json:"token" binding:"required"`
	NewPassword string `json:"new_password" binding:"required,min=6"`
	ConfirmPassword string `json:"confirm_password" binding:"required,min=6"`
}

type PasswordResetToken struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    uint      `gorm:"not null;index" json:"user_id"`
	Token     string    `gorm:"size:64;uniqueIndex;not null" json:"token"`
	Used      bool      `gorm:"default:false;index" json:"used"`
	ExpiresAt time.Time `gorm:"not null" json:"expires_at"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
	
	// Relación
	User *models.User `gorm:"foreignKey:UserID" json:"-"`
}



func SetAuthCookie(c *gin.Context, user *models.User, isGuest bool) error {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		return fmt.Errorf("JWT_SECRET no configurado en el entorno")
	}

	// Actualizar login_at
	now := time.Now()
	if err := config.DB.Model(user).Update("login_at", now).Error; err != nil {
		log.Printf("Error actualizando login_at: %v", err)
	} else {
		user.LoginAt = now
	}

	claims := jwt.MapClaims{
		"user_id":  user.ID,
		"role":     user.Role,
		"is_guest": isGuest,
		"exp":      time.Now().Add(24 * time.Hour).Unix(),
		"iat":      time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString([]byte(secret))
	if err != nil {
		return fmt.Errorf("no se pudo generar token: %v", err)
	}

	// Entorno
	isProduction := os.Getenv("ENV") == "production"

	// SameSite
	if isProduction {
		c.SetSameSite(http.SameSiteStrictMode)
	} else {
		c.SetSameSite(http.SameSiteLaxMode)
	}

	log.Printf(
		"Setting auth cookie | secure=%v | env=%s",
		isProduction,
		os.Getenv("ENV"),
	)

	c.SetCookie(
		"auth_token",   // nombre
		signed,         // valor
		24*60*60,       // 24h
		"/",            // path
		"",             // domain (vacío = localhost OK)
		isProduction,   // secure (TRUE solo en producción)
		true,           // httpOnly
	)

	return nil
}


func Register(c *gin.Context) {
	var input registerInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// check if email/username exists
	var existing models.User
	if err := config.DB.Where("email = ? OR username = ?", input.Email, input.Username).First(&existing).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "email o username ya registrado"})
		return
	}

	// Parsear la fecha
	birthDate, err := time.Parse("2006-01-02", input.BirthDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "formato de fecha inválido. Use YYYY-MM-DD"})
		return
	}

	pwHash, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "no se pudo procesar la contraseña"})
		return
	}

	// Si no se especifica rol, usar "user" por defecto
	if input.Role == "" {
		input.Role = "user"
	}

	user := models.User{
		Username:     input.Username,
		Email:        input.Email,
		PasswordHash: string(pwHash),
		FirstName:    input.FirstName,
		LastName:     input.LastName,
		Phone:        input.Phone,
		Address:      input.Address,
		Country:      input.Country, 		
		BirthDate:    birthDate,
		Role:         input.Role,
	}

	if err := config.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "error al crear usuario"})
		return
	}
	
	c.JSON(http.StatusCreated, gin.H{"user": models.ToUserResponse(&user)})
}

func Login(c *gin.Context) {
	var input loginInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	if err := config.DB.Where("email = ?", input.Email).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "credenciales inválidas"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(input.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "credenciales inválidas"})
		return
	}

	// Usar función centralizada
	if err := SetAuthCookie(c, &user, false); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, loginResponse{
		User:    models.ToUserResponse(&user),
		Message: "Login exitoso",
	})
}



// CheckAuth verifica si el usuario está autenticado mediante la cookie
func CheckAuth(c *gin.Context) {
	// Verificar si hay una cookie de autenticación
	tokenStr, err := c.Cookie("auth_token")
	if err != nil {
		c.JSON(http.StatusOK, checkAuthResponse{
			Authenticated: false,
		})
		return
	}

	// Validar el token
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		c.JSON(http.StatusInternalServerError, checkAuthResponse{
			Authenticated: false,
		})
		return
	}

	token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, jwt.ErrSignatureInvalid
		}
		return []byte(secret), nil
	})

	if err != nil || !token.Valid {
		c.JSON(http.StatusOK, checkAuthResponse{
			Authenticated: false,
		})
		return
	}

	// Obtener información del usuario
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		c.JSON(http.StatusOK, checkAuthResponse{
			Authenticated: false,
		})
		return
	}

	userIDFloat, ok := claims["user_id"].(float64)
	if !ok {
		c.JSON(http.StatusOK, checkAuthResponse{
			Authenticated: false,
		})
		return
	}

	userID := uint(userIDFloat)
	var user models.User
	if err := config.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusOK, checkAuthResponse{
			Authenticated: false,
		})
		return
	}

	c.JSON(http.StatusOK, checkAuthResponse{
		Authenticated: true,
		User: models.ToUserResponse(&user),
	})
}

// Logout elimina la cookie de autenticación
func Logout(c *gin.Context) {
	isProduction := os.Getenv("ENV") == "production"

	if isProduction {
		c.SetSameSite(http.SameSiteStrictMode)
	} else {
		c.SetSameSite(http.SameSiteLaxMode)
	}

	c.SetCookie(
		"auth_token",
		"",
		-1,
		"/",
		"",
		isProduction,
		true,
	)

	c.JSON(http.StatusOK, gin.H{
		"message": "Sesión cerrada exitosamente",
	})
}


// GetCurrentUser devuelve el usuario actual (si está autenticado)
func GetCurrentUser(c *gin.Context) {
	userIfc, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Usuario no autenticado"})
		return
	}

	user, ok := userIfc.(models.User)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error interno del servidor"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"user": models.ToUserResponse(&user),
	})
}


// ForgotPassword - Solicitar recuperación de contraseña
func ForgotPassword(c *gin.Context) {
	var input forgotPasswordInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Verificar si el usuario existe
	var user models.User
	if err := config.DB.Where("email = ?", input.Email).First(&user).Error; err != nil {
		// Por seguridad, responder igual aunque el email no exista
		c.JSON(http.StatusOK, gin.H{
			"message": "Si el email existe, se ha enviado un enlace de recuperación",
		})
		return
	}

	// Generar token único
	tokenBytes := make([]byte, 32)
	if _, err := rand.Read(tokenBytes); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "error generando token"})
		return
	}
	token := hex.EncodeToString(tokenBytes)
	
	// Crear registro en la base de datos
	resetToken := PasswordResetToken{
		UserID:    user.ID,
		Token:     token,
		Used:      false,
		ExpiresAt: time.Now().Add(24 * time.Hour), // Válido por 24 horas
	}

	if err := config.DB.Create(&resetToken).Error; err != nil {
		log.Printf("Error creando token de recuperación: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error interno del servidor"})
		return
	}

	// En un entorno real, aquí enviarías el email
	// Por ahora, solo logueamos el token (en producción usarías un servicio de email)
	resetLink := fmt.Sprintf("https://%s/reset-password?token=%s", c.Request.Host, token)
	
	log.Printf("Password reset link for %s: %s", user.Email, resetLink)
	
	// Enviar email
	if err := SendPasswordResetEmail(user.Email, resetLink); err != nil {
		// Solo loguear el error, no informar al usuario
		log.Printf("Error enviando email de recuperación: %v", err)
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Si el email existe, se ha enviado un enlace de recuperación",
		// En desarrollo, incluir el link para testing
		"reset_link": resetLink,
	})
}

// ResetPassword - Restablecer contraseña con token
func ResetPassword(c *gin.Context) {
	var input resetPasswordInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validar que las contraseñas coincidan
	if input.NewPassword != input.ConfirmPassword {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Las contraseñas no coinciden"})
		return
	}

	// Buscar token válido
	var tokenRecord PasswordResetToken
	if err := config.DB.Where("token = ? AND used = ? AND expires_at > ?", 
		input.Token, false, time.Now()).First(&tokenRecord).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Token inválido o expirado"})
		return
	}

	// Buscar usuario
	var user models.User
	if err := config.DB.First(&user, tokenRecord.UserID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Usuario no encontrado"})
		return
	}

	// Hashear nueva contraseña
	pwHash, err := bcrypt.GenerateFromPassword([]byte(input.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error procesando contraseña"})
		return
	}

	// Actualizar contraseña del usuario
	if err := config.DB.Model(&user).Update("password_hash", string(pwHash)).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error actualizando contraseña"})
		return
	}

	// Marcar token como usado
	if err := config.DB.Model(&tokenRecord).Update("used", true).Error; err != nil {
		log.Printf("Error marcando token como usado: %v", err)
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Contraseña actualizada exitosamente",
	})
}

// ValidateResetToken - Validar si un token es válido (para frontend)
func ValidateResetToken(c *gin.Context) {
	token := c.Query("token")
	if token == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Token requerido"})
		return
	}

	var tokenRecord PasswordResetToken
	if err := config.DB.Where("token = ? AND used = ? AND expires_at > ?", 
		token, false, time.Now()).First(&tokenRecord).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"valid": false, "error": "Token inválido o expirado"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"valid": true,
		"message": "Token válido",
	})
}
