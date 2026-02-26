package shared

import (
	"fmt"
	"log"
	"net/http"
	"net/smtp"
	"time"

    "github.com/gin-gonic/gin"
)

type ContactForm struct {
	Name    string `json:"name"`
	Email   string `json:"email"`
	Subject string `json:"subject"`
	Message string `json:"message"`
	Consent bool   `json:"consent"`
}

type ContactResponse struct {
	Success   bool   `json:"success"`
	Message   string `json:"message"`
	MessageID string `json:"messageId,omitempty"`
}

func HandleContact(c *gin.Context) {
	var form ContactForm

	// Validar el JSON de entrada
	if err := c.ShouldBindJSON(&form); err != nil {
		c.JSON(http.StatusBadRequest, ContactResponse{
			Success: false,
			Message: "Datos del formulario inválidos: " + err.Error(),
		})
		return
	}

	// Verificar consentimiento
	if !form.Consent {
		c.JSON(http.StatusBadRequest, ContactResponse{
			Success: false,
			Message: "Debes aceptar la política de privacidad",
		})
		return
	}

	// Enviar email
	messageID, err := sendContactEmail(form)
	if err != nil {
		log.Printf("Error enviando email de contacto: %v", err)
		c.JSON(http.StatusInternalServerError, ContactResponse{
			Success: false,
			Message: "Error al enviar el mensaje. Por favor, inténtalo más tarde.",
		})
		return
	}

	// Respuesta exitosa
	c.JSON(http.StatusOK, ContactResponse{
		Success:   true,
		Message:   "Mensaje enviado correctamente",
		MessageID: messageID,
	})
}


func validateContactForm(form ContactForm) error {
	if form.Name == "" {
		return fmt.Errorf("el nombre es requerido")
	}
	if len(form.Name) < 3 {
		return fmt.Errorf("el nombre debe tener al menos 3 caracteres")
	}
	
	if form.Email == "" {
		return fmt.Errorf("el email es requerido")
	}
	if !isValidEmail(form.Email) {
		return fmt.Errorf("el email no es válido")
	}
	
	if form.Subject == "" {
		return fmt.Errorf("el asunto es requerido")
	}
	
	if form.Message == "" {
		return fmt.Errorf("el mensaje es requerido")
	}
	if len(form.Message) < 10 {
		return fmt.Errorf("el mensaje debe tener al menos 10 caracteres")
	}
	if len(form.Message) > 500 {
		return fmt.Errorf("el mensaje no puede tener más de 500 caracteres")
	}
	
	if !form.Consent {
		return fmt.Errorf("debes aceptar la política de privacidad")
	}
	
	return nil
}

func isValidEmail(email string) bool {
	// Validación básica de email
	return len(email) > 0 && contains(email, "@") && contains(email, ".")
}

func contains(s, substr string) bool {
	for i := 0; i < len(s)-len(substr)+1; i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}

func sendContactEmail(form ContactForm) (string, error) {
	config := GetEmailConfig()
	
	// Validar configuración
	if config.Host == "" || config.Port == "" || config.Username == "" {
		return "", fmt.Errorf("configuración SMTP incompleta")
	}

	// Generar ID único para el mensaje
	messageID := fmt.Sprintf("%d", time.Now().UnixNano())

	// Construir el cuerpo del email en HTML
	body := fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Nuevo mensaje de contacto</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background-color: #ffffff; padding: 30px; border: 1px solid #dee2e6; }
        .field { margin-bottom: 20px; }
        .label { font-weight: bold; color: #495057; margin-bottom: 5px; }
        .value { background-color: #f8f9fa; padding: 10px; border-radius: 4px; }
        .footer { margin-top: 30px; font-size: 12px; color: #6c757d; text-align: center; }
        .badge { 
            background-color: #007bff; 
            color: white; 
            padding: 4px 8px; 
            border-radius: 4px; 
            font-size: 12px;
            display: inline-block;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2 style="margin: 0; color: #212529;">📬 Nuevo mensaje de contacto</h2>
        </div>
        
        <div class="content">
            <div class="field">
                <div class="label">👤 Nombre:</div>
                <div class="value">%s</div>
            </div>
            
            <div class="field">
                <div class="label">📧 Email:</div>
                <div class="value">%s</div>
            </div>
            
            <div class="field">
                <div class="label">📋 Asunto:</div>
                <div class="value">
                    <span class="badge">%s</span>
                </div>
            </div>
            
            <div class="field">
                <div class="label">💬 Mensaje:</div>
                <div class="value" style="white-space: pre-wrap;">%s</div>
            </div>
                        
            <div class="field">
                <div class="label">📅 Fecha de envío:</div>
                <div class="value">%s</div>
            </div>
        </div>
        
        <div class="footer">
            <p>Este mensaje fue enviado desde el formulario de contacto del sitio web.</p>
            <p>ID del mensaje: %s</p>
        </div>
    </div>
</body>
</html>
`, form.Name, form.Email, form.Subject, form.Message, 
   time.Now().Format("02/01/2006 15:04:05"), messageID)

	// Construir el asunto del email
	emailSubject := fmt.Sprintf("Contacto Web: %s - %s", form.Subject, form.Name)

	// Crear mensaje MIME
	from := fmt.Sprintf("%s <%s>", config.FromName, config.From)
	to := []string{config.From} // Enviar al administrador (config.From)
	
	msg := []byte(fmt.Sprintf("From: %s\r\n", from) +
		fmt.Sprintf("To: %s\r\n", config.From) +
		fmt.Sprintf("Subject: %s\r\n", emailSubject) +
		"Reply-To: " + form.Email + "\r\n" + // Para poder responder directamente al remitente
		"MIME-Version: 1.0\r\n" +
		"Content-Type: text/html; charset=\"UTF-8\"\r\n" +
		"\r\n" +
		body)

	// Autenticación
	auth := smtp.PlainAuth("", config.Username, config.Password, config.Host)
	
	// Enviar email
	addr := fmt.Sprintf("%s:%s", config.Host, config.Port)
	err := smtp.SendMail(addr, auth, config.From, to, msg)
	
	if err != nil {
		log.Printf("Error enviando email de contacto: %v", err)
		return "", fmt.Errorf("error enviando email: %v", err)
	}
	
	// Opcional: Enviar copia de confirmación al remitente
	go sendConfirmationEmail(form, config)
	
	log.Printf("Email de contacto enviado - De: %s (%s) - Asunto: %s", form.Name, form.Email, form.Subject)
	return messageID, nil
}


// Enviar confirmación al remitente (opcional)
func sendConfirmationEmail(form ContactForm, config *EmailConfig) {
	subject := "Hemos recibido tu mensaje"
	body := fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Confirmación de contacto</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #28a745; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { padding: 30px; border: 1px solid #dee2e6; border-top: none; }
        .message-preview { 
            background-color: #f8f9fa; 
            padding: 15px; 
            border-left: 4px solid #28a745; 
            margin: 20px 0;
        }
        .footer { margin-top: 30px; font-size: 12px; color: #6c757d; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2 style="margin: 0;">✅ Mensaje recibido</h2>
        </div>
        
        <div class="content">
            <p>Hola <strong>%s</strong>,</p>
            
            <p>Hemos recibido tu mensaje correctamente. Te responderemos a la mayor brevedad posible.</p>
            
            <div class="message-preview">
                <p><strong>Tu mensaje:</strong></p>
                <p>%s</p>
            </div>
            
            <p>Gracias por contactarnos.</p>
            
            <p>Saludos,<br>El equipo de soporte</p>
        </div>
        
        <div class="footer">
            <p>Este es un mensaje automático, por favor no respondas a este email.</p>
        </div>
    </div>
</body>
</html>
`, form.Name, form.Message)

	from := fmt.Sprintf("%s <%s>", config.FromName, config.From)
	to := []string{form.Email}
	
	msg := []byte(fmt.Sprintf("From: %s\r\n", from) +
		fmt.Sprintf("To: %s\r\n", form.Email) +
		fmt.Sprintf("Subject: %s\r\n", subject) +
		"MIME-Version: 1.0\r\n" +
		"Content-Type: text/html; charset=\"UTF-8\"\r\n" +
		"\r\n" +
		body)

	auth := smtp.PlainAuth("", config.Username, config.Password, config.Host)
	addr := fmt.Sprintf("%s:%s", config.Host, config.Port)
	
	if err := smtp.SendMail(addr, auth, config.From, to, msg); err != nil {
		log.Printf("Error enviando confirmación a %s: %v", form.Email, err)
	}
}