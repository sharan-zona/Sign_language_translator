import numpy as np
import pandas as pd
from pathlib import Path
from collections import Counter
from sklearn.preprocessing import LabelEncoder


# --------------------------------------------------
# Configuration
# --------------------------------------------------

PROCESSED_DIR = Path("backend/processed_data")
OUTPUT_DIR = Path("backend/training_data")

LABELS_FILE = PROCESSED_DIR / "labels.csv"

SEQUENCE_LENGTH = 64
FEATURES_PER_FRAME = 126
MIN_SAMPLES_PER_CLASS = 6

RANDOM_SEED = 42


# --------------------------------------------------
# Create output directory
# --------------------------------------------------

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


# --------------------------------------------------
# Load labels
# --------------------------------------------------

print("Loading labels...")

df = pd.read_csv(LABELS_FILE)

print("Total samples in labels.csv:", len(df))


# --------------------------------------------------
# Check class distribution
# --------------------------------------------------

word_counts = Counter(df["word"])

print()
print("Class distribution:")
for word, count in sorted(word_counts.items()):
    print(f"{word:12} : {count}")


# --------------------------------------------------
# Remove classes with too few samples
# --------------------------------------------------

valid_words = {
    word
    for word, count in word_counts.items()
    if count >= MIN_SAMPLES_PER_CLASS
}

excluded_words = {
    word
    for word, count in word_counts.items()
    if count < MIN_SAMPLES_PER_CLASS
}

print()
print("Minimum samples required:", MIN_SAMPLES_PER_CLASS)

print()
print("Excluded classes:")
if excluded_words:
    for word in sorted(excluded_words):
        print(f"{word:12} : {word_counts[word]}")
else:
    print("None")

print()
print("Classes used for training:", len(valid_words))


# --------------------------------------------------
# Keep only valid classes
# --------------------------------------------------

df = df[df["word"].isin(valid_words)].reset_index(drop=True)

print("Samples after filtering:", len(df))


# --------------------------------------------------
# Load landmark data
# --------------------------------------------------

print()
print("Loading processed data...")

X = []
words = []

missing_files = []

for _, row in df.iterrows():

    filename = row["filename"]
    word = row["word"]

    npy_file = PROCESSED_DIR / filename

    if not npy_file.exists():
        missing_files.append(filename)
        continue

    data = np.load(npy_file)

    # Expected shape:
    # (frames, 2, 21, 3)

    if data.ndim != 4:
        print("Skipping invalid file:", filename)
        print("Shape:", data.shape)
        continue

    frames = data.shape[0]

    # --------------------------------------------------
    # Reshape:
    # (frames, 2, 21, 3)
    # ->
    # (frames, 126)
    # --------------------------------------------------

    data = data.reshape(frames, FEATURES_PER_FRAME)

    # --------------------------------------------------
    # Pad or truncate to 64 frames
    # --------------------------------------------------

    if frames < SEQUENCE_LENGTH:

        padding = np.zeros(
            (
                SEQUENCE_LENGTH - frames,
                FEATURES_PER_FRAME
            ),
            dtype=np.float32
        )

        data = np.vstack((data, padding))

    elif frames > SEQUENCE_LENGTH:

        data = data[:SEQUENCE_LENGTH]

    X.append(data)
    words.append(word)


# --------------------------------------------------
# Missing file information
# --------------------------------------------------

if missing_files:

    print()
    print("Warning: Missing .npy files:", len(missing_files))

    for filename in missing_files[:10]:
        print(filename)

    if len(missing_files) > 10:
        print("...and more")


# --------------------------------------------------
# Convert to NumPy arrays
# --------------------------------------------------

X = np.array(X, dtype=np.float32)
words = np.array(words)


print()
print("Data shape:", X.shape)
print("Number of samples:", len(X))


# --------------------------------------------------
# Encode words into numbers
# --------------------------------------------------

encoder = LabelEncoder()

y = encoder.fit_transform(words)

print("Number of classes:", len(encoder.classes_))

print()
print("Classes:")

for index, class_name in enumerate(encoder.classes_):
    print(f"{index:2} -> {class_name}")


# --------------------------------------------------
# Train / Validation / Test split
# --------------------------------------------------

print()
print("Creating train / validation / test split...")

rng = np.random.default_rng(RANDOM_SEED)

train_indices = []
val_indices = []
test_indices = []


for class_id in np.unique(y):

    indices = np.where(y == class_id)[0]

    rng.shuffle(indices)

    n = len(indices)

    # One sample for validation
    # One sample for testing
    #
    # Remaining samples go to training

    n_val = 1
    n_test = 1
    n_train = n - n_val - n_test

    train_indices.extend(
        indices[:n_train]
    )

    val_indices.extend(
        indices[n_train:n_train + n_val]
    )

    test_indices.extend(
        indices[n_train + n_val:]
    )


# --------------------------------------------------
# Shuffle each split
# --------------------------------------------------

rng.shuffle(train_indices)
rng.shuffle(val_indices)
rng.shuffle(test_indices)


# --------------------------------------------------
# Create datasets
# --------------------------------------------------

X_train = X[train_indices]
y_train = y[train_indices]

X_val = X[val_indices]
y_val = y[val_indices]

X_test = X[test_indices]
y_test = y[test_indices]


# --------------------------------------------------
# Print final shapes
# --------------------------------------------------

print()
print("Final dataset:")
print("----------------------------")
print("Training:   ", X_train.shape)
print("Validation: ", X_val.shape)
print("Testing:    ", X_test.shape)


# --------------------------------------------------
# Print label shapes
# --------------------------------------------------

print()
print("Label shapes:")
print("----------------------------")
print("y_train:", y_train.shape)
print("y_val:  ", y_val.shape)
print("y_test: ", y_test.shape)


# --------------------------------------------------
# Save datasets
# --------------------------------------------------

print()
print("Saving training data...")

np.save(
    OUTPUT_DIR / "X_train.npy",
    X_train
)

np.save(
    OUTPUT_DIR / "X_val.npy",
    X_val
)

np.save(
    OUTPUT_DIR / "X_test.npy",
    X_test
)

np.save(
    OUTPUT_DIR / "y_train.npy",
    y_train
)

np.save(
    OUTPUT_DIR / "y_val.npy",
    y_val
)

np.save(
    OUTPUT_DIR / "y_test.npy",
    y_test
)

np.save(
    OUTPUT_DIR / "classes.npy",
    encoder.classes_
)


# --------------------------------------------------
# Final information
# --------------------------------------------------

print()
print("====================================")
print("Data preparation completed!")
print("====================================")

print()
print("Saved files:")

print("X_train.npy")
print("X_val.npy")
print("X_test.npy")

print("y_train.npy")
print("y_val.npy")
print("y_test.npy")

print("classes.npy")

print()
print("Output directory:")
print(OUTPUT_DIR)

print()
print("Input shape for LSTM:")
print(
    f"({SEQUENCE_LENGTH}, {FEATURES_PER_FRAME})"
)

print()
print("Number of classes:")
print(len(encoder.classes_))

print()
print("Ready for LSTM training.")

