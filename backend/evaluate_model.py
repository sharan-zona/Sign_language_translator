import numpy as np
from pathlib import Path

from tensorflow.keras.models import load_model
from sklearn.metrics import confusion_matrix, classification_report


# --------------------------------------------------
# Paths
# --------------------------------------------------

DATA_DIR = Path("backend/training_data")
MODEL_DIR = Path("backend/models")

MODEL_PATH = MODEL_DIR / "isl_lstm_best.keras"


# --------------------------------------------------
# Load data
# --------------------------------------------------

print("Loading test data...")

X_test = np.load(DATA_DIR / "X_test.npy")
y_test = np.load(DATA_DIR / "y_test.npy")
classes = np.load(
    DATA_DIR / "classes.npy",
    allow_pickle=True
)


# --------------------------------------------------
# Load model
# --------------------------------------------------

print("Loading trained model...")

model = load_model(MODEL_PATH)


# --------------------------------------------------
# Make predictions
# --------------------------------------------------

print("Making predictions...")

predictions = model.predict(
    X_test,
    verbose=0
)

y_pred = np.argmax(
    predictions,
    axis=1
)


# --------------------------------------------------
# Overall accuracy
# --------------------------------------------------

accuracy = np.mean(
    y_pred == y_test
)

print()
print("====================================")
print("MODEL ACCURACY")
print("====================================")

print(
    f"Accuracy: {accuracy * 100:.2f}%"
)

print(
    f"Correct: {np.sum(y_pred == y_test)} / {len(y_test)}"
)


# --------------------------------------------------
# Individual predictions
# --------------------------------------------------

print()
print("====================================")
print("INDIVIDUAL PREDICTIONS")
print("====================================")

for i in range(len(y_test)):

    actual = classes[y_test[i]]
    predicted = classes[y_pred[i]]

    confidence = predictions[i][y_pred[i]] * 100

    if y_test[i] == y_pred[i]:
        result = "CORRECT"
    else:
        result = "WRONG"

    print(
        f"{i + 1:2}. "
        f"Actual: {actual:12} | "
        f"Predicted: {predicted:12} | "
        f"Confidence: {confidence:6.2f}% | "
        f"{result}"
    )


# --------------------------------------------------
# Classification report
# --------------------------------------------------

print()
print("====================================")
print("CLASSIFICATION REPORT")
print("====================================")

print(
    classification_report(
        y_test,
        y_pred,
        labels=np.arange(len(classes)),
        target_names=classes,
        zero_division=0
    )
)


# --------------------------------------------------
# Confusion matrix
# --------------------------------------------------

cm = confusion_matrix(
    y_test,
    y_pred,
    labels=np.arange(len(classes))
)

print()
print("====================================")
print("CONFUSION MATRIX")
print("====================================")

print(cm)
