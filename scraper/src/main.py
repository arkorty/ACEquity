import yfinance as yf
import pandas as pd
import time
import argparse
import concurrent.futures
import math
import os
import csv
import json
import logging
import coloredlogs

# Setup logger
logger = logging.getLogger(__name__)

# Define paths relative to the project root directory
STOCK_DATA_DIR = "stockdata"
SEC_LIST_FILE = "sec_list.csv"
IND_LIST_FILE = "ind_list.csv"
TARGET_JSON_FILE = "../client/constants/TICKERS.json"
PUBLIC_DATA_DIR = "../client/public/data"


def download_stock_data(tickers_chunk):
    """
    Downloads historical data for a chunk of tickers.
    """
    if not os.path.exists(STOCK_DATA_DIR):
        try:
            os.makedirs(STOCK_DATA_DIR)
        except FileExistsError:
            pass  # Race condition in threaded environment

    for ticker in tickers_chunk:
        status = "Unknown"
        details = ""
        while True:
            try:
                dat = yf.Ticker(ticker)
                hist = dat.history(
                    period="1y", interval="1d", auto_adjust=False)
                logger.debug(f"Fetching data for {ticker}")

                if hist.empty:
                    status = "Skipped"
                    details = "No data"
                    break

                file_name = ticker
                file_path = os.path.join(STOCK_DATA_DIR, f"{file_name}.csv")

                hist.index.name = "Datetime"
                hist.to_csv(file_path)
                status = "Success"
                break
            except Exception as e:
                logger.debug(f"Error fetching data for {
                             ticker}: {e}", exc_info=True)
                if "rate limit" in str(e).lower():
                    logger.debug(f"Rate limit for {
                                 ticker}, retrying in 5 seconds...")
                    time.sleep(5)
                else:
                    status = "Failed"
                    details = str(e).splitlines()[0]  # Keep it single-line
                    break

        log_message = f"{ticker:<15} | Status: {status}"
        if details:
            log_message += f" ({details})"

        if status == "Success":
            logger.info(log_message)
        elif status == "Skipped":
            logger.warning(log_message)
        else:
            logger.error(log_message)


def run_get(num_threads):
    """
    Downloads stock data from Yahoo Finance.
    """
    logger.info("GET   | Starting download phase...")
    tickers = get_valid_tickers()

    if not tickers:
        logger.critical("GET   | No tickers to download. Halting.")
        return

    logger.info(f"GET   | Found {len(tickers)
                                 } total unique tickers to download.")

    if num_threads > 1:
        chunk_size = math.ceil(len(tickers) / num_threads)
        ticker_chunks = [
            tickers[i: i + chunk_size] for i in range(0, len(tickers), chunk_size)
        ]
        logger.info(f"GET   | Starting download with {num_threads} threads...")
        with concurrent.futures.ThreadPoolExecutor(max_workers=num_threads) as executor:
            executor.map(download_stock_data, ticker_chunks)
    else:
        logger.info("GET   | Starting download sequentially...")
        download_stock_data(tickers)

    logger.info("GET   | Finished download phase.")


def get_valid_tickers():
    """
    Reads the security lists and returns a list of valid tickers.
    """
    tickers = []
    try:
        sec_df = pd.read_csv(SEC_LIST_FILE)
        symbols = sec_df["Symbol"].dropna().tolist()
        tickers.extend([s + ".BO" for s in symbols])
        tickers.extend([s + ".NS" for s in symbols])
    except FileNotFoundError:
        logger.warning(f"SETUP | {SEC_LIST_FILE} not found.")
    except KeyError:
        logger.warning(f"SETUP | 'Symbol' column not found in {
                       SEC_LIST_FILE}.")

    try:
        ind_df = pd.read_csv(IND_LIST_FILE)
        symbols = ind_df["Symbol"].dropna().tolist()
        tickers.extend(symbols)
    except FileNotFoundError:
        logger.warning(f"SETUP | {IND_LIST_FILE} not found.")
    except KeyError:
        logger.warning(f"SETUP | 'Symbol' column not found in {
                       IND_LIST_FILE}.")

    return sorted(list(set(tickers)))


def run_cleanup():
    """
    Cleans up JSON files and TICKERS.json entries for symbols that are no longer in the CSV lists.
    """
    logger.info("CLEAN | Starting cleanup phase...")
    valid_tickers = get_valid_tickers()
    valid_tickers_set = set(valid_tickers)
    logger.info(f"CLEAN | Found {
                len(valid_tickers)} valid tickers from lists.")

    # Cleanup TICKERS.json
    if os.path.exists(TARGET_JSON_FILE):
        try:
            with open(TARGET_JSON_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)

            original_count = len(data)
            cleaned_data = [item for item in data if item.get(
                "Ticker") in valid_tickers_set]
            removed_count = original_count - len(cleaned_data)

            if removed_count > 0:
                with open(TARGET_JSON_FILE, "w", encoding="utf-8") as f:
                    json.dump(cleaned_data, f, indent=4)
                logger.info(f"CLEAN | Removed {removed_count} stale entries from {
                            TARGET_JSON_FILE}.")
            else:
                logger.info(f"CLEAN | No stale entries found in {
                            TARGET_JSON_FILE}.")
        except Exception as e:
            logger.error(f"CLEAN | Error cleaning {TARGET_JSON_FILE}: {e}")
    else:
        logger.warning(f"CLEAN | {TARGET_JSON_FILE} not found.")

    # Cleanup PUBLIC_DATA_DIR
    if os.path.exists(PUBLIC_DATA_DIR):
        valid_filenames = {t.replace('^', '') + ".json" for t in valid_tickers}
        files = os.listdir(PUBLIC_DATA_DIR)
        removed_files_count = 0
        for filename in files:
            if filename.endswith(".json"):
                if filename not in valid_filenames:
                    try:
                        os.remove(os.path.join(PUBLIC_DATA_DIR, filename))
                        removed_files_count += 1
                        logger.debug(f"CLEAN | Removed stale file: {filename}")
                    except OSError as e:
                        logger.error(f"CLEAN | Error removing {filename}: {e}")

        if removed_files_count > 0:
            logger.info(f"CLEAN | Removed {
                        removed_files_count} stale JSON files from {PUBLIC_DATA_DIR}.")
        else:
            logger.info(f"CLEAN | No stale JSON files found in {
                        PUBLIC_DATA_DIR}.")
    else:
        logger.warning(f"CLEAN | {PUBLIC_DATA_DIR} not found.")

    logger.info("CLEAN | Cleanup phase finished.")


def sanitize_csv(file_path):
    """
    Sanitize the CSV file by removing lines with empty fields.
    """
    sanitized_rows = []
    try:
        with open(file_path, mode="r", encoding="utf-8", newline="") as file:
            reader = csv.reader(file)
            headers = next(reader)
            for row in reader:
                if any(field.strip() == "" for field in row):
                    logger.debug(f"Skipping line with empty fields in {
                                 file_path}: {row}")
                    continue
                sanitized_rows.append(row)
        return headers, sanitized_rows
    except (FileNotFoundError, StopIteration):
        return [], []


def run_save():
    """
    Converts downloaded CSV data to JSON formats.
    """
    logger.info("SAVE  | Starting conversion phase: CSV to JSON...")
    if not os.path.exists(STOCK_DATA_DIR):
        logger.critical(f"SAVE  | Stock data directory not found at '{
                        STOCK_DATA_DIR}'. Please run --get first.")
        return

    symbol_names = {}
    for list_file in [SEC_LIST_FILE, IND_LIST_FILE]:
        try:
            with open(list_file, mode="r", encoding="utf-8") as file:
                reader = csv.DictReader(file)
                for row in reader:
                    symbol = row["Symbol"]
                    name = row["Security Name"]
                    if list_file == SEC_LIST_FILE:
                        symbol_names[symbol + ".BO"] = name
                        symbol_names[symbol + ".NS"] = name
                    else:
                        symbol_names[symbol] = name
        except FileNotFoundError:
            logger.warning(
                f"SAVE  | {list_file} not found. Security names may be missing.")
        except KeyError:
            logger.warning(
                f"SAVE  | 'Symbol' or 'Security Name' column not found in {list_file}.")
    logger.info(f"SAVE  | Loaded {
                len(symbol_names)} security names from lists.")

    csv_files = [f for f in os.listdir(STOCK_DATA_DIR) if f.endswith(".csv")]
    logger.info(f"SAVE  | Found {len(csv_files)} CSV files to process.")

    stock_data, skipped_insufficient, skipped_error, processed_count = [], 0, 0, 0
    for filename in csv_files:
        symbol = filename.replace(".csv", "")
        file_path = os.path.join(STOCK_DATA_DIR, filename)
        headers, rows = sanitize_csv(file_path)

        if len(rows) < 2:
            skipped_insufficient += 1
            logger.debug(
                f"Skipping {filename}: insufficient data ( < 2 rows).")
            continue
        try:
            latest_day = {k: v for k, v in zip(headers, rows[-1])}
            previous_day = {k: v for k, v in zip(headers, rows[-2])}
            for day in [latest_day, previous_day]:
                for key, value in day.items():
                    try:
                        if value and value.replace(".", "", 1).isdigit():
                            day[key] = float(value)
                    except (ValueError, TypeError):
                        pass

            latest_day["Ticker"] = symbol
            latest_day["Name"] = symbol_names.get(symbol, "Unknown")
            adj_close_latest = float(latest_day.get("Adj Close", 0))
            adj_close_previous = float(previous_day.get("Adj Close", 0))
            latest_day["Change"] = ((adj_close_latest - adj_close_previous) /
                                    adj_close_previous * 100) if adj_close_previous != 0 else 0
            stock_data.append(latest_day)
            processed_count += 1
        except (ValueError, KeyError, TypeError, IndexError) as e:
            skipped_error += 1
            logger.debug(f"Skipping a line in {
                         filename} due to error: {e}", exc_info=True)
            continue
    logger.info(f"SAVE  | Processed {processed_count} files for main JSON. Skipped: {
                skipped_insufficient + skipped_error}.")

    os.makedirs(os.path.dirname(TARGET_JSON_FILE), exist_ok=True)
    with open(TARGET_JSON_FILE, mode="w", encoding="utf-8") as file:
        json.dump(stock_data, file, indent=4)
    logger.info(f"SAVE  | Main JSON file saved to {TARGET_JSON_FILE}")

    processed_ind_count, skipped_ind_count = 0, 0
    for filename in csv_files:
        ticker = filename.replace(".csv", "")
        file_path = os.path.join(STOCK_DATA_DIR, filename)
        json_data = []
        try:
            with open(file_path, newline="", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    try:
                        if all(k in row and row[k] for k in ["Datetime", "Close", "Adj Close"]):
                            json_data.append({"Date": row["Datetime"].split(" ")[0], "Close": float(
                                row["Close"]), "Adj Close": float(row["Adj Close"])})
                    except (ValueError, TypeError):
                        logger.debug(f"Skipping invalid row in {
                                     filename}: {row}")
                        continue
        except Exception as e:
            logger.debug(f"Could not process file {
                         filename} for individual JSON: {e}", exc_info=True)
            skipped_ind_count += 1
            continue
        if len(json_data) >= 14:
            json_file_path = os.path.join(
                PUBLIC_DATA_DIR, f"{ticker.replace('^', '')}.json")
            with open(json_file_path, "w", encoding="utf-8") as f:
                json.dump(json_data, f, indent=2)
            processed_ind_count += 1
        else:
            skipped_ind_count += 1
            logger.debug(f"Skipped individual JSON for {
                         filename} (less than 14 records)")

    logger.info(f"SAVE  | Processed {
                processed_ind_count} individual stock JSONs. Skipped: {skipped_ind_count}.")
    logger.info("SAVE  | Finished conversion phase.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Download and process stock data.", formatter_class=argparse.RawTextHelpFormatter)
    parser.add_argument("--get", action="store_true",
                        help="Only download stock data as CSVs.")
    parser.add_argument("--save", action="store_true",
                        help="Only convert existing CSVs to JSON.")
    parser.add_argument("--cleanup", action="store_true",
                        help="Clean up stale JSON files and TICKERS.json entries.")
    parser.add_argument("-n", "--num-threads", type=int, default=12,
                        help="Number of parallel threads for downloading.")
    parser.add_argument("-v", "--verbose", action="store_true",
                        help="Enable verbose logging output.")
    args = parser.parse_args()

    # Suppress yfinance's noisy logging
    logging.getLogger('yfinance').setLevel(logging.CRITICAL)

    log_level = logging.DEBUG if args.verbose else logging.INFO
    fmt = "%(message)s" if not args.verbose else "%(asctime)s,%(msecs)03d  | %(levelname)-8s  | %(message)s"
    coloredlogs.install(
        level=log_level,
        logger=logger,
        fmt=fmt,
        level_styles={'info': {'color': 'cyan'}, 'warning': {'color': 'yellow'}, 'error': {
            'color': 'red'}, 'critical': {'color': 'red', 'bold': True}}
    )

    if args.get and args.save:
        logger.critical(
            "SETUP | Error: --get and --save cannot be used together.")
    elif args.get:
        run_get(args.num_threads)
    elif args.save:
        run_save()
    else:
        logger.info("SETUP | Running both GET and SAVE steps.")
        run_get(args.num_threads)
        run_save()

    if args.cleanup:
        run_cleanup()
