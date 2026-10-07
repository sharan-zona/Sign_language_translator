import csv
import numpy as np
from pathlib import Path
from collections import Counter
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder

PROCESSED_DIR = Path("backend/processed_data")
LABELS_FILE = PROCESSED_DIR / "labels.csv"
OUTPUT_DIR = Path("backend/training_data")

OUTPUT_DIR.mkdir(exist_ok=True)

SEQUENCE_LENGTH = 64
MIN_SAMPLES_PER_CLASS = 6

X = []
words = []

print("Reading labels...")

with open(LABELS_FILE, "r", encoding="utf-8") as file:
    rows = list(csv.DictReader(file))

# Count samples for every word
word_counts = Counter(row["word"] for row in rows)

print()
print("Class distribution:")
for word, count in word_counts.most_common():
    print(f"{word}: {count}")

# Keep only classes with enough samples
valid_words = {
    word for word, count in word_counts.items()
    if count >= MIN_SAMPLES_PER_CLASS
}

print()
print(f"Classes before filtering: {len(word_counts)}")
print(f"Classes after filtering: {len(valid_words)}")
print(f"Minimum samples per class: {MIN_SAMPLES_PER_CLASS}")

print()
print("Excluded classes:")

for word, count in word_counts.items():
    if word not in valid_words:
        print(f"{word}: {count}")

print()
print("Loading processed data...")

for row in rows:
    filename = row["filename"]
    word = row["word"]

    # Skip classes with too few samples
    if word not in valid_words:
        continue

    npy_file = PROCESSED_DIR / filename

    if not npy_file.exists():
        print(f"Skipping missing file: {filename}")
        continue

    data = np.load(npy_file)

    # Original:
    # (frames, 2, 21, 3)
    #
    # Convert to:
    # (frames, 126)

    data = data.reshape(data.shape[0], -1)

    # Pad or truncate to 64 frames
    if data.shape[0] < SEQUENCE_LENGTH:

        padding = np.zeros(
            (SEQUENCE_LENGTH - data.shape[0], data.shape[1]),
            dtype=np.float32
        )

        data = np.vstack((data, padding))

    else:
        data = data[:SEQUENCE_LENGTH]

    X.append(data)
    words.append(word)

X = np.array(X, dtype=np.float32)

print()
print("Final data shape:", X.shape)
print("Final samples:", len(X))
print("Final classes:", len(set(words)))

# Encode class names
encoder = LabelEncoder()
y = encoder.fit_transform(words)

# 80% training, 20% temporary
X_train, X_temp, y_train, y_temp = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y
)

# 10% validation, 10% testing
X_val, X_test, y_val, y_test = train_test_split(
    X_temp,
    y_temp,
    test_size=0.50,
    random_state=42,
    stratify=y_temp
)

print()
print("Training:", X_train.shape)
print("Validation:", X_val.shape)
print("Testing:", X_test.shape)

# Save data
np.save(OUTPUT_DIR / "X_train.npy", X_train)
np.save(OUTPUT_DIR / "X_val.npy", X_val)
np.save(OUTPUT_DIR / "X_test.npy", X_test)

np.save(OUTPUT_DIR / "y_train.npy", y_train)
np.save(OUTPUT_DIR / "y_val.npy", y_val)
np.save(OUTPUT_DIR / "y_test.npy", y_test)

# Save class names
np.save(OUTPUT_DIR / "classes.npy", encoder.classes_)

print()
print("Dataset preparation completed.")
print("Saved to:", OUTPUT_DIR)
