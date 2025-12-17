package proxy

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"os"

	"github.com/joho/godotenv"
)

func HandleGeminiProxy(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	if err := godotenv.Load(); err != nil {
		http.Error(w, "Failed to load environment variables", http.StatusInternalServerError)
		return
	}

	reqBody := make(map[string]interface{})
	if err := json.NewDecoder(r.Body).Decode(&reqBody); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		http.Error(w, "API key not configured", http.StatusInternalServerError)
		return
	}
	geminiURL := "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + apiKey

	reqJSON, err := json.Marshal(map[string]any{
		"contents": []map[string]any{
			{
				"parts": []map[string]string{
					{"text": reqBody["contents"].(string)},
				},
			},
		},
	})
	if err != nil {
		http.Error(w, "Failed to encode request", http.StatusInternalServerError)
		return
	}

	resp, err := http.Post(geminiURL, "application/json", bytes.NewReader(reqJSON))
	if err != nil {
		http.Error(w, "Failed to forward request to GEMINI API", http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		http.Error(w, "Failed to read response from GEMINI API", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(resp.StatusCode)
	if _, err := w.Write(respBody); err != nil {
		http.Error(w, "Failed to write response", http.StatusInternalServerError)
	}
}
