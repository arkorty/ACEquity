package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"

	"acequity/utils"
)

// WebhookScraper handles both GET (progress) and POST (trigger) requests for the scraper webhook
func WebhookScraper(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		handleScraperProgress(w, r)
	case http.MethodPost:
		handleScraperTrigger(w, r)
	default:
		http.Error(w, "Method not allowed. Use GET to view progress or POST to trigger scraper.", http.StatusMethodNotAllowed)
	}
}

// handleScraperProgress returns the current progress of the running scraper
func handleScraperProgress(w http.ResponseWriter, r *http.Request) {
	isRunning := utils.IsScraperRunning()
	progress := utils.GetScraperProgress()

	w.Header().Set("Content-Type", "application/json")

	if !isRunning {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"status":  "success",
			"running": false,
			"message": "Scraper is not currently running",
			"response": map[string]interface{}{
				"percentage":    0,
				"elapsed_time":  "0s",
				"current_phase": "idle",
				"processed":     0,
				"total":         0,
			},
		})
		return
	}

	// Format elapsed time in a human-readable format
	elapsedStr := formatDuration(progress["elapsed_time"])
	percentage := progress["percentage"].(float64)

	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":  "success",
		"running": true,
		"message": "Scraper is running",
		"response": map[string]interface{}{
			"percentage":    fmt.Sprintf("%.1f%%", percentage),
			"elapsed_time":  elapsedStr,
			"current_phase": progress["current_phase"],
			"processed":     progress["processed"],
			"total":         progress["total"],
			"last_log":      progress["last_log_line"],
		},
	})
}

// handleScraperTrigger manually triggers a scraper run
func handleScraperTrigger(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	err := utils.RunScraperManually()
	if err != nil {
		w.WriteHeader(http.StatusConflict)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"status":  "error",
			"message": err.Error(),
		})
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":  "success",
		"message": "Scraper started successfully. Use GET to monitor progress.",
	})
}

// formatDuration formats a duration into a human-readable string
func formatDuration(d interface{}) string {
	// Handle different duration types
	var seconds int64

	switch v := d.(type) {
	case int64:
		seconds = v / 1000000000 // Convert nanoseconds to seconds
	default:
		// Try to use the duration as-is
		if dur, ok := d.(interface{ Seconds() float64 }); ok {
			seconds = int64(dur.Seconds())
		} else {
			return "0s"
		}
	}

	if seconds < 60 {
		return fmt.Sprintf("%ds", seconds)
	}

	minutes := seconds / 60
	remainingSeconds := seconds % 60

	if minutes < 60 {
		return fmt.Sprintf("%dm %ds", minutes, remainingSeconds)
	}

	hours := minutes / 60
	remainingMinutes := minutes % 60

	return fmt.Sprintf("%dh %dm %ds", hours, remainingMinutes, remainingSeconds)
}
