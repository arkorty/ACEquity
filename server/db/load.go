package db

import (
	"database/sql"
	"log"
	"os"
)

func LoadDB() *sql.DB {
	if _, err := os.Stat("./.ignore"); os.IsNotExist(err) {
		err := os.Mkdir("./.ignore", 0755)
		if err != nil {
			log.Fatal("Failed to create .ignore directory:", err)
		}
	}

	dbFile := os.Getenv("DB_PATH")
	if dbFile == "" {
		dbFile = "./.ignore/sqlite.db"
	}

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
