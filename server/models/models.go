package models

type Watchlist struct {
	ID      string   `json:"id"`
	Name    string   `json:"name"`
	Tickers []string `json:"tickers"`
}

type Holding struct {
	ID       string  `json:"id"`
	Symbol   string  `json:"symbol"`
	Quantity float64 `json:"quantity"`
	Price    float64 `json:"price"`
}

type User struct {
	UserID       string   `json:"userid"`
	Fullname     string   `json:"fullname"`
	Email        string   `json:"email"`
	WatchlistIDs []string `json:"watchlistIDs"`
	HoldingIDs   []string `json:"holdingIDs"`
}

type UserIDRequest struct {
	Email string `json:"email"`
}
