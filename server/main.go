package main

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
	_ "github.com/mattn/go-sqlite3"

	"acequity/db"
	"acequity/handlers"
	"acequity/proxy"
)

func main() {
	db.DB = db.LoadDB()
	defer db.CloseDB()

	if err := db.DB.Ping(); err != nil {
		fmt.Printf("Database connection failed: %v\n", err)
	}

	db.InitDB()

	port := ":8080"
	fmt.Printf("Starting server on %s\n", port)

	r := chi.NewRouter()

	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000", "https://ace.webark.in"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token", "userid"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	r.Get("/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		response := map[string]string{"response": "Backend API is running...", "status": "success"}
		json.NewEncoder(w).Encode(response)
	})

	r.Get("/healthz", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		response := map[string]string{"response": "OK", "status": "success"}
		json.NewEncoder(w).Encode(response)
	})

	r.Post("/signup", handlers.SignUp)
	r.Post("/signin", handlers.SignIn)
	r.Post("/verify-otp", handlers.VerifyOTP)
	r.Post("/logout", handlers.Logout)

	r.Get("/users/{userid}", handlers.GetUser)
	r.Put("/users/{userid}", handlers.UpdateUser)
	r.Delete("/users/{userid}", handlers.DeleteUser)
	r.Get("/users/me", handlers.GetCurrentUser)

	r.Post("/watchlists", handlers.CreateWatchlist)
	r.Get("/watchlists/{id}", handlers.GetWatchlist)
	r.Put("/watchlists/{id}", handlers.UpdateWatchlist)
	r.Delete("/watchlists/{id}", handlers.DeleteWatchlist)

	r.Post("/holdings", handlers.CreateHolding)
	r.Get("/holdings", handlers.GetHoldings)
	r.Put("/holdings", handlers.UpdateHolding)
	r.Delete("/holdings/{id}", handlers.DeleteHolding)

	r.Post("/proxy/gemini", proxy.HandleGeminiProxy)

	http.ListenAndServe(port, r)
}
