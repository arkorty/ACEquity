package db

import (
	"database/sql"
	"log"
)

var DB *sql.DB

func InitDB() {
	var err error
	DB, err = sql.Open("sqlite3", "./data.db")
	if err != nil {
		log.Fatal(err)
	}

	_, err = DB.Exec(`
		CREATE TABLE IF NOT EXISTS users (
			userid TEXT PRIMARY KEY,
			fullname TEXT NOT NULL,
			email TEXT NOT NULL UNIQUE,
			watchlistIDs TEXT DEFAULT '[]',
			holdings TEXT DEFAULT '[]'
		);
		CREATE TABLE IF NOT EXISTS watchlists (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL,
			tickers TEXT DEFAULT '[]',
			userid TEXT NOT NULL,
			FOREIGN KEY(userid) REFERENCES users(userid) ON DELETE CASCADE
		);
		CREATE TABLE IF NOT EXISTS holdings (
			id TEXT PRIMARY KEY,
			data TEXT NOT NULL
		);
	`)
	if err != nil {
		log.Fatal(err)
	}
}

func CloseDB() {
	DB.Close()
}
