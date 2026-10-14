
import os
import time
from collections import deque

import cv2
import mediapipe as mp
import numpy as np
from flask import Flask, jsonify, request
from flask_cors import CORS
from tensorflow.keras.models import load_model


BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_PATH = os.path.join(
    BASE_DIR, "models", "isl_cnn_lstm_best.keras"
)
CLASSES_PATH = os.path.join(
    BASE_DIR, "training_data", "classes.npy"
)
HAND_MODEL_PATH = os.path.join(
    BASE_DIR, "models", "hand_landmarker.task"
)

SEQUENCE_LENGTH = 64
FEATURES = 126
CONFIDENCE_THRESHOLD = 0.65
MAX_SESSIONS = 20

app = Flask(__name__)
CORS(app)

print("Loading ISL model...")

model = load_model(MODEL_PATH, compile=False)
classes = np.load(CLASSES_PATH, allow_pickle=True)

if model.input_shape[1:] != (SEQUENCE_LENGTH, FEATURES):
    raise ValueError(
        f"Unexpected model input shape: {model.input_shape}"
    )

if model.output_shape[-1] != len(classes):
    raise ValueError(
        "Model output count does not match classes.npy"
    )

print("Model loaded successfully.")

BaseOptions = mp.tasks.BaseOptions
RunningMode = mp.tasks.vision.RunningMode
HandLandmarker = mp.tasks.vision.HandLandmarker
HandLandmarkerOptions = mp.tasks.vision.HandLandmarkerOptions

options = HandLandmarkerOptions(
    base_options=BaseOptions(model_asset_path=HAND_MODEL_PATH),
    running_mode=RunningMode.VIDEO,
    num_hands=2,
    min_hand_detection_confidence=0.1,
    min_hand_presence_confidence=0.1,
    min_tracking_confidence=0.1,
)

landmarker = HandLandmarker.create_from_options(options)

sequences = {}
last_timestamp = {}


def get_detected_hands(result):
    """Return normalized x/y points for drawing the hand skeleton."""
    detected_hands = []

    for hand in result.hand_landmarks:
        detected_hands.append([
            [float(point.x), float(point.y)]
            for point in hand
        ])

    return detected_hands


def build_response(
    recognized_text,
    confidence,
    ready,
    frames_collected,
    detected_hands,
):
    return jsonify({
        "success": True,
        "recognized_text": recognized_text,
        "confidence": float(confidence),
        "ready": ready,
        "frames_collected": frames_collected,
        "frames_required": SEQUENCE_LENGTH,
        "landmarks": detected_hands,
    })


@app.get("/api/health")
def health():
    return jsonify({
        "success": True,
        "message": "Recognition backend connected",
        "model_loaded": True,
    })


@app.post("/api/recognize")
def recognize():
    session_id = request.form.get("session_id", "default")

    if "frame" not in request.files:
        return jsonify({
            "success": False,
            "error": "Missing frame upload",
        }), 400

    image_bytes = request.files["frame"].read()

    if not image_bytes:
        return jsonify({
            "success": False,
            "error": "Empty frame",
        }), 400

    image_array = np.frombuffer(image_bytes, dtype=np.uint8)
    frame = cv2.imdecode(image_array, cv2.IMREAD_COLOR)

    if frame is None:
        return jsonify({
            "success": False,
            "error": "Invalid image frame",
        }), 400

    # Mirror webcam frames, matching the current live camera pipeline.
    frame = cv2.flip(frame, 1)
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    mp_image = mp.Image(
        image_format=mp.ImageFormat.SRGB,
        data=rgb,
    )

    timestamp = max(
        int(time.monotonic() * 1000),
        last_timestamp.get(session_id, 0) + 1,
    )
    last_timestamp[session_id] = timestamp

    result = landmarker.detect_for_video(mp_image, timestamp)

    # Preserve the existing model input layout:
    # left hand slot 0, right hand slot 1, 21 points, xyz.
    landmarks = np.zeros((2, 21, 3), dtype=np.float32)

    if result.hand_landmarks:
        for hand, handedness in zip(
            result.hand_landmarks,
            result.handedness,
        ):
            label = (
                handedness[0].category_name
                if handedness
                else ""
            )

            if label == "Left":
                slot = 0
            elif label == "Right":
                slot = 1
            else:
                continue

            for index, point in enumerate(hand):
                landmarks[slot, index] = [
                    point.x,
                    point.y,
                    point.z,
                ]

    # Send coordinates separately for the frontend overlay.
    detected_hands = get_detected_hands(result)

    if session_id not in sequences:
        if len(sequences) >= MAX_SESSIONS:
            oldest = next(iter(sequences))
            sequences.pop(oldest, None)
            last_timestamp.pop(oldest, None)

        sequences[session_id] = deque(maxlen=SEQUENCE_LENGTH)

    sequences[session_id].append(landmarks.reshape(FEATURES))

    frames_collected = len(sequences[session_id])

    if frames_collected < SEQUENCE_LENGTH:
        return build_response(
            recognized_text="Collecting frames...",
            confidence=0.0,
            ready=False,
            frames_collected=frames_collected,
            detected_hands=detected_hands,
        )

    sample = np.asarray(
        sequences[session_id],
        dtype=np.float32,
    )

    probabilities = model.predict(
        sample[np.newaxis, ...],
        verbose=0,
    )[0]

    best_index = int(np.argmax(probabilities))
    confidence = float(probabilities[best_index])

    if confidence >= CONFIDENCE_THRESHOLD:
        word = str(classes[best_index])
    else:
        word = "Uncertain"

    return build_response(
        recognized_text=word,
        confidence=confidence,
        ready=True,
        frames_collected=SEQUENCE_LENGTH,
        detected_hands=detected_hands,
    )


@app.post("/api/reset")
def reset():
    session_id = request.form.get("session_id", "default")

    sequences.pop(session_id, None)
    last_timestamp.pop(session_id, None)

    return jsonify({
        "success": True,
        "message": "Sequence reset",
    })


if __name__ == "__main__":
    try:
        app.run(
            host="127.0.0.1",
            port=5000,
            debug=False,
        )
    finally:
        landmarker.close()
