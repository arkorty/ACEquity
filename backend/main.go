package main

import (
	"fmt"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
	_ "github.com/mattn/go-sqlite3"

	"acequity/db"
	"acequity/handlers"
)

func main() {
	db.InitDB()
	defer db.CloseDB()

	port := ":8080"
	fmt.Printf("Starting server on %s\n", port)

	r := chi.NewRouter()

	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token", "userid"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	r.Get("/", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("Backend API is running"))
	})

	r.Post("/users", handlers.CreateUser)
	r.Get("/users/{userid}", handlers.GetUser)
	r.Put("/users/{userid}", handlers.UpdateUser)
	r.Delete("/users/{userid}", handlers.DeleteUser)

	r.Post("/watchlists", handlers.CreateWatchlist)
	r.Get("/watchlists/{id}", handlers.GetWatchlist)
	r.Put("/watchlists/{id}", handlers.UpdateWatchlist)
	r.Delete("/watchlists/{id}", handlers.DeleteWatchlist)

	r.Post("/holdings", handlers.CreateHolding)
	r.Get("/holdings", handlers.GetHoldings)
	r.Put("/holdings", handlers.UpdateHolding)
	r.Delete("/holdings/{id}", handlers.DeleteHolding)

	http.ListenAndServe(fmt.Sprintf("%s", port), r)
}
