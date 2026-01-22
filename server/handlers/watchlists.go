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
	cookie, err := r.Cookie("userid")
	if err != nil {
		RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}
	userID := cookie.Value

	var wl models.Watchlist
	if err := json.NewDecoder(r.Body).Decode(&wl); err != nil {
		RespondWithError(w, http.StatusBadRequest, "Invalid JSON payload")
		return
	}
	wl.ID = uuid.New().String()

	tickersJSON, _ := json.Marshal(wl.Tickers)

	row := db.DB.QueryRow("SELECT watchlistIDs FROM users WHERE userid = ?", userID)
	var watchlistIDsJSON string
	if err := row.Scan(&watchlistIDsJSON); err != nil {
		if err == sql.ErrNoRows {
			RespondWithError(w, http.StatusNotFound, "User not found")
		} else {
			RespondWithError(w, http.StatusInternalServerError, "Failed to fetch user - "+err.Error())
		}
		return
	}

	_, err = db.DB.Exec("INSERT INTO watchlists (id, name, tickers, userid) VALUES (?, ?, ?, ?)", wl.ID, wl.Name, tickersJSON, userID)
	if err != nil {
		RespondWithError(w, http.StatusInternalServerError, "Failed to create watchlist - "+err.Error())
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
		RespondWithError(w, http.StatusInternalServerError, "Failed to update user's watchlist IDs - "+err.Error())
		return
	}

	RespondWithJSON(w, http.StatusOK, map[string]interface{}{"status": "success", "response": wl})
}

func GetWatchlist(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("userid")
	if err != nil {
		RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}
	userID := cookie.Value

	id := chi.URLParam(r, "id")
	row := db.DB.QueryRow("SELECT id, name, tickers FROM watchlists WHERE id = ? AND userid = ?", id, userID)

	var wl models.Watchlist
	var tickers string
	if err := row.Scan(&wl.ID, &wl.Name, &tickers); err != nil {
		if err == sql.ErrNoRows {
			RespondWithError(w, http.StatusNotFound, "Watchlist not found")
		} else {
			RespondWithError(w, http.StatusInternalServerError, "Failed to fetch watchlist - "+err.Error())
		}
		return
	}

	json.Unmarshal([]byte(tickers), &wl.Tickers)
	RespondWithJSON(w, http.StatusOK, map[string]interface{}{"status": "success", "response": wl})
}

func UpdateWatchlist(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("userid")
	if err != nil {
		RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}
	userID := cookie.Value

	id := chi.URLParam(r, "id")
	var wl models.Watchlist
	if err := json.NewDecoder(r.Body).Decode(&wl); err != nil {
		RespondWithError(w, http.StatusBadRequest, "Invalid JSON payload")
		return
	}
	wl.ID = id

	tickersJSON, _ := json.Marshal(wl.Tickers)
	result, err := db.DB.Exec("UPDATE watchlists SET name = ?, tickers = ? WHERE id = ? AND userid = ?", wl.Name, tickersJSON, id, userID)
	if err != nil {
		RespondWithError(w, http.StatusInternalServerError, "Failed to update watchlist - "+err.Error())
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		RespondWithError(w, http.StatusNotFound, "Watchlist not found")
		return
	}

	RespondWithJSON(w, http.StatusOK, map[string]interface{}{"status": "success", "response": wl})
}

func DeleteWatchlist(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("userid")
	if err != nil {
		RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}
	userID := cookie.Value

	id := chi.URLParam(r, "id")

	row := db.DB.QueryRow("SELECT userid FROM watchlists WHERE id = ?", id)
	var dbUserID string
	if err := row.Scan(&dbUserID); err != nil {
		if err == sql.ErrNoRows {
			RespondWithError(w, http.StatusNotFound, "Watchlist not found")
		} else {
			RespondWithError(w, http.StatusInternalServerError, "Failed to fetch watchlist - "+err.Error())
		}
		return
	}

	if dbUserID != userID {
		RespondWithError(w, http.StatusUnauthorized, "Unauthorized access")
		return
	}

	result, err := db.DB.Exec("DELETE FROM watchlists WHERE id = ?", id)
	if err != nil {
		RespondWithError(w, http.StatusInternalServerError, "Failed to delete watchlist - "+err.Error())
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		RespondWithError(w, http.StatusNotFound, "Watchlist not found")
		return
	}

	row = db.DB.QueryRow("SELECT watchlistIDs FROM users WHERE userid = ?", userID)
	var watchlistIDsJSON string
	if err := row.Scan(&watchlistIDsJSON); err != nil {
		RespondWithError(w, http.StatusInternalServerError, "Failed to fetch user's watchlist IDs - "+err.Error())
		return
	}

	var watchlistIDs []string
	if err := json.Unmarshal([]byte(watchlistIDsJSON), &watchlistIDs); err != nil {
		RespondWithError(w, http.StatusInternalServerError, "Failed to parse watchlist IDs - "+err.Error())
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
		RespondWithError(w, http.StatusInternalServerError, "Failed to update user's watchlist IDs - "+err.Error())
		return
	}

	RespondWithJSON(w, http.StatusOK, map[string]interface{}{"status": "success", "response": "Watchlist deleted successfully"})
}
