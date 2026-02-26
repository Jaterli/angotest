package shared

import (
	"os"	
)

// Configuración de email
type EmailConfig struct {
	Host     string
	Port     string
	Username string
	Password string
	From     string
	FromName string
}

func GetEmailConfig() *EmailConfig {
	return &EmailConfig{
		Host:     os.Getenv("SMTP_HOST"),
		Port:     os.Getenv("SMTP_PORT"),
		Username: os.Getenv("SMTP_USERNAME"),
		Password: os.Getenv("SMTP_PASSWORD"),
		From:     os.Getenv("SMTP_FROM_EMAIL"),
		FromName: os.Getenv("SMTP_FROM_NAME"),
	}
}
