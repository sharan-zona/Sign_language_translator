import numpy as np
from pathlib import Path

from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint
from tensorflow.keras.utils import to_categorical


# --------------------------------------------------
# Paths
# --------------------------------------------------

DATA_DIR = Path("backend/training_data")
MODEL_DIR = Path("backend/models")

MODEL_DIR.mkdir(parents=True, exist_ok=True)


# --------------------------------------------------
# Load training data
# --------------------------------------------------

print("Loading training data...")

X_train = np.load(DATA_DIR / "X_train.npy")
X_val = np.load(DATA_DIR / "X_val.npy")
X_test = np.load(DATA_DIR / "X_test.npy")

y_train = np.load(DATA_DIR / "y_train.npy")
y_val = np.load(DATA_DIR / "y_val.npy")
y_test = np.load(DATA_DIR / "y_test.npy")

classes = np.load(DATA_DIR / "classes.npy", allow_pickle=True)


# --------------------------------------------------
# Display dataset information
# --------------------------------------------------

print()
print("Dataset:")
print("--------------------------------")
print("X_train:", X_train.shape)
print("X_val:  ", X_val.shape)
print("X_test: ", X_test.shape)

print()
print("y_train:", y_train.shape)
print("y_val:  ", y_val.shape)
print("y_test: ", y_test.shape)

print()
print("Number of classes:", len(classes))

print()
print("Classes:")
for i, name in enumerate(classes):
    print(f"{i:2} -> {name}")


# --------------------------------------------------
# Convert labels to one-hot encoding
# --------------------------------------------------

num_classes = len(classes)

y_train = to_categorical(
    y_train,
    num_classes=num_classes
)

y_val = to_categorical(
    y_val,
    num_classes=num_classes
)

y_test = to_categorical(
    y_test,
    num_classes=num_classes
)


# --------------------------------------------------
# Build LSTM model
# --------------------------------------------------

print()
print("Building LSTM model...")

model = Sequential([

    LSTM(
        128,
        return_sequences=True,
        input_shape=(64, 126)
    ),

    Dropout(0.3),

    LSTM(
        64,
        return_sequences=False
    ),

    Dropout(0.3),

    Dense(
        64,
        activation="relu"
    ),

    Dropout(0.3),

    Dense(
        num_classes,
        activation="softmax"
    )
])


# --------------------------------------------------
# Compile model
# --------------------------------------------------

model.compile(
    optimizer="adam",
    loss="categorical_crossentropy",
    metrics=["accuracy"]
)


# --------------------------------------------------
# Display model
# --------------------------------------------------

print()
print("Model architecture:")
print("--------------------------------")

model.summary()


# --------------------------------------------------
# Callbacks
# --------------------------------------------------

model_path = MODEL_DIR / "isl_lstm_best.keras"

early_stopping = EarlyStopping(
    monitor="val_loss",
    patience=15,
    restore_best_weights=True,
    verbose=1
)

model_checkpoint = ModelCheckpoint(
    model_path,
    monitor="val_accuracy",
    save_best_only=True,
    verbose=1
)


# --------------------------------------------------
# Train model
# --------------------------------------------------

print()
print("Starting training...")
print("================================")

history = model.fit(
    X_train,
    y_train,

    validation_data=(
        X_val,
        y_val
    ),

    epochs=100,
    batch_size=16,

    callbacks=[
        early_stopping,
        model_checkpoint
    ],

    verbose=1
)


# --------------------------------------------------
# Evaluate on test data
# --------------------------------------------------

print()
print("Evaluating model...")
print("================================")

test_loss, test_accuracy = model.evaluate(
    X_test,
    y_test,
    verbose=1
)

print()
print("Test Loss:", test_loss)
print("Test Accuracy:", test_accuracy)


# --------------------------------------------------
# Save final model
# --------------------------------------------------

final_model_path = MODEL_DIR / "isl_lstm_final.keras"

model.save(final_model_path)


# --------------------------------------------------
# Save training history
# --------------------------------------------------

history_path = MODEL_DIR / "training_history.npy"

np.save(
    history_path,
    history.history,
    allow_pickle=True
)


# --------------------------------------------------
# Final information
# --------------------------------------------------

print()
print("====================================")
print("Training completed!")
print("====================================")

print()
print("Best model:")
print(model_path)

print()
print("Final model:")
print(final_model_path)

print()
print("Training history:")
print(history_path)

print()
print("Final test accuracy:")
print(f"{test_accuracy * 100:.2f}%")
