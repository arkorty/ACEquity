# delete all the json files in the directory that are empty or have fewer than 14 entries in the root array
import os
import json

def delete_empty_json_files(directory):
    if not os.path.exists(directory):
        print(f"Directory does not exist: {directory}")
        return
    if not os.path.isdir(directory):
        print(f"Provided path is not a directory: {directory}")
        return

    for filename in os.listdir(directory):
        if filename.endswith('.json'):
            file_path = os.path.join(directory, filename)
            try:
                with open(file_path, 'r') as file:
                    data = json.load(file)
                    # Check if the JSON file is empty or root array has fewer than 14 entries
                    if not data or (isinstance(data, list) and len(data) < 14):
                        os.remove(file_path)
                        print(f"Deleted JSON file: {file_path}")
            except json.JSONDecodeError:
                print(f"Error decoding JSON from file: {file_path}")
            except Exception as e:
                print(f"Error processing file {file_path}: {e}")

if __name__ == "__main__":
    directory = './'
    delete_empty_json_files(directory)
    print("Finished deleting empty JSON files.")
