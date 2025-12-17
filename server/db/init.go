package db

import (
	"database/sql"
	"log"
	"os"
)

var DB *sql.DB

func InitDB() {
	var err error

	_, err = DB.Exec("SELECT 1")
	if err != nil {
		log.Fatal("Database is not initialized:", err)
	}

	schema, err := os.ReadFile("./db/schema.sql")
	if err != nil {
		log.Fatal("Failed to load schema file:", err)
	}

	_, err = DB.Exec(string(schema))
	if err != nil {
		log.Fatal(err)
	}
}

func CloseDB() {
	DB.Close()
}
