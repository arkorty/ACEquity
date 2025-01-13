import os
import csv
import json


stock_dir = "stockdata/"

symbols_file = "symbols.csv"


symbol_names = {}
with open(symbols_file, mode="r", encoding="utf-8") as file:
    reader = csv.reader(file)
    next(reader)
    for row in reader:
        if len(row) >= 2:
            symbol_names[row[0]] = row[1]


def sanitize_csv(file_path):
    """
    Sanitize the CSV file by removing lines with empty fields.
    """
    sanitized_rows = []
    with open(file_path, mode="r", encoding="utf-8") as file:
        reader = csv.reader(file)
        headers = next(reader)
        for row in reader:
            if any(field.strip() == "" for field in row):
                print(f"Skipping line with empty fields in {file_path}: {row}")
                continue
            sanitized_rows.append(row)
    return headers, sanitized_rows


stock_data = []
for filename in os.listdir(stock_dir):
    if filename.endswith(".csv"):
        symbol = filename.replace(".csv", "")
        file_path = os.path.join(stock_dir, filename)

        headers, rows = sanitize_csv(file_path)

        if len(rows) < 2:
            print(f"Skipping {filename} due to insufficient data.")
            continue

        try:
            latest_day = {
                key: float(value) if value.replace(".", "", 1).isdigit() else value
                for key, value in zip(headers, rows[-1])
            }
            previous_day = {
                key: float(value) if value.replace(".", "", 1).isdigit() else value
                for key, value in zip(headers, rows[-2])
            }

            latest_day["Ticker"] = symbol.replace(".NS", "")
            latest_day["Name"] = symbol_names.get(symbol, "Unknown")
            latest_day["Change"] = (
                (
                    float(latest_day.get("Adj Close", 0))
                    - float(previous_day.get("Adj Close", 0))
                )
                / float(previous_day.get("Adj Close", 0))
                * 100
            )
        except (ValueError, KeyError, TypeError) as e:
            print(f"Skipping a line in {filename} due to error: {e}")
            continue

        stock_data.append(latest_day)


target_json_file = "LT_HIST.json"
with open(target_json_file, mode="w", encoding="utf-8") as file:
    json.dump(stock_data, file, indent=4)

print(f"Updated JSON saved to {target_json_file}")
