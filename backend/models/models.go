package models

import (
    "time"
    "gorm.io/gorm"
)

// User model
type User struct {
    ID           uint      `gorm:"primaryKey" json:"id"`
    Username     string    `gorm:"uniqueIndex;size:50;not null" json:"username"`
    Email        string    `gorm:"uniqueIndex;size:100;not null" json:"email"`
    PasswordHash string    `gorm:"column:password_hash;not null" json:"-"`
    FirstName    string    `gorm:"size:50" json:"first_name"`
    LastName     string    `gorm:"size:50" json:"last_name"`
    Phone        string    `gorm:"size:20" json:"phone"`
    Address      string    `gorm:"type:text" json:"address"`
    Country      string    `gorm:"size:100" json:"country"`    
    BirthDate    time.Time `gorm:"type:date" json:"birth_date"`
    Role         string    `gorm:"size:20;default:'user';check:role IN ('user', 'admin', 'guest', 'deleted')" json:"role"`
    RegisteredAt time.Time `gorm:"column:registered_at;autoCreateTime" json:"registered_at"`
    LoginAt      time.Time `gorm:"column:login_at;autoUpdateTime" json:"login_at"`
    DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
    
    // Relaciones (opcionales pero útiles)
    Tests    []Test    `gorm:"foreignKey:CreatedBy" json:"tests,omitempty"`
    Results  []Result  `gorm:"foreignKey:UserID" json:"results,omitempty"`
}


// Para tokens de restablecimiento de contraseña
type PasswordResetToken struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	UserID    uint           `gorm:"not null;index" json:"user_id"`
	Token     string         `gorm:"size:255;uniqueIndex;not null" json:"-"`
	ExpiresAt time.Time      `gorm:"not null" json:"expires_at"`
	CreatedAt time.Time      `gorm:"autoCreateTime" json:"created_at"`
	UsedAt    *time.Time     `gorm:"index" json:"used_at,omitempty"`
	
	// Relación
	User      User           `gorm:"foreignKey:UserID" json:"-"`
}


// Test model
type Test struct {
    ID          uint      `gorm:"primaryKey" json:"id"`
    Title       string    `gorm:"size:255;not null" json:"title"`
    Description string    `gorm:"type:text" json:"description"`
    MainTopic   string    `gorm:"type:text;default:'General';not null" json:"main_topic"`
    SubTopic    string    `gorm:"type:text;default:'General';not null" json:"sub_topic"`
    SpecificTopic string  `gorm:"type:text;default:'General';not null" json:"specific_topic"`
    Level       string    `gorm:"type:text;not null" json:"level"`    
    CreatedBy   uint      `gorm:"not null" json:"created_by"`    
    CreatedAt   time.Time `gorm:"autoCreateTime" json:"created_at"`
    
    UpdatedAt   time.Time `gorm:"autoCreateTime" json:"updated_at"`    
    IsActive    bool      `gorm:"default:true;not null;index" json:"is_active"`    
    
    // Relaciones
    User       User        `gorm:"foreignKey:CreatedBy" json:"-"`
    Questions  []Question  `gorm:"foreignKey:TestID" json:"questions,omitempty"`
    Results    []Result    `gorm:"foreignKey:TestID" json:"-"`
}

// Topic model para almacenar jerarquía de temas
type Topic struct {
    ID             uint   `gorm:"primaryKey" json:"id"`
    MainTopic      string `gorm:"type:varchar(255);not null;index:idx_main_topic" json:"main_topic"`
    SubTopic       string `gorm:"type:varchar(255);not null;index:idx_sub_topic" json:"sub_topic"`
    SpecificTopic  string `gorm:"type:varchar(255);not null;index:idx_specific_topic" json:"specific_topic"`
    IsPredefined   bool   `gorm:"default:false;not null;index" json:"is_predefined"`    
}

// Índices compuestos para búsquedas eficientes
func (Topic) TableName() string {
    return "topics"
}


// Question model
type Question struct {
    ID           uint   `gorm:"primaryKey" json:"id"`
    TestID       uint   `gorm:"not null" json:"test_id"`
    QuestionText string `gorm:"type:text;not null" json:"question_text"`
    
    // Relaciones
    Test        Test      `gorm:"foreignKey:TestID" json:"-"`
    Answers     []Answer  `gorm:"foreignKey:QuestionID" json:"answers,omitempty"`
}

// Answer model
type Answer struct {
    ID          uint   `gorm:"primaryKey" json:"id"`
    QuestionID  uint   `gorm:"not null" json:"question_id"`
    AnswerText  string `gorm:"type:text;not null" json:"answer_text"`
    IsCorrect   bool   `gorm:"default:false" json:"is_correct"`
    
    // Relación
    Question Question `gorm:"foreignKey:QuestionID" json:"-"`
}

// Result model
type Result struct {
    ID            uint      `gorm:"primaryKey" json:"id"`
    UserID        uint      `gorm:"not null;index:idx_user_test_status" json:"user_id"`
    TestID        uint      `gorm:"not null;index:idx_user_test_status" json:"test_id"`
    CorrectAnswers int      `gorm:"not null;default:0" json:"correct_answers"`
    WrongAnswers   int      `gorm:"not null;default:0" json:"wrong_answers"`
    TimeTaken      int      `gorm:"not null;default:0" json:"time_taken"`
    Status         string   `gorm:"type:varchar(20);default:'in_progress';index:idx_user_test_status;check:status IN ('in_progress', 'completed', 'expired')" json:"status"`
    Answers        string   `gorm:"type:json" json:"answers,omitempty"`
	StartedAt      time.Time `gorm:"autoCreateTime" json:"started_at"`
    UpdatedAt      time.Time `gorm:"autoUpdateTime" json:"updated_at"`
    
    // Relaciones
    User User `gorm:"foreignKey:UserID" json:"user,omitempty"`
    Test Test `gorm:"foreignKey:TestID" json:"test,omitempty"`
}


// TestInvitation model para invitaciones a tests
type TestInvitation struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	TestID      uint      `gorm:"not null;index" json:"test_id"`
	InvitedBy   uint      `gorm:"not null" json:"invited_by"` // Usuario que envía la invitación
	Message     string    `gorm:"size:250" json:"message"` // Mensaje, opcional
	Token       string    `gorm:"size:64;uniqueIndex;not null" json:"token"` // Token único para la invitación
	IsUsed      bool      `gorm:"default:false;index" json:"is_used"`
	IsGuest     bool      `gorm:"default:false" json:"is_guest"` // Si el invitado es usuario invitado
	GuestUserID *uint     `gorm:"index" json:"guest_user_id"` // ID del usuario invitado creado (si aplica)
	ExpiresAt   time.Time `gorm:"not null" json:"expires_at"`
	CreatedAt   time.Time `gorm:"autoCreateTime" json:"created_at"`
	
	// Relaciones
	Test      Test      `gorm:"foreignKey:TestID" json:"test,omitempty"`
	Inviter   User      `gorm:"foreignKey:InvitedBy" json:"inviter,omitempty"`
	GuestUser *User     `gorm:"foreignKey:GuestUserID" json:"guest_user,omitempty"`
}

// UserQuota model para límites mensuales
type UserQuota struct {
    ID           uint      `gorm:"primaryKey" json:"id"`
    UserID       uint      `gorm:"not null" json:"user_id"`
    MonthYear    string    `gorm:"size:7;not null;index" json:"month_year"` // Formato: YYYY-MM
    MaxRequests  int       `gorm:"not null;default:5" json:"max_requests"`
    UsedRequests int       `gorm:"not null;default:0" json:"used_requests"`
    CreatedAt    time.Time `gorm:"autoCreateTime" json:"created_at"`
    UpdatedAt    time.Time `gorm:"autoUpdateTime" json:"updated_at"`
    
    // Relación
    User User `gorm:"foreignKey:UserID" json:"-"`
}

// SystemConfig model para configuración del sistema
type SystemConfig struct {
    ID          uint      `gorm:"primaryKey" json:"id"`
    Key         string    `gorm:"size:100;uniqueIndex;not null" json:"key"`
    Value       string    `gorm:"type:text" json:"value"`
    Description string    `gorm:"type:text" json:"description"`
    CreatedAt   time.Time `gorm:"autoCreateTime" json:"created_at"`
    UpdatedAt   time.Time `gorm:"autoUpdateTime" json:"updated_at"`
}

// UserResponse para API
type UserResponse struct {
    ID        uint      `json:"id"`
    Username  string    `json:"username"`
    Email     string    `json:"email"`
    FirstName string    `json:"first_name"`
    LastName  string    `json:"last_name"`
    Phone     string    `json:"phone"`
    Address   string    `json:"address"`
    Country   string    `json:"country"`    
    BirthDate time.Time `json:"birth_date"`
    Role      string    `json:"role"`
    RegisteredAt time.Time `json:"registered_at"`
    LoginAt   time.Time `json:"login_at"`
}

// Helper functions
func ToUserResponse(u *User) *UserResponse {
    return &UserResponse{
        ID:        u.ID,
        Username:  u.Username,
        Email:     u.Email,
        FirstName: u.FirstName,
        LastName:  u.LastName,
        Phone:     u.Phone,
        Address:   u.Address,
        Country:   u.Country,
        BirthDate: u.BirthDate,
        Role:      u.Role,
        RegisteredAt: u.RegisteredAt,
        LoginAt:   u.LoginAt,
    }
}

func GetPredefinedLevels() []string {
    return []string{"Principiante", "Intermedio", "Avanzado"}
}

func GetPredefinedStatus() []string {
    return []string{"completed", "in_progress", "expired"}
}

func GetQuestionOptions() []int {
    return []int{10, 20, 30, 40, 50}
}

func GetAnswerOptions() []int {
    return []int{3, 4}
}

// Helper para verificar si un string está en un slice
func ContainsString(slice []string, item string) bool {
    for _, s := range slice {
        if s == item {
            return true
        }
    }
    return false
}