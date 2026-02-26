package shared

import (
	"fmt"
	"log"
	"net/smtp"
)


func SendPasswordResetEmail(toEmail, resetLink string) error {
	config := GetEmailConfig()
	
	// Validar configuración
	if config.Host == "" || config.Port == "" || config.Username == "" {
		return fmt.Errorf("configuración SMTP incompleta")
	}

	// Construir el mensaje
	subject := "Recuperación de Contraseña"
	body := fmt.Sprintf(`
<html>
<body style="font-family: Arial, sans-serif;">
	<div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd;">
		<h2 style="color: #333;">Recuperación de Contraseña</h2>
		<p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace para continuar:</p>
		
		<div style="margin: 30px 0;">
			<a href="%s" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
				Restablecer Contraseña
			</a>
		</div>
		
		<p>Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
		<p style="background-color: #f8f9fa; padding: 10px; border-radius: 4px; word-break: break-all;">
			<code>%s</code>
		</p>
		
		<p>Este enlace expirará en 24 horas.</p>
		
		<p style="color: #666; font-size: 12px; margin-top: 30px;">
			Si no solicitaste este cambio, puedes ignorar este email.
		</p>
	</div>
</body>
</html>
`, resetLink, resetLink)

	// Crear mensaje MIME
	from := fmt.Sprintf("%s <%s>", config.FromName, config.From)
	to := []string{toEmail}
	
	msg := []byte(fmt.Sprintf("From: %s\r\n", from) +
		fmt.Sprintf("To: %s\r\n", toEmail) +
		fmt.Sprintf("Subject: %s\r\n", subject) +
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
		log.Printf("Error enviando email: %v", err)
		return fmt.Errorf("error enviando email: %v", err)
	}
	
	log.Printf("Email de recuperación enviado a: %s", toEmail)
	return nil
}