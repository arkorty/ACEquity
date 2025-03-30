import os
import csv
import json


input_dir = "stockdata/"
output_dir = "stockjson/"


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

        json_file_path = os.path.join(
            output_dir,
            f"{ticker.replace("^", "")}.json",
        )
        with open(json_file_path, "w", encoding="utf-8") as f:
            json.dump(json_data, f, indent=2)

        print(f"Saved: {json_file_path}")
