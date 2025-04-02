package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	_ "github.com/mattn/go-sqlite3"
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

type Watchlist struct {
	ID      string   `json:"id"`
	Name    string   `json:"name"`
	Tickers []string `json:"tickers"`
}

type Holding struct {
	Symbol   string  `json:"symbol"`
	Quantity float64 `json:"quantity"`
	Price    float64 `json:"price"`
}

type User struct {
	UserID       string    `json:"userid"`
	Fullname     string    `json:"fullname"`
	Email        string    `json:"email"`
	WatchlistIDs []string  `json:"watchlistIDs"`
	Holdings     []Holding `json:"holdings"`
}

var db *sql.DB

func initDB() {
	var err error
	db, err = sql.Open("sqlite3", "./data.db")
	if err != nil {
		log.Fatal(err)
	}

	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS users (
			userid TEXT PRIMARY KEY,
			fullname TEXT NOT NULL,
			email TEXT NOT NULL UNIQUE,
			watchlistIDs TEXT DEFAULT '[]'
		);
		CREATE TABLE IF NOT EXISTS watchlists (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL,
			tickers TEXT DEFAULT '[]',
			userid TEXT NOT NULL,
			FOREIGN KEY(userid) REFERENCES users(userid) ON DELETE CASCADE
		);
	`)
	if err != nil {
		log.Fatal(err)
	}
}

func createUser(w http.ResponseWriter, r *http.Request) {
	var user User
	if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
		http.Error(w, "Invalid JSON payload", http.StatusBadRequest)
		return
	}
	user.UserID = generateUserID()
	user.WatchlistIDs = []string{}

	watchlistIDsJSON, _ := json.Marshal(user.WatchlistIDs)
	_, err := db.Exec("INSERT INTO users (userid, fullname, email, watchlistIDs) VALUES (?, ?, ?, ?)", user.UserID, user.Fullname, user.Email, watchlistIDsJSON)
	if err != nil {
		http.Error(w, "Failed to create user: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"status": "success", "response": user})
}

func getUser(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "userid")
	row := db.QueryRow("SELECT userid, fullname, email, watchlistIDs FROM users WHERE userid = ?", id)

	var user User
	var watchlistIDsJSON string
	if err := row.Scan(&user.UserID, &user.Fullname, &user.Email, &watchlistIDsJSON); err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "User not found", http.StatusNotFound)
		} else {
			http.Error(w, "Failed to fetch user: "+err.Error(), http.StatusInternalServerError)
		}
		return
	}

	if err := json.Unmarshal([]byte(watchlistIDsJSON), &user.WatchlistIDs); err != nil {
		http.Error(w, "Failed to parse watchlistIDs: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"status": "success", "response": user})
}

func updateUser(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "userid")
	var user User
	if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
		http.Error(w, "Invalid JSON payload", http.StatusBadRequest)
		return
	}
	user.UserID = id

	result, err := db.Exec("UPDATE users SET fullname = ?, email = ? WHERE userid = ?", user.Fullname, user.Email, id)
	if err != nil {
		http.Error(w, "Failed to update user: "+err.Error(), http.StatusInternalServerError)
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

func deleteUser(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "userid")

	result, err := db.Exec("DELETE FROM users WHERE userid = ?", id)
	if err != nil {
		http.Error(w, "Failed to delete user: "+err.Error(), http.StatusInternalServerError)
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

func createWatchlist(w http.ResponseWriter, r *http.Request) {
	userID := chi.URLParam(r, "userid")
	var wl Watchlist
	if err := json.NewDecoder(r.Body).Decode(&wl); err != nil {
		http.Error(w, "Invalid JSON payload", http.StatusBadRequest)
		return
	}
	wl.ID = uuid.New().String()

	tickersJSON, _ := json.Marshal(wl.Tickers)

	row := db.QueryRow("SELECT watchlistIDs FROM users WHERE userid = ?", userID)
	var watchlistIDsJSON string
	if err := row.Scan(&watchlistIDsJSON); err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "User not found", http.StatusNotFound)
		} else {
			http.Error(w, "Failed to fetch user: "+err.Error(), http.StatusInternalServerError)
		}
		return
	}

	_, err := db.Exec("INSERT INTO watchlists (id, name, tickers, userid) VALUES (?, ?, ?, ?)", wl.ID, wl.Name, tickersJSON, userID)
	if err != nil {
		http.Error(w, "Failed to create watchlist: "+err.Error(), http.StatusInternalServerError)
		return
	}

	var watchlistIDs []string
	if watchlistIDsJSON != "" {
		json.Unmarshal([]byte(watchlistIDsJSON), &watchlistIDs)
	}
	watchlistIDs = append(watchlistIDs, wl.ID)

	updatedWatchlistIDsJSON, _ := json.Marshal(watchlistIDs)
	_, err = db.Exec("UPDATE users SET watchlistIDs = ? WHERE userid = ?", updatedWatchlistIDsJSON, userID)
	if err != nil {
		http.Error(w, "Failed to update user's watchlistIDs: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"status": "success", "response": wl})
}

func getWatchlist(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	row := db.QueryRow("SELECT id, name, tickers FROM watchlists WHERE id = ?", id)

	var wl Watchlist
	var tickers string
	if err := row.Scan(&wl.ID, &wl.Name, &tickers); err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "Watchlist not found", http.StatusNotFound)
		} else {
			http.Error(w, "Failed to fetch watchlist: "+err.Error(), http.StatusInternalServerError)
		}
		return
	}

	json.Unmarshal([]byte(tickers), &wl.Tickers)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"status": "success", "response": wl})
}

func updateWatchlist(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var wl Watchlist
	if err := json.NewDecoder(r.Body).Decode(&wl); err != nil {
		http.Error(w, "Invalid JSON payload", http.StatusBadRequest)
		return
	}
	wl.ID = id

	tickersJSON, _ := json.Marshal(wl.Tickers)
	result, err := db.Exec("UPDATE watchlists SET name = ?, tickers = ? WHERE id = ?", wl.Name, tickersJSON, id)
	if err != nil {
		http.Error(w, "Failed to update watchlist: "+err.Error(), http.StatusInternalServerError)
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

func deleteWatchlist(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	// Fetch the associated user ID
	row := db.QueryRow("SELECT userid FROM watchlists WHERE id = ?", id)
	var userID string
	if err := row.Scan(&userID); err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "Watchlist not found", http.StatusNotFound)
		} else {
			http.Error(w, "Failed to fetch watchlist: "+err.Error(), http.StatusInternalServerError)
		}
		return
	}

	// Delete the watchlist
	result, err := db.Exec("DELETE FROM watchlists WHERE id = ?", id)
	if err != nil {
		http.Error(w, "Failed to delete watchlist: "+err.Error(), http.StatusInternalServerError)
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		http.Error(w, "Watchlist not found", http.StatusNotFound)
		return
	}

	// Update the user's watchlistIDs
	row = db.QueryRow("SELECT watchlistIDs FROM users WHERE userid = ?", userID)
	var watchlistIDsJSON string
	if err := row.Scan(&watchlistIDsJSON); err != nil {
		http.Error(w, "Failed to fetch user's watchlistIDs: "+err.Error(), http.StatusInternalServerError)
		return
	}

	var watchlistIDs []string
	if err := json.Unmarshal([]byte(watchlistIDsJSON), &watchlistIDs); err != nil {
		http.Error(w, "Failed to parse watchlistIDs: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Remove the deleted watchlist's ID
	for i, watchlistID := range watchlistIDs {
		if watchlistID == id {
			watchlistIDs = append(watchlistIDs[:i], watchlistIDs[i+1:]...)
			break
		}
	}

	updatedWatchlistIDsJSON, _ := json.Marshal(watchlistIDs)
	_, err = db.Exec("UPDATE users SET watchlistIDs = ? WHERE userid = ?", updatedWatchlistIDsJSON, userID)
	if err != nil {
		http.Error(w, "Failed to update user's watchlistIDs: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"status": "success", "response": "Watchlist deleted successfully"})
}

func main() {
	initDB()
	defer db.Close()

	fmt.Print("Starting server on :8080\n")

	r := chi.NewRouter()
	r.Get("/", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("Backend API is running"))
	})

	r.Post("/users", createUser)
	r.Get("/users/{userid}", getUser)
	r.Put("/users/{userid}", updateUser)
	r.Delete("/users/{userid}", deleteUser)

	r.Post("/users/{userid}/watchlists", createWatchlist)
	r.Get("/users/{userid}/watchlists/{id}", getWatchlist)
	r.Put("/users/{userid}/watchlists/{id}", updateWatchlist)
	r.Delete("/users/{userid}/watchlists/{id}", deleteWatchlist)

	http.ListenAndServe(":8080", r)
}
