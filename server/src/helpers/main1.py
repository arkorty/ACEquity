import yfinance as yf
import pandas as pd
import json
import time


def parse_ticker_data(ticker, hist):
    """
    Parse ticker data into a JSON-friendly format.
    """
    if hist.empty:
        return None

    last_row = hist.iloc[-1]
    data = {
        "Ticker": ticker,
        "Adj Close": last_row.get("Adj Close", 0.0),
        "Capital Gains": last_row.get("Capital Gains", 0.0),
        "Close": last_row.get("Close", 0.0),
        "Dividends": last_row.get("Dividends", 0.0),
        "High": last_row.get("High", 0.0),
        "Low": last_row.get("Low", 0.0),
        "Open": last_row.get("Open", 0.0),
        "Stock Splits": last_row.get("Stock Splits", 0.0),
        "Volume": last_row.get("Volume", 0.0),
    }
    return data


if __name__ == "__main__":
    tickers_df = pd.read_csv("LISTED_STOCKS.csv")
    tickers = tickers_df.iloc[:, 0].tolist()

    stock_data = []

    print(f"Fetching data for {len(tickers)} tickers...\n")

    for index, ticker in enumerate(tickers, start=1):
        print(f"[{index}/{len(tickers)}] Fetching data for {ticker}...", end=" ")

        while True:
            try:
                dat = yf.Ticker(ticker)
                hist = dat.history(period="1d", auto_adjust=False)

                if hist.empty:
                    print("No data available.")
                else:
                    print("Success.")

                data_entry = parse_ticker_data(ticker, hist)
                if data_entry:
                    stock_data.append(data_entry)
                break
            except Exception as e:
                print(f"Error: {e}")
                if "rate limit" in str(e).lower():
                    print("Rate limit exceeded, retrying in 5 seconds...")
                    time.sleep(5)
                else:
                    print(f"Skipping {ticker} due to error: {e}")
                    break

    with open("LT_HIST1.json", "w") as f:
        json.dump(stock_data, f, indent=4)

    print("\nData fetching complete. Saved to LT_HIST1.json.")
