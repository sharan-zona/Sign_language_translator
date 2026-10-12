
import numpy as np
from pathlib import Path

from tensorflow.keras.models import Sequential, load_model
from tensorflow.keras.layers import (
    Input,
    Conv1D,
    MaxPooling1D,
    LSTM,
    Dense,
    Dropout,
    BatchNormalization
)
from tensorflow.keras.callbacks import (
    EarlyStopping,
    ModelCheckpoint,
    ReduceLROnPlateau
)
from tensorflow.keras.utils import to_categorical


# --------------------------------------------------
# Paths
# --------------------------------------------------

DATA_DIR = Path("backend/training_data_v2")
MODEL_DIR = Path("backend/models")
MODEL_DIR.mkdir(parents=True, exist_ok=True)

BEST_MODEL_PATH = MODEL_DIR / "isl_cnn_lstm_v2_best.keras"
FINAL_MODEL_PATH = MODEL_DIR / "isl_cnn_lstm_v2_final.keras"
HISTORY_PATH = MODEL_DIR / "cnn_lstm_v2_training_history.npy"

# --------------------------------------------------
# Load prepared data
# --------------------------------------------------

print("Loading training data...")

X_train = np.load(DATA_DIR / "X_train.npy")
X_val = np.load(DATA_DIR / "X_val.npy")
X_test = np.load(DATA_DIR / "X_test.npy")

y_train = np.load(DATA_DIR / "y_train.npy")
y_val = np.load(DATA_DIR / "y_val.npy")
y_test = np.load(DATA_DIR / "y_test.npy")

classes = np.load(
    DATA_DIR / "classes.npy",
    allow_pickle=True
)

num_classes = len(classes)

print("\nDataset information")
print("-------------------")
print("Training:", X_train.shape, y_train.shape)
print("Validation:", X_val.shape, y_val.shape)
print("Testing:", X_test.shape, y_test.shape)
print("Number of classes:", num_classes)

if X_train.ndim != 3 or X_train.shape[1:] != (64, 126):
    raise ValueError(
        f"Expected training input shape (samples, 64, 126), "
        f"but received {X_train.shape}"
    )

if len(np.unique(y_train)) > num_classes:
    raise ValueError("Training labels exceed the number of classes.")

if len(classes) != 30:
    print(
        f"Warning: expected 30 classes based on the current setup, "
        f"but found {num_classes}."
    )


# --------------------------------------------------
# Convert labels to one-hot encoding
# --------------------------------------------------

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
# Build CNN + LSTM model
# --------------------------------------------------

print("\nBuilding CNN + LSTM model...")

model = Sequential([
    Input(shape=(64, 126)),

    # Extract local patterns from landmark sequences
    Conv1D(
        filters=64,
        kernel_size=3,
        padding="same",
        activation="relu"
    ),

    BatchNormalization(),

    MaxPooling1D(pool_size=2),

    Dropout(0.25),

    # Learn higher-level temporal patterns
    Conv1D(
        filters=128,
        kernel_size=3,
        padding="same",
        activation="relu"
    ),

    BatchNormalization(),

    # Reduce sequence length before LSTM
    MaxPooling1D(pool_size=2),

    Dropout(0.25),

    # Learn sign movement over time
    LSTM(
        96,
        return_sequences=False
    ),

    Dropout(0.4),

    Dense(
        64,
        activation="relu"
    ),

    Dropout(0.3),

    # Predict the sign class
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
# Display architecture
# --------------------------------------------------

print("\nCNN + LSTM architecture")
print("-----------------------")

model.summary()


# --------------------------------------------------
# Training callbacks
# --------------------------------------------------

early_stopping = EarlyStopping(
    monitor="val_loss",
    patience=15,
    restore_best_weights=True,
    verbose=1
)

model_checkpoint = ModelCheckpoint(
    filepath=str(BEST_MODEL_PATH),
    monitor="val_accuracy",
    save_best_only=True,
    mode="max",
    verbose=1
)

reduce_lr = ReduceLROnPlateau(
    monitor="val_loss",
    factor=0.5,
    patience=5,
    min_lr=1e-6,
    verbose=1
)


# --------------------------------------------------
# Train model
# --------------------------------------------------

print("\nStarting CNN + LSTM training...")
print("================================")

history = model.fit(
    X_train,
    y_train,
    validation_data=(X_val, y_val),
    epochs=100,
    batch_size=16,
    callbacks=[
        early_stopping,
        model_checkpoint,
        reduce_lr
    ],
    verbose=1
)


# --------------------------------------------------
# Save final training model and history
# --------------------------------------------------

model.save(FINAL_MODEL_PATH)

np.save(
    HISTORY_PATH,
    history.history,
    allow_pickle=True
)

print("\nFinal training model saved:", FINAL_MODEL_PATH)
print("Training history saved:", HISTORY_PATH)


# --------------------------------------------------
# Evaluate best checkpoint on test data
# --------------------------------------------------

print("\nLoading best CNN + LSTM checkpoint...")

best_model = load_model(BEST_MODEL_PATH)

print("\nEvaluating best model on test data...")
print("=====================================")

test_loss, test_accuracy = best_model.evaluate(
    X_test,
    y_test,
    verbose=1
)

print("\nCNN + LSTM results")
print("------------------")
print(f"Test loss: {test_loss:.4f}")
print(f"Test accuracy: {test_accuracy * 100:.2f}%")

print("\nSaved files:")
print(BEST_MODEL_PATH)
print(FINAL_MODEL_PATH)
print(HISTORY_PATH)

print("\nTraining completed!")
