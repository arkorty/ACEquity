import os
import csv
import json


stock_dir = "stockdata/"

bsesymbols = "bsesymbols.csv"
nsesymbols = "nsesymbols.csv"


symbol_names = {}
with open(bsesymbols, mode="r", encoding="utf-8") as file:
    reader = csv.reader(file)
    next(reader)
    for row in reader:
        if len(row) >= 2:
            symbol_names[row[0]] = row[1]

with open(nsesymbols, mode="r", encoding="utf-8") as file:
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

            latest_day["Ticker"] = symbol
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


target_json_file = "../client/constants/TICKERS.json"
with open(target_json_file, mode="w", encoding="utf-8") as file:
    json.dump(stock_data, file, indent=4)

print(f"Updated JSON saved to {target_json_file}")


input_dir = "stockdata/"
output_dir = "../client/public/data/"

os.makedirs(output_dir, exist_ok=True)

for filename in os.listdir(input_dir):
    if filename.endswith(".csv"):
        ticker = filename.replace(".csv", "")
        json_data = []

        with open(os.path.join(input_dir, filename), newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                try:
                    json_data.append(
                        {
                            "Date": row["Datetime"].split(" ")[0],
                            "Close": float(row["Close"]) if row["Close"] else None,
                            "Adj Close": (
                                float(row["Adj Close"]) if row["Adj Close"] else None
                            ),
                        }
                    )
                except ValueError:
                    print(f"Skipping invalid row in {filename}: {row}")
                except Exception as e:
                    print(f"Skipping row in {filename}: {row} - {e}")

        if len(json_data) >= 14:
            json_file_path = os.path.join(output_dir, f"{ticker.replace('^', '')}.json")
            with open(json_file_path, "w", encoding="utf-8") as f:
                json.dump(json_data, f, indent=2)

            print(f"Saved: {json_file_path}")
        else:
            print(f"Skipped {filename} (less than 14 records)")
