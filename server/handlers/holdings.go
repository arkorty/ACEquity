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

func CreateHolding(w http.ResponseWriter, r *http.Request) {
	userID := r.Header.Get("userid")
	if userID == "" {
		http.Error(w, "Missing userid in header", http.StatusBadRequest)
		return
	}

	var holding models.Holding
	if err := json.NewDecoder(r.Body).Decode(&holding); err != nil {
		http.Error(w, "Invalid JSON payload", http.StatusBadRequest)
		return
	}

	holding.ID = uuid.New().String()

	// Insert the holding into a separate table
	holdingJSON, _ := json.Marshal(holding)
	_, err := db.DB.Exec("INSERT INTO holdings (id, data) VALUES (?, ?)", holding.ID, holdingJSON)
	if err != nil {
		http.Error(w, "Failed to create holding - "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Update the user's HoldingIDs
	row := db.DB.QueryRow("SELECT holdings FROM users WHERE userid = ?", userID)
	var holdingIDsJSON string
	if err := row.Scan(&holdingIDsJSON); err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "User not found", http.StatusNotFound)
		} else {
			http.Error(w, "Failed to fetch user - "+err.Error(), http.StatusInternalServerError)
		}
		return
	}

	var holdingIDs []string
	if holdingIDsJSON != "" {
		json.Unmarshal([]byte(holdingIDsJSON), &holdingIDs)
	}
	holdingIDs = append(holdingIDs, holding.ID)

	updatedHoldingIDsJSON, _ := json.Marshal(holdingIDs)
	_, err = db.DB.Exec("UPDATE users SET holdings = ? WHERE userid = ?", updatedHoldingIDsJSON, userID)
	if err != nil {
		http.Error(w, "Failed to update user's holding IDs - "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"status": "success", "response": holding})
}

func GetHoldings(w http.ResponseWriter, r *http.Request) {
	userID := r.Header.Get("userid")
	if userID == "" {
		http.Error(w, "Missing userid in header", http.StatusBadRequest)
		return
	}

	row := db.DB.QueryRow("SELECT holdings FROM users WHERE userid = ?", userID)
	var holdingIDsJSON string
	if err := row.Scan(&holdingIDsJSON); err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "User not found", http.StatusNotFound)
		} else {
			http.Error(w, "Failed to fetch holdings - "+err.Error(), http.StatusInternalServerError)
		}
		return
	}

	var holdingIDs []string
	if holdingIDsJSON != "" {
		json.Unmarshal([]byte(holdingIDsJSON), &holdingIDs)
	}

	var holdings []models.Holding
	for _, id := range holdingIDs {
		row := db.DB.QueryRow("SELECT data FROM holdings WHERE id = ?", id)
		var holdingJSON string
		if err := row.Scan(&holdingJSON); err != nil {
			http.Error(w, "Failed to fetch holding - "+err.Error(), http.StatusInternalServerError)
			return
		}

		var holding models.Holding
		json.Unmarshal([]byte(holdingJSON), &holding)
		holdings = append(holdings, holding)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"status": "success", "response": holdings})
}

func UpdateHolding(w http.ResponseWriter, r *http.Request) {
	userID := r.Header.Get("userid")
	if userID == "" {
		http.Error(w, "Missing userid in header", http.StatusBadRequest)
		return
	}

	var holding models.Holding
	if err := json.NewDecoder(r.Body).Decode(&holding); err != nil {
		http.Error(w, "Invalid JSON payload", http.StatusBadRequest)
		return
	}

	row := db.DB.QueryRow("SELECT holdings FROM users WHERE userid = ?", userID)
	var holdingIDsJSON string
	if err := row.Scan(&holdingIDsJSON); err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "User not found", http.StatusNotFound)
		} else {
			http.Error(w, "Failed to fetch holdings - "+err.Error(), http.StatusInternalServerError)
		}
		return
	}

	var holdingIDs []string
	if holdingIDsJSON != "" {
		json.Unmarshal([]byte(holdingIDsJSON), &holdingIDs)
	}

	found := false
	for _, id := range holdingIDs {
		if id == holding.ID {
			holdingJSON, _ := json.Marshal(holding)
			_, err := db.DB.Exec("UPDATE holdings SET data = ? WHERE id = ?", holdingJSON, holding.ID)
			if err != nil {
				http.Error(w, "Failed to update holding - "+err.Error(), http.StatusInternalServerError)
				return
			}
			found = true
			break
		}
	}

	if !found {
		http.Error(w, "Holding not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"status": "success", "response": holding})
}

func DeleteHolding(w http.ResponseWriter, r *http.Request) {
	userID := r.Header.Get("userid")
	if userID == "" {
		http.Error(w, "Missing userid in header", http.StatusBadRequest)
		return
	}

	id := chi.URLParam(r, "id")

	row := db.DB.QueryRow("SELECT holdings FROM users WHERE userid = ?", userID)
	var holdingIDsJSON string
	if err := row.Scan(&holdingIDsJSON); err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "User not found", http.StatusNotFound)
		} else {
			http.Error(w, "Failed to fetch holdings - "+err.Error(), http.StatusInternalServerError)
		}
		return
	}

	var holdingIDs []string
	if holdingIDsJSON != "" {
		json.Unmarshal([]byte(holdingIDsJSON), &holdingIDs)
	}

	found := false
	for i, holdingID := range holdingIDs {
		if holdingID == id {
			holdingIDs = append(holdingIDs[:i], holdingIDs[i+1:]...)
			_, err := db.DB.Exec("DELETE FROM holdings WHERE id = ?", id)
			if err != nil {
				http.Error(w, "Failed to delete holding - "+err.Error(), http.StatusInternalServerError)
				return
			}
			found = true
			break
		}
	}

	if !found {
		http.Error(w, "Holding not found", http.StatusNotFound)
		return
	}

	updatedHoldingIDsJSON, _ := json.Marshal(holdingIDs)
	_, err := db.DB.Exec("UPDATE users SET holdings = ? WHERE userid = ?", updatedHoldingIDsJSON, userID)
	if err != nil {
		http.Error(w, "Failed to update user's holding IDs - "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"status": "success", "response": "Holding deleted successfully"})
}
