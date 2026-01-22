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

	// Migrations: Add otp and otp_expiry if they don't exist
	// Ignoring errors as they might already exist
	DB.Exec("ALTER TABLE users ADD COLUMN otp TEXT")
	DB.Exec("ALTER TABLE users ADD COLUMN otp_expiry DATETIME")
}

func CloseDB() {
	DB.Close()
}
