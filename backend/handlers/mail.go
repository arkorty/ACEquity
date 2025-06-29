package handlers

import (
	"fmt"
	"html/template"
	"os"
	"path/filepath"
	"strings"

	"github.com/joho/godotenv"
	"github.com/resend/resend-go/v2"
)

func sendEmailToExistingUser(email, userid, fullname string) error {
	if err := godotenv.Load(); err != nil {
		return fmt.Errorf("failed to load environment variables: %v", err)
	}

	apiKey := os.Getenv("RESEND_API_KEY")
	if apiKey == "" {
		return fmt.Errorf("email service not configured")
	}

	// Get template path
	templatePath := filepath.Join("templates", "SendUserID.html")

	// Check if template file exists
	if _, err := os.Stat(templatePath); os.IsNotExist(err) {
		return fmt.Errorf("template file does not exist at path: %s", templatePath)
	}

	// Load and parse the HTML template
	tmpl, err := template.ParseFiles(templatePath)
	if err != nil {
		return fmt.Errorf("failed to load email template: %v", err)
	}

	// Validate template data
	if fullname == "" || userid == "" {
		return fmt.Errorf("invalid template data: fullname=%q, userid=%q", fullname, userid)
	}

	// Create template data
	data := map[string]string{
		"Fullname": fullname,
		"UserID":   userid,
	}

	// Execute template to generate HTML
	var htmlBuffer strings.Builder
	if err := tmpl.Execute(&htmlBuffer, data); err != nil {
		return fmt.Errorf("failed to execute email template: %v", err)
	}

	htmlContent := htmlBuffer.String()
	if htmlContent == "" {
		return fmt.Errorf("template execution resulted in empty HTML content")
	}

	client := resend.NewClient(apiKey)
	params := &resend.SendEmailRequest{
		From:    "ACEquity <acequity@noreply.webark.in>",
		To:      []string{email},
		Subject: "Your ACEquity User ID",
		Html:    htmlContent,
		Text:    "Hello " + fullname + ",\n\nYour ACEquity User ID is: " + userid + "\n\nUse this ID to log into your account.\n\nBest regards,\nACEquity Team",
	}

	_, err = client.Emails.Send(params)
	return err
}
