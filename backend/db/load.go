package db

import (
	"database/sql"
	"log"
	"os"
)

func LoadDB() *sql.DB {
	dbFile := "./data.db"
	_, err := os.Stat(dbFile)
	dbExists := !os.IsNotExist(err)

	db, err := sql.Open("sqlite3", dbFile)
	if err != nil {
		log.Fatal(err)
	}

	if !dbExists {
		log.Println("Database file does not exist. It will be created.")
	}

	return db
}
