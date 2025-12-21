package handlers

import (
	"acequity/db"
	"acequity/models"
	"database/sql"
	"encoding/json"
	"fmt"
	"math/rand"
	"net/http"

	"github.com/go-chi/chi/v5"
)

const userIDLength = 6
const alphanumeric = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

func generateUserID() string {
	b := make([]byte, userIDLength)

	for i := 0; i < 3; i++ {
		b[i] = alphanumeric[rand.Intn(26)]
	}

	for i := 3; i < 6; i++ {
		b[i] = alphanumeric[26+rand.Intn(10)]
	}
	return string(b)
}

func CreateUser(w http.ResponseWriter, r *http.Request) {
	var user models.User
	if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
		RespondWithError(w, http.StatusBadRequest, "Invalid JSON payload")
		return
	}

	var existingUserID, existingFullname string
	checkQuery := "SELECT userid, fullname FROM users WHERE email = ?"
	err := db.DB.QueryRow(checkQuery, user.Email).Scan(&existingUserID, &existingFullname)

	if err == nil {
		// User exists, send email with their userID
		emailErr := sendEmailToExistingUser(user.Email, existingUserID, existingFullname)
		if emailErr != nil {
			fmt.Printf("Failed to send email: %v\n", emailErr)
		}

		RespondWithJSON(w, http.StatusConflict, map[string]interface{}{
			"status":  "success",
			"message": "Email already registered. User ID sent to your email address.",
		})
		return
	} else if err != sql.ErrNoRows {
		RespondWithError(w, http.StatusInternalServerError, "Database error - "+err.Error())
		return
	}

	user.UserID = generateUserID()
	user.WatchlistIDs = []string{}
	user.HoldingIDs = []string{}

	watchlistIDsJSON, _ := json.Marshal(user.WatchlistIDs)
	holdingIDsJSON, _ := json.Marshal(user.HoldingIDs)
	_, err = db.DB.Exec("INSERT INTO users (userid, fullname, email, watchlistIDs, holdings) VALUES (?, ?, ?, ?, ?)", user.UserID, user.Fullname, user.Email, watchlistIDsJSON, holdingIDsJSON)
	if err != nil {
		RespondWithError(w, http.StatusInternalServerError, "Failed to create user - "+err.Error())
		return
	}

	RespondWithJSON(w, http.StatusOK, map[string]interface{}{"status": "success", "response": user})
}

func GetUser(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "userid")
	row := db.DB.QueryRow("SELECT userid, fullname, email, watchlistIDs, holdings FROM users WHERE userid = ?", id)

	var user models.User
	var watchlistIDsJSON string
	var holdingIDsJSON string
	if err := row.Scan(&user.UserID, &user.Fullname, &user.Email, &watchlistIDsJSON, &holdingIDsJSON); err != nil {
		if err == sql.ErrNoRows {
			RespondWithError(w, http.StatusNotFound, "User not found")
		} else {
			RespondWithError(w, http.StatusInternalServerError, "Failed to fetch user - "+err.Error())
		}
		return
	}

	if err := json.Unmarshal([]byte(watchlistIDsJSON), &user.WatchlistIDs); err != nil {
		RespondWithError(w, http.StatusInternalServerError, "Failed to parse watchlist IDs - "+err.Error())
		return
	}

	if err := json.Unmarshal([]byte(holdingIDsJSON), &user.HoldingIDs); err != nil {
		RespondWithError(w, http.StatusInternalServerError, "Failed to parse holding IDs - "+err.Error())
		return
	}

	RespondWithJSON(w, http.StatusOK, map[string]interface{}{"status": "success", "response": user})
}

func UpdateUser(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "userid")
	var user models.User
	if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
		RespondWithError(w, http.StatusBadRequest, "Invalid JSON payload")
		return
	}
	user.UserID = id

	result, err := db.DB.Exec("UPDATE users SET fullname = ?, email = ? WHERE userid = ?", user.Fullname, user.Email, id)
	if err != nil {
		RespondWithError(w, http.StatusInternalServerError, "Failed to update user - "+err.Error())
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		RespondWithError(w, http.StatusNotFound, "User not found")
		return
	}

	RespondWithJSON(w, http.StatusOK, map[string]interface{}{"status": "success", "response": user})
}

func DeleteUser(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "userid")

	result, err := db.DB.Exec("DELETE FROM users WHERE userid = ?", id)
	if err != nil {
		RespondWithError(w, http.StatusInternalServerError, "Failed to delete user - "+err.Error())
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		RespondWithError(w, http.StatusNotFound, "User not found")
		return
	}

	RespondWithJSON(w, http.StatusOK, map[string]interface{}{"status": "success", "response": "User deleted successfully"})
}
