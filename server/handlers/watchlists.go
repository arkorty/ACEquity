package handlers

import (
	"acequity/db"
	"acequity/models"
	"database/sql"
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

func CreateWatchlist(w http.ResponseWriter, r *http.Request) {
	userID := r.Header.Get("userid")
	if userID == "" {
		http.Error(w, "Missing userid in header", http.StatusBadRequest)
		return
	}

	var wl models.Watchlist
	if err := json.NewDecoder(r.Body).Decode(&wl); err != nil {
		http.Error(w, "Invalid JSON payload", http.StatusBadRequest)
		return
	}
	wl.ID = uuid.New().String()

	tickersJSON, _ := json.Marshal(wl.Tickers)

	row := db.DB.QueryRow("SELECT watchlistIDs FROM users WHERE userid = ?", userID)
	var watchlistIDsJSON string
	if err := row.Scan(&watchlistIDsJSON); err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "User not found", http.StatusNotFound)
		} else {
			http.Error(w, "Failed to fetch user - "+err.Error(), http.StatusInternalServerError)
		}
		return
	}

	_, err := db.DB.Exec("INSERT INTO watchlists (id, name, tickers, userid) VALUES (?, ?, ?, ?)", wl.ID, wl.Name, tickersJSON, userID)
	if err != nil {
		http.Error(w, "Failed to create watchlist - "+err.Error(), http.StatusInternalServerError)
		return
	}

	var watchlistIDs []string
	if watchlistIDsJSON != "" {
		json.Unmarshal([]byte(watchlistIDsJSON), &watchlistIDs)
	}
	watchlistIDs = append(watchlistIDs, wl.ID)

	updatedWatchlistIDsJSON, _ := json.Marshal(watchlistIDs)
	_, err = db.DB.Exec("UPDATE users SET watchlistIDs = ? WHERE userid = ?", updatedWatchlistIDsJSON, userID)
	if err != nil {
		http.Error(w, "Failed to update user's watchlist IDs - "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"status": "success", "response": wl})
}

func GetWatchlist(w http.ResponseWriter, r *http.Request) {
	userID := r.Header.Get("userid")
	if userID == "" {
		http.Error(w, "Missing userid in header", http.StatusBadRequest)
		return
	}

	id := chi.URLParam(r, "id")
	row := db.DB.QueryRow("SELECT id, name, tickers FROM watchlists WHERE id = ? AND userid = ?", id, userID)

	var wl models.Watchlist
	var tickers string
	if err := row.Scan(&wl.ID, &wl.Name, &tickers); err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "Watchlist not found", http.StatusNotFound)
		} else {
			http.Error(w, "Failed to fetch watchlist - "+err.Error(), http.StatusInternalServerError)
		}
		return
	}

	json.Unmarshal([]byte(tickers), &wl.Tickers)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"status": "success", "response": wl})
}

func UpdateWatchlist(w http.ResponseWriter, r *http.Request) {
	userID := r.Header.Get("userid")
	if userID == "" {
		http.Error(w, "Missing userid in header", http.StatusBadRequest)
		return
	}

	id := chi.URLParam(r, "id")
	var wl models.Watchlist
	if err := json.NewDecoder(r.Body).Decode(&wl); err != nil {
		http.Error(w, "Invalid JSON payload", http.StatusBadRequest)
		return
	}
	wl.ID = id

	tickersJSON, _ := json.Marshal(wl.Tickers)
	result, err := db.DB.Exec("UPDATE watchlists SET name = ?, tickers = ? WHERE id = ? AND userid = ?", wl.Name, tickersJSON, id, userID)
	if err != nil {
		http.Error(w, "Failed to update watchlist - "+err.Error(), http.StatusInternalServerError)
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		http.Error(w, "Watchlist not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"status": "success", "response": wl})
}

func DeleteWatchlist(w http.ResponseWriter, r *http.Request) {
	userID := r.Header.Get("userid")
	if userID == "" {
		http.Error(w, "Missing userid in header", http.StatusBadRequest)
		return
	}

	id := chi.URLParam(r, "id")

	row := db.DB.QueryRow("SELECT userid FROM watchlists WHERE id = ?", id)
	var dbUserID string
	if err := row.Scan(&dbUserID); err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "Watchlist not found", http.StatusNotFound)
		} else {
			http.Error(w, "Failed to fetch watchlist - "+err.Error(), http.StatusInternalServerError)
		}
		return
	}

	if dbUserID != userID {
		http.Error(w, "Unauthorized access", http.StatusUnauthorized)
		return
	}

	result, err := db.DB.Exec("DELETE FROM watchlists WHERE id = ?", id)
	if err != nil {
		http.Error(w, "Failed to delete watchlist - "+err.Error(), http.StatusInternalServerError)
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		http.Error(w, "Watchlist not found", http.StatusNotFound)
		return
	}

	row = db.DB.QueryRow("SELECT watchlistIDs FROM users WHERE userid = ?", userID)
	var watchlistIDsJSON string
	if err := row.Scan(&watchlistIDsJSON); err != nil {
		http.Error(w, "Failed to fetch user's watchlist IDs - "+err.Error(), http.StatusInternalServerError)
		return
	}

	var watchlistIDs []string
	if err := json.Unmarshal([]byte(watchlistIDsJSON), &watchlistIDs); err != nil {
		http.Error(w, "Failed to parse watchlist IDs - "+err.Error(), http.StatusInternalServerError)
		return
	}

	for i, watchlistID := range watchlistIDs {
		if watchlistID == id {
			watchlistIDs = append(watchlistIDs[:i], watchlistIDs[i+1:]...)
			break
		}
	}

	updatedWatchlistIDsJSON, _ := json.Marshal(watchlistIDs)
	_, err = db.DB.Exec("UPDATE users SET watchlistIDs = ? WHERE userid = ?", updatedWatchlistIDsJSON, userID)
	if err != nil {
		http.Error(w, "Failed to update user's watchlist IDs - "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"status": "success", "response": "Watchlist deleted successfully"})
}
