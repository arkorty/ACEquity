package handlers

import (
	"encoding/json"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
)

// Data directory path relative to the server root
var dataDir = getDataDir()

func getDataDir() string {
	// Try to find the data directory relative to the executable
	execPath, err := os.Executable()
	if err == nil {
		dir := filepath.Dir(execPath)
		dataPath := filepath.Join(dir, "public")
		if _, err := os.Stat(dataPath); err == nil {
			return dataPath
		}
	}
	// Fallback to relative path from working directory
	return "public"
}

// GetTickers serves the main tickers.json file containing all stock metadata
func GetTickers(w http.ResponseWriter, r *http.Request) {
	filePath := filepath.Join(dataDir, "tickers.json")

	// Check if file exists
	info, err := os.Stat(filePath)
	if os.IsNotExist(err) {
		http.Error(w, "Tickers data not available", http.StatusNotFound)
		return
	}
	if err != nil {
		http.Error(w, "Error accessing tickers data", http.StatusInternalServerError)
		return
	}

	// Read the file
	data, err := os.ReadFile(filePath)
	if err != nil {
		http.Error(w, "Error reading tickers data", http.StatusInternalServerError)
		return
	}

	// Set headers
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "public, max-age=300") // Cache for 5 minutes
	w.Header().Set("Last-Modified", info.ModTime().UTC().Format(http.TimeFormat))

	w.Write(data)
}

// GetStockData serves individual stock JSON files
func GetStockData(w http.ResponseWriter, r *http.Request) {
	ticker := chi.URLParam(r, "ticker")

	// Sanitize ticker to prevent directory traversal
	ticker = strings.ReplaceAll(ticker, "..", "")
	ticker = strings.ReplaceAll(ticker, "/", "")
	ticker = strings.ReplaceAll(ticker, "\\", "")

	// Remove .json extension if provided
	ticker = strings.TrimSuffix(ticker, ".json")

	filePath := filepath.Join(dataDir, "stocks", ticker+".json")

	// Check if file exists
	info, err := os.Stat(filePath)
	if os.IsNotExist(err) {
		http.Error(w, "Stock data not found", http.StatusNotFound)
		return
	}
	if err != nil {
		http.Error(w, "Error accessing stock data", http.StatusInternalServerError)
		return
	}

	// Read the file
	data, err := os.ReadFile(filePath)
	if err != nil {
		http.Error(w, "Error reading stock data", http.StatusInternalServerError)
		return
	}

	// Set headers
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "public, max-age=300") // Cache for 5 minutes
	w.Header().Set("Last-Modified", info.ModTime().UTC().Format(http.TimeFormat))

	w.Write(data)
}

// ScraperStatus holds information about the scraper's last run
type ScraperStatus struct {
	LastRunStarted   *time.Time `json:"lastRunStarted"`
	LastRunCompleted *time.Time `json:"lastRunCompleted"`
	LastSuccess      *time.Time `json:"lastSuccess"`
	NextRun          *time.Time `json:"nextRun"`
	Status           string     `json:"status"`
	DataExists       bool       `json:"dataExists"`
}

// Global scraper status (will be updated by the scheduler)
var scraperStatus = ScraperStatus{
	Status: "idle",
}

// UpdateScraperStatus updates the global scraper status
func UpdateScraperStatus(lastRunStarted, lastRunCompleted, lastSuccess, nextRun *time.Time, status string) {
	scraperStatus.LastRunStarted = lastRunStarted
	scraperStatus.LastRunCompleted = lastRunCompleted
	scraperStatus.LastSuccess = lastSuccess
	scraperStatus.NextRun = nextRun
	scraperStatus.Status = status
}

// GetScraperStatus returns the current status of the scraper
func GetScraperStatus(w http.ResponseWriter, r *http.Request) {
	// Check if data exists
	tickersPath := filepath.Join(dataDir, "tickers.json")
	_, err := os.Stat(tickersPath)
	scraperStatus.DataExists = err == nil

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"response": scraperStatus,
		"status":   "success",
	})
}

// GetDataLastUpdated returns when the data was last successfully updated
func GetDataLastUpdated(w http.ResponseWriter, r *http.Request) {
	tickersPath := filepath.Join(dataDir, "tickers.json")
	_, err := os.Stat(tickersPath)
	exists := err == nil

	lastSuccess := scraperStatus.LastSuccess
	if lastSuccess == nil {
		lastSuccess = getLastAvailableDateFromFiles()
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"response": map[string]interface{}{
			"lastSuccess": lastSuccess,
			"exists":      exists,
		},
		"status": "success",
	})
}

func getLastAvailableDateFromFiles() *time.Time {
	files := []string{"NSEI.json", "BSESN.json"}

	for _, filename := range files {
		filePath := filepath.Join(dataDir, "stocks", filename)

		// check if exists
		if _, err := os.Stat(filePath); os.IsNotExist(err) {
			continue
		}

		data, err := os.ReadFile(filePath)
		if err != nil {
			continue
		}

		// Use a struct to decode only the Date field
		var prices []struct {
			Date string `json:"Date"`
		}
		if err := json.Unmarshal(data, &prices); err != nil {
			continue
		}

		if len(prices) > 0 {
			lastDate := prices[len(prices)-1].Date
			t, err := time.Parse("2006-01-02", lastDate)
			if err == nil {
				// Set to 16:05 IST (10:35 UTC) to represent end of trading day update
				updatedT := time.Date(t.Year(), t.Month(), t.Day(), 10, 35, 0, 0, time.UTC)
				return &updatedT
			}
		}
	}
	return nil
}
