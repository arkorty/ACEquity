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
	cookie, err := r.Cookie("userid")
	if err != nil {
		RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}
	userID := cookie.Value

	var holding models.Holding
	if err := json.NewDecoder(r.Body).Decode(&holding); err != nil {
		RespondWithError(w, http.StatusBadRequest, "Invalid JSON payload")
		return
	}

	holding.ID = uuid.New().String()

	// Insert the holding into a separate table
	holdingJSON, _ := json.Marshal(holding)
	_, err = db.DB.Exec("INSERT INTO holdings (id, data) VALUES (?, ?)", holding.ID, holdingJSON)
	if err != nil {
		RespondWithError(w, http.StatusInternalServerError, "Failed to create holding - "+err.Error())
		return
	}

	// Update the user's HoldingIDs
	row := db.DB.QueryRow("SELECT holdings FROM users WHERE userid = ?", userID)
	var holdingIDsJSON string
	if err := row.Scan(&holdingIDsJSON); err != nil {
		if err == sql.ErrNoRows {
			RespondWithError(w, http.StatusNotFound, "User not found")
		} else {
			RespondWithError(w, http.StatusInternalServerError, "Failed to fetch user - "+err.Error())
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
		RespondWithError(w, http.StatusInternalServerError, "Failed to update user's holding IDs - "+err.Error())
		return
	}

	RespondWithJSON(w, http.StatusOK, map[string]interface{}{"status": "success", "response": holding})
}

func GetHoldings(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("userid")
	if err != nil {
		RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}
	userID := cookie.Value

	row := db.DB.QueryRow("SELECT holdings FROM users WHERE userid = ?", userID)
	var holdingIDsJSON string
	if err := row.Scan(&holdingIDsJSON); err != nil {
		if err == sql.ErrNoRows {
			RespondWithError(w, http.StatusNotFound, "User not found")
		} else {
			RespondWithError(w, http.StatusInternalServerError, "Failed to fetch holdings - "+err.Error())
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
			RespondWithError(w, http.StatusInternalServerError, "Failed to fetch holding - "+err.Error())
			return
		}

		var holding models.Holding
		json.Unmarshal([]byte(holdingJSON), &holding)
		holdings = append(holdings, holding)
	}

	RespondWithJSON(w, http.StatusOK, map[string]interface{}{"status": "success", "response": holdings})
}

func UpdateHolding(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("userid")
	if err != nil {
		RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}
	userID := cookie.Value

	var holding models.Holding
	if err := json.NewDecoder(r.Body).Decode(&holding); err != nil {
		RespondWithError(w, http.StatusBadRequest, "Invalid JSON payload")
		return
	}

	row := db.DB.QueryRow("SELECT holdings FROM users WHERE userid = ?", userID)
	var holdingIDsJSON string
	if err := row.Scan(&holdingIDsJSON); err != nil {
		if err == sql.ErrNoRows {
			RespondWithError(w, http.StatusNotFound, "User not found")
		} else {
			RespondWithError(w, http.StatusInternalServerError, "Failed to fetch holdings - "+err.Error())
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
				RespondWithError(w, http.StatusInternalServerError, "Failed to update holding - "+err.Error())
				return
			}
			found = true
			break
		}
	}

	if !found {
		RespondWithError(w, http.StatusNotFound, "Holding not found")
		return
	}

	RespondWithJSON(w, http.StatusOK, map[string]interface{}{"status": "success", "response": holding})
}

func DeleteHolding(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("userid")
	if err != nil {
		RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}
	userID := cookie.Value

	id := chi.URLParam(r, "id")

	row := db.DB.QueryRow("SELECT holdings FROM users WHERE userid = ?", userID)
	var holdingIDsJSON string
	if err := row.Scan(&holdingIDsJSON); err != nil {
		if err == sql.ErrNoRows {
			RespondWithError(w, http.StatusNotFound, "User not found")
		} else {
			RespondWithError(w, http.StatusInternalServerError, "Failed to fetch holdings - "+err.Error())
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
				RespondWithError(w, http.StatusInternalServerError, "Failed to delete holding - "+err.Error())
				return
			}
			found = true
			break
		}
	}

	if !found {
		RespondWithError(w, http.StatusNotFound, "Holding not found")
		return
	}

	updatedHoldingIDsJSON, _ := json.Marshal(holdingIDs)
	_, err = db.DB.Exec("UPDATE users SET holdings = ? WHERE userid = ?", updatedHoldingIDsJSON, userID)
	if err != nil {
		RespondWithError(w, http.StatusInternalServerError, "Failed to update user's holding IDs - "+err.Error())
		return
	}

	RespondWithJSON(w, http.StatusOK, map[string]interface{}{"status": "success", "response": "Holding deleted successfully"})
}
