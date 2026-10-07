import csv
from pathlib import Path
from datasets import load_dataset

PROCESSED_DIR = Path("backend/processed_data")
OUTPUT_FILE = PROCESSED_DIR / "labels.csv"

print("Loading dataset...")

ds = load_dataset("vidit031/isl-isolated-40words")
rows = ds["train"]

with open(OUTPUT_FILE, "w", newline="", encoding="utf-8") as file:
    writer = csv.writer(file)
    writer.writerow(["filename", "word"])

    for row in rows:
        filename = Path(row["video_path"]).stem + ".npy"
        word = row["word"]

        npy_file = PROCESSED_DIR / filename

        if npy_file.exists():
            writer.writerow([filename, word])

print()
print("Labels created successfully.")
print("Saved to:", OUTPUT_FILE)