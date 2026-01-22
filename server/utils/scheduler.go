package utils

import (
	"compress/gzip"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"acequity/handlers"
)

const maxRetries = 3
const secListURL = "https://nsearchives.nseindia.com/content/equities/sec_list.csv"

// Scraper scheduler configuration
type ScraperScheduler struct {
	mu           sync.Mutex
	isRunning    bool
	lastRun      *time.Time
	nextRun      *time.Time
	stopChan     chan struct{}
	runningCmd   *exec.Cmd
	runningCmdMu sync.Mutex
}

var scheduler = &ScraperScheduler{
	stopChan: make(chan struct{}),
}

// StartScraperScheduler initializes and starts the background scraper scheduler
func StartScraperScheduler() {
	// Check if data directory is missing or empty, run scraper immediately if so
	go func() {
		if shouldRunOnStartup() {
			fmt.Println("SCHEDULER | Data directory missing or empty, running scraper on startup...")
			runScraper()
		}
	}()

	go func() {
		fmt.Println("SCHEDULER | Starting scraper scheduler...")

		for {
			// Calculate next run time
			nextRun := calculateNextRun()
			scheduler.mu.Lock()
			scheduler.nextRun = &nextRun
			scheduler.mu.Unlock()

			// Update status in handlers
			handlers.UpdateScraperStatus(scheduler.lastRun, scheduler.nextRun, "waiting")

			now := time.Now()
			duration := nextRun.Sub(now)

			fmt.Printf("SCHEDULER | Next scraper run scheduled for: %v (in %v)\n", nextRun.Format(time.RFC3339), duration.Round(time.Second))

			select {
			case <-time.After(duration):
				// Time to run the scraper
				runScraper()
			case <-scheduler.stopChan:
				fmt.Println("SCHEDULER | Scheduler stopped")
				return
			}
		}
	}()
}

// StopScraperScheduler stops the scheduler gracefully
func StopScraperScheduler() {
	fmt.Println("SCHEDULER | Stopping scheduler...")

	// Kill any running scraper process
	scheduler.runningCmdMu.Lock()
	if scheduler.runningCmd != nil && scheduler.runningCmd.Process != nil {
		fmt.Println("SCHEDULER | Killing running scraper process...")
		scheduler.runningCmd.Process.Kill()
		scheduler.runningCmd = nil
	}
	scheduler.runningCmdMu.Unlock()

	close(scheduler.stopChan)
	fmt.Println("SCHEDULER | Scheduler stopped")
}

// calculateNextRun calculates the next scheduled run time
// Runs at 5 PM IST (11:30 AM UTC) on weekdays
func calculateNextRun() time.Time {
	// Load IST timezone
	ist, err := time.LoadLocation("Asia/Kolkata")
	if err != nil {
		// Fallback: IST is UTC+5:30
		ist = time.FixedZone("IST", 5*60*60+30*60)
	}

	now := time.Now().In(ist)

	// Target: 5:30 PM IST (after market close at 3:30 PM)
	next := time.Date(now.Year(), now.Month(), now.Day(), 16, 5, 0, 0, ist)

	// If we're past today's run time or it's a weekend, move to the next valid day
	for next.Before(now) || next.Equal(now) || isWeekend(next) {
		next = next.Add(24 * time.Hour)
	}

	// Skip weekends
	for isWeekend(next) {
		next = next.Add(24 * time.Hour)
	}

	return next
}

// isWeekend checks if the given time is on a weekend
func isWeekend(t time.Time) bool {
	day := t.Weekday()
	return day == time.Saturday || day == time.Sunday
}

// shouldRunOnStartup checks if the data directory is missing or empty
func shouldRunOnStartup() bool {
	dataDir := "public"

	// Check if data directory exists
	info, err := os.Stat(dataDir)
	if os.IsNotExist(err) {
		return true
	}
	if err != nil || !info.IsDir() {
		return true
	}

	// Check if tickers.json exists
	tickersPath := filepath.Join(dataDir, "tickers.json")
	if _, err := os.Stat(tickersPath); os.IsNotExist(err) {
		return true
	}

	// Check if stocks directory exists and has files
	stocksDir := filepath.Join(dataDir, "stocks")
	entries, err := os.ReadDir(stocksDir)
	if err != nil || len(entries) == 0 {
		return true
	}

	return false
}

// downloadSecuritiesList downloads the latest securities list from NSE
func downloadSecuritiesList(scraperDir string) error {
	fmt.Println("SCHEDULER | Downloading latest securities list from NSE...")

	// Create HTTP client with proper headers (NSE requires browser-like headers)
	client := &http.Client{
		Timeout: 30 * time.Second,
	}

	req, err := http.NewRequest("GET", secListURL, nil)
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	// Set headers to mimic a browser (NSE blocks requests without proper headers)
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
	req.Header.Set("Accept", "text/csv,application/csv,text/plain,*/*")
	req.Header.Set("Accept-Language", "en-US,en;q=0.9")
	req.Header.Set("Accept-Encoding", "gzip, deflate, br")

	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to download securities list: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("failed to download securities list: HTTP %d", resp.StatusCode)
	}

	// Check if response is gzip-compressed
	var reader io.Reader = resp.Body
	if strings.Contains(resp.Header.Get("Content-Encoding"), "gzip") {
		gzipReader, err := gzip.NewReader(resp.Body)
		if err != nil {
			return fmt.Errorf("failed to create gzip reader: %w", err)
		}
		defer gzipReader.Close()
		reader = gzipReader
	}

	// Save to scraper directory
	secListPath := filepath.Join(scraperDir, "sec_list.csv")
	file, err := os.Create(secListPath)
	if err != nil {
		return fmt.Errorf("failed to create sec_list.csv: %w", err)
	}
	defer file.Close()

	_, err = io.Copy(file, reader)
	if err != nil {
		return fmt.Errorf("failed to write sec_list.csv: %w", err)
	}

	fmt.Println("SCHEDULER | Securities list downloaded successfully")
	return nil
}

// getScraperDir returns the scraper directory path
func getScraperDir() string {
	execPath, err := os.Executable()
	if err != nil {
		execPath = "."
	}
	serverDir := filepath.Dir(execPath)
	scraperDir := filepath.Join(serverDir, "scraper")

	// Check if scraper exists at executable path
	if _, err := os.Stat(filepath.Join(scraperDir, "main.py")); os.IsNotExist(err) {
		// Try relative path from working directory
		scraperDir = "scraper"
	}

	return scraperDir
}

// ensureVenv ensures the Python virtual environment exists and has dependencies installed
func ensureVenv(scraperDir string) error {
	venvPath := filepath.Join(scraperDir, ".venv")
	venvPython := filepath.Join(venvPath, "bin", "python3")
	requirementsPath := filepath.Join(scraperDir, "requirements.txt")

	// Check if venv exists
	if _, err := os.Stat(venvPython); os.IsNotExist(err) {
		fmt.Println("SCHEDULER | Creating Python virtual environment...")

		// Create venv
		cmd := exec.Command("python3", "-m", "venv", venvPath)
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
		if err := cmd.Run(); err != nil {
			return fmt.Errorf("failed to create venv: %w", err)
		}

		fmt.Println("SCHEDULER | Virtual environment created successfully")
	}

	// Install/update dependencies
	fmt.Println("SCHEDULER | Installing Python dependencies...")
	pipPath := filepath.Join(venvPath, "bin", "pip")
	cmd := exec.Command(pipPath, "install", "-r", requirementsPath, "-q")
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("failed to install dependencies: %w", err)
	}

	fmt.Println("SCHEDULER | Dependencies installed successfully")
	return nil
}

// executeScraperScript runs the Python scraper using the venv
func executeScraperScript(scraperDir string) error {
	venvPython := filepath.Join(scraperDir, ".venv", "bin", "python3")
	scraperPath := filepath.Join(scraperDir, "main.py")

	cmd := exec.Command(venvPython, scraperPath, "-n", "8", "--cleanup")
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	// Store the command so we can kill it if needed
	scheduler.runningCmdMu.Lock()
	scheduler.runningCmd = cmd
	scheduler.runningCmdMu.Unlock()

	err := cmd.Run()

	// Clear the running command
	scheduler.runningCmdMu.Lock()
	scheduler.runningCmd = nil
	scheduler.runningCmdMu.Unlock()

	return err
}

// runScraper executes the Python scraper script with retry logic
func runScraper() {
	scheduler.mu.Lock()
	if scheduler.isRunning {
		scheduler.mu.Unlock()
		fmt.Println("SCHEDULER | Scraper is already running, skipping...")
		return
	}
	scheduler.isRunning = true
	scheduler.mu.Unlock()

	fmt.Println("SCHEDULER | Starting scraper run...")
	handlers.UpdateScraperStatus(scheduler.lastRun, scheduler.nextRun, "running")

	startTime := time.Now()
	scraperDir := getScraperDir()

	var lastErr error
	for attempt := 1; attempt <= maxRetries; attempt++ {
		fmt.Printf("SCHEDULER | Attempt %d/%d\n", attempt, maxRetries)

		// Ensure venv is setup (recreate on retry)
		if attempt > 1 {
			// On retry, remove venv and recreate it
			venvPath := filepath.Join(scraperDir, ".venv")
			fmt.Println("SCHEDULER | Removing existing venv for fresh install...")
			os.RemoveAll(venvPath)
		}

		if err := ensureVenv(scraperDir); err != nil {
			lastErr = err
			fmt.Printf("SCHEDULER | Failed to setup venv: %v\n", err)
			continue
		}

		// Download latest securities list
		if err := downloadSecuritiesList(scraperDir); err != nil {
			// Log warning but continue - we can still use existing sec_list.csv
			fmt.Printf("SCHEDULER | Warning: Failed to download securities list: %v\n", err)
		}

		// Run the scraper
		if err := executeScraperScript(scraperDir); err != nil {
			lastErr = err
			fmt.Printf("SCHEDULER | Scraper script failed: %v\n", err)
			continue
		}

		// Success!
		lastErr = nil
		break
	}

	duration := time.Since(startTime)
	now := time.Now()

	scheduler.mu.Lock()
	scheduler.isRunning = false
	scheduler.lastRun = &now
	scheduler.mu.Unlock()

	if lastErr != nil {
		fmt.Printf("SCHEDULER | Scraper failed after %d attempts in %v: %v\n", maxRetries, duration.Round(time.Second), lastErr)
		handlers.UpdateScraperStatus(scheduler.lastRun, scheduler.nextRun, "failed")
	} else {
		fmt.Printf("SCHEDULER | Scraper completed successfully in %v\n", duration.Round(time.Second))
		handlers.UpdateScraperStatus(scheduler.lastRun, scheduler.nextRun, "success")
	}
}

// RunScraperManually triggers a manual scraper run (for API endpoint)
func RunScraperManually() error {
	scheduler.mu.Lock()
	if scheduler.isRunning {
		scheduler.mu.Unlock()
		return fmt.Errorf("scraper is already running")
	}
	scheduler.mu.Unlock()

	go runScraper()
	return nil
}

// IsScraperRunning returns whether the scraper is currently running
func IsScraperRunning() bool {
	scheduler.mu.Lock()
	defer scheduler.mu.Unlock()
	return scheduler.isRunning
}
