package handlers

import (
	"acequity/db"
	"acequity/models"
	"database/sql"
	"encoding/json"
	"fmt"
	"math/rand"
	"net/http"
	"time"
)

func generateOTP() string {
	return fmt.Sprintf("%06d", rand.Intn(1000000))
}

func SignUp(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Fullname string `json:"fullname"`
		Email    string `json:"email"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondWithError(w, http.StatusBadRequest, "Invalid JSON payload")
		return
	}

	if req.Fullname == "" || req.Email == "" {
		RespondWithError(w, http.StatusBadRequest, "Name and Email are required")
		return
	}

	// Check if user exists
	var existingUserID string
	err := db.DB.QueryRow("SELECT userid FROM users WHERE email = ?", req.Email).Scan(&existingUserID)
	if err == nil {
		RespondWithError(w, http.StatusConflict, "User already exists. Please sign in.")
		return
	} else if err != sql.ErrNoRows {
		RespondWithError(w, http.StatusInternalServerError, "Database error - "+err.Error())
		return
	}

	// Create pending user request
	otp := generateOTP()
	otpExpiry := time.Now().Add(10 * time.Minute)

	_, err = db.DB.Exec("INSERT OR REPLACE INTO pending_users (email, fullname, otp, otp_expiry) VALUES (?, ?, ?, ?)", 
		req.Email, req.Fullname, otp, otpExpiry)
	
	if err != nil {
		RespondWithError(w, http.StatusInternalServerError, "Failed to create signup request - "+err.Error())
		return
	}

	// Send OTP
	err = SendOTP(req.Email, otp, req.Fullname)
	if err != nil {
		fmt.Printf("Failed to send OTP email: %v\n", err)
	}

	RespondWithJSON(w, http.StatusOK, map[string]string{
		"status": "success", 
		"message": "OTP sent to email. Please verify to complete signup.",
	})
}

func SignIn(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email string `json:"email"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondWithError(w, http.StatusBadRequest, "Invalid JSON payload")
		return
	}

	if req.Email == "" {
		RespondWithError(w, http.StatusBadRequest, "Email is required")
		return
	}

	// Check if user exists
	var fullname string
	err := db.DB.QueryRow("SELECT fullname FROM users WHERE email = ?", req.Email).Scan(&fullname)
	if err == sql.ErrNoRows {
		RespondWithError(w, http.StatusNotFound, "User not found. Please sign up.")
		return
	} else if err != nil {
		RespondWithError(w, http.StatusInternalServerError, "Database error - "+err.Error())
		return
	}

	// Generate and save OTP
	otp := generateOTP()
	otpExpiry := time.Now().Add(10 * time.Minute)

	_, err = db.DB.Exec("UPDATE users SET otp = ?, otp_expiry = ? WHERE email = ?", otp, otpExpiry, req.Email)
	if err != nil {
		RespondWithError(w, http.StatusInternalServerError, "Failed to update OTP - "+err.Error())
		return
	}

	// Send OTP
	err = SendOTP(req.Email, otp, fullname)
	if err != nil {
		fmt.Printf("Failed to send OTP email: %v\n", err)
	}

	RespondWithJSON(w, http.StatusOK, map[string]string{
		"status": "success", 
		"message": "OTP sent to email.",
	})
}

func VerifyOTP(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email string `json:"email"`
		OTP   string `json:"otp"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondWithError(w, http.StatusBadRequest, "Invalid JSON payload")
		return
	}

	// 1. Try to find in users (SignIn flow)
	var user models.User
	var storedOTP string
	var otpExpiry time.Time
	var watchlistIDsJSON, holdingIDsJSON string

	row := db.DB.QueryRow("SELECT userid, fullname, email, watchlistIDs, holdings, otp, otp_expiry FROM users WHERE email = ?", req.Email)
	err := row.Scan(&user.UserID, &user.Fullname, &user.Email, &watchlistIDsJSON, &holdingIDsJSON, &storedOTP, &otpExpiry)

	if err == nil {
		// User exists, verify OTP
		if storedOTP != req.OTP {
			RespondWithError(w, http.StatusUnauthorized, "Invalid OTP")
			return
		}
		if time.Now().After(otpExpiry) {
			RespondWithError(w, http.StatusUnauthorized, "OTP expired")
			return
		}

		// Valid OTP, clear it
		db.DB.Exec("UPDATE users SET otp = NULL, otp_expiry = NULL WHERE email = ?", req.Email)

		// Set HttpOnly cookie
		http.SetCookie(w, &http.Cookie{
			Name:     "userid",
			Value:    user.UserID,
			Path:     "/",
			HttpOnly: true,
			Secure:   true, 
			SameSite: http.SameSiteNoneMode,
			MaxAge:   30 * 24 * 60 * 60, // 30 days
		})

		// Parse JSON fields
		json.Unmarshal([]byte(watchlistIDsJSON), &user.WatchlistIDs)
		json.Unmarshal([]byte(holdingIDsJSON), &user.HoldingIDs)

		RespondWithJSON(w, http.StatusOK, map[string]interface{}{
			"status": "success", 
			"response": user,
		})
		return

	} else if err != sql.ErrNoRows {
		RespondWithError(w, http.StatusInternalServerError, "Database error - "+err.Error())
		return
	}

	// 2. User not found in users table, check pending_users (SignUp flow)
	var pendingFullname string
	row = db.DB.QueryRow("SELECT fullname, otp, otp_expiry FROM pending_users WHERE email = ?", req.Email)
	err = row.Scan(&pendingFullname, &storedOTP, &otpExpiry)

	if err == sql.ErrNoRows {
		RespondWithError(w, http.StatusNotFound, "User not found")
		return
	} else if err != nil {
		RespondWithError(w, http.StatusInternalServerError, "Database error - "+err.Error())
		return
	}

	if storedOTP != req.OTP {
		RespondWithError(w, http.StatusUnauthorized, "Invalid OTP")
		return
	}
	if time.Now().After(otpExpiry) {
		RespondWithError(w, http.StatusUnauthorized, "OTP expired")
		return
	}

	// Valid OTP, promote to real user
	userID := generateUserID()
	watchlistIDsJSONBytes, _ := json.Marshal([]string{})
	holdingIDsJSONBytes, _ := json.Marshal([]string{})
	watchlistIDsJSON = string(watchlistIDsJSONBytes)
	holdingIDsJSON = string(holdingIDsJSONBytes)

	_, err = db.DB.Exec("INSERT INTO users (userid, fullname, email, watchlistIDs, holdings) VALUES (?, ?, ?, ?, ?)", 
		userID, pendingFullname, req.Email, watchlistIDsJSON, holdingIDsJSON)
	
	if err != nil {
		RespondWithError(w, http.StatusInternalServerError, "Failed to create user - "+err.Error())
		return
	}

	// Remove from pending
	db.DB.Exec("DELETE FROM pending_users WHERE email = ?", req.Email)

	// Set HttpOnly cookie
	http.SetCookie(w, &http.Cookie{
		Name:     "userid",
		Value:    userID,
		Path:     "/",
		HttpOnly: true,
		Secure:   true, 
		SameSite: http.SameSiteNoneMode,
		MaxAge:   30 * 24 * 60 * 60, // 30 days
	})

	user.UserID = userID
	user.Fullname = pendingFullname
	user.Email = req.Email
	user.WatchlistIDs = []string{}
	user.HoldingIDs = []string{}

	RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"status": "success", 
		"response": user,
	})
}

func Logout(w http.ResponseWriter, r *http.Request) {
	http.SetCookie(w, &http.Cookie{
		Name:     "userid",
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteNoneMode,
		MaxAge:   -1,
	})
	
	RespondWithJSON(w, http.StatusOK, map[string]string{
		"status": "success",
		"message": "Logged out successfully",
	})
}

func GetCurrentUser(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("userid")
	if err != nil {
		RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}
	
	userID := cookie.Value
	var user models.User
	var watchlistIDsJSON, holdingIDsJSON string

	row := db.DB.QueryRow("SELECT userid, fullname, email, watchlistIDs, holdings FROM users WHERE userid = ?", userID)
	err = row.Scan(&user.UserID, &user.Fullname, &user.Email, &watchlistIDsJSON, &holdingIDsJSON)

	if err == sql.ErrNoRows {
		RespondWithError(w, http.StatusUnauthorized, "User not found")
		return
	} else if err != nil {
		RespondWithError(w, http.StatusInternalServerError, "Database error - "+err.Error())
		return
	}

	json.Unmarshal([]byte(watchlistIDsJSON), &user.WatchlistIDs)
	json.Unmarshal([]byte(holdingIDsJSON), &user.HoldingIDs)

	RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"status": "success",
		"response": user,
	})
}