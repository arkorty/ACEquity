package handlers

import (
	"acequity/db"
	"acequity/models"
	"database/sql"
	"encoding/json"
	"math/rand"
	"net/http"

	"github.com/go-chi/chi/v5"
)

const userIDLength = 6
const alphanumeric = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

func generateUserID() string {
	b := make([]byte, userIDLength)
	for i := range b {
		b[i] = alphanumeric[rand.Intn(len(alphanumeric))]
	}
	return string(b)
}

func CreateUser(w http.ResponseWriter, r *http.Request) {
	var user models.User
	if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
		http.Error(w, "Invalid JSON payload", http.StatusBadRequest)
		return
	}
	user.UserID = generateUserID()
	user.WatchlistIDs = []string{}
	user.HoldingIDs = []string{} // Initialize HoldingIDs

	watchlistIDsJSON, _ := json.Marshal(user.WatchlistIDs)
	holdingIDsJSON, _ := json.Marshal(user.HoldingIDs)
	_, err := db.DB.Exec("INSERT INTO users (userid, fullname, email, watchlistIDs, holdings) VALUES (?, ?, ?, ?, ?)", user.UserID, user.Fullname, user.Email, watchlistIDsJSON, holdingIDsJSON)
	if err != nil {
		http.Error(w, "Failed to create user - "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"status": "success", "response": user})
}

func GetUser(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "userid")
	row := db.DB.QueryRow("SELECT userid, fullname, email, watchlistIDs, holdings FROM users WHERE userid = ?", id)

	var user models.User
	var watchlistIDsJSON string
	var holdingIDsJSON string
	if err := row.Scan(&user.UserID, &user.Fullname, &user.Email, &watchlistIDsJSON, &holdingIDsJSON); err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "User not found", http.StatusNotFound)
		} else {
			http.Error(w, "Failed to fetch user - "+err.Error(), http.StatusInternalServerError)
		}
		return
	}

	if err := json.Unmarshal([]byte(watchlistIDsJSON), &user.WatchlistIDs); err != nil {
		http.Error(w, "Failed to parse watchlist IDs - "+err.Error(), http.StatusInternalServerError)
		return
	}

	if err := json.Unmarshal([]byte(holdingIDsJSON), &user.HoldingIDs); err != nil {
		http.Error(w, "Failed to parse holding IDs - "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"status": "success", "response": user})
}

func UpdateUser(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "userid")
	var user models.User
	if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
		http.Error(w, "Invalid JSON payload", http.StatusBadRequest)
		return
	}
	user.UserID = id

	result, err := db.DB.Exec("UPDATE users SET fullname = ?, email = ? WHERE userid = ?", user.Fullname, user.Email, id)
	if err != nil {
		http.Error(w, "Failed to update user - "+err.Error(), http.StatusInternalServerError)
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"status": "success", "response": user})
}

func DeleteUser(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "userid")

	result, err := db.DB.Exec("DELETE FROM users WHERE userid = ?", id)
	if err != nil {
		http.Error(w, "Failed to delete user - "+err.Error(), http.StatusInternalServerError)
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"status": "success", "response": "User deleted successfully"})
}
