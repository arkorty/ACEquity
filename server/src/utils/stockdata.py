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

    tickers_df = pd.read_csv("symbols.csv")
    tickers = tickers_df.iloc[:, 0].tolist()

    for ticker in tickers:
        while True:
            try:
                dat = yf.Ticker(ticker)
                hist = dat.history(period="1y", interval="1d", auto_adjust=False)
                print(f"Fetching data for {ticker}")

                headers = ["Datetime"] + hist.columns.tolist()
                file_name = ticker
                with open(f"stockdata/{file_name}.csv", "w") as f:
                    f.write(",".join(headers) + "\n")

                hist.to_csv(f"stockdata/{file_name}.csv", mode="a", header=False)

                last_row = parse_ticker_data(ticker, hist)
                if last_row:
                    with open("listed.csv", "a") as listed_file:
                        listed_file.write(",".join(map(str, last_row.values())) + "\n")

                break
            except Exception as e:
                print(f"Error fetching data for {ticker}: {e}")
                if "rate limit" in str(e).lower():
                    print("Rate limit exceeded, retrying in 5 seconds...")
                    time.sleep(5)
                else:
                    print(f"Skipping {ticker} due to error: {e}")
                    break
