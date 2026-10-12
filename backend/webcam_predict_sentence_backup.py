import cv2
import mediapipe as mp
import numpy as np
from collections import deque
from tensorflow.keras.models import load_model

MODEL_PATH = "backend/models/isl_cnn_lstm_best.keras"
HAND_MODEL_PATH = "backend/models/hand_landmarker.task"
CLASSES_PATH = "backend/training_data/classes.npy"

SEQUENCE_LENGTH = 64
FEATURES = 126
CONFIDENCE_THRESHOLD = 0.50

print("Loading sign language model...")
model = load_model(MODEL_PATH, compile=False)
classes = np.load(CLASSES_PATH, allow_pickle=True)

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

camera = cv2.VideoCapture(0)

if not camera.isOpened():
    print("ERROR: Could not open webcam.")
    print("Check camera permissions or try changing VideoCapture(0) to VideoCapture(1).")
    raise SystemExit(1)

sequence = deque(maxlen=SEQUENCE_LENGTH)
frame_number = 0
predicted_word = "Show your hands"
confidence = 0.0

print("Webcam started. Press Q to quit.")

with HandLandmarker.create_from_options(options) as landmarker:
    while True:
        success, frame = camera.read()
        if not success:
            print("Could not read from webcam.")
            break

        frame = cv2.flip(frame, 1)
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        image = mp.Image(
            image_format=mp.ImageFormat.SRGB,
            data=rgb,
        )

        timestamp_ms = int(frame_number * 1000 / 30)
        frame_number += 1

        result = landmarker.detect_for_video(image, timestamp_ms)

        landmarks = np.zeros((2, 21, 3), dtype=np.float32)

        if result.hand_landmarks:
            for hand, handedness in zip(
                result.hand_landmarks, result.handedness
            ):
                label = handedness[0].category_name if handedness else ""

                if label == "Left":
                    slot = 0
                elif label == "Right":
                    slot = 1
                else:
                    continue

                for i, point in enumerate(hand):
                    landmarks[slot, i] = [point.x, point.y, point.z]

        sequence.append(landmarks.reshape(FEATURES))

        if len(sequence) == SEQUENCE_LENGTH:
            sample = np.asarray(sequence, dtype=np.float32)
            probabilities = model.predict(
                sample[np.newaxis, ...], verbose=0
            )[0]

            best_index = int(np.argmax(probabilities))
            confidence = float(probabilities[best_index])
            predicted_word = (
                str(classes[best_index])
                if confidence >= CONFIDENCE_THRESHOLD
                else "Uncertain"
            )

        cv2.putText(
            frame,
            f"Sign: {predicted_word}",
            (20, 40),
            cv2.FONT_HERSHEY_SIMPLEX,
            1,
            (0, 255, 0),
            2,
        )

        cv2.putText(
            frame,
            f"Confidence: {confidence * 100:.1f}%",
            (20, 80),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (255, 255, 255),
            2,
        )

        cv2.putText(
            frame,
            f"Frames: {len(sequence)}/{SEQUENCE_LENGTH} | Q: quit",
            (20, frame.shape[0] - 20),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.6,
            (255, 255, 255),
            2,
        )

        cv2.imshow("ISL Translator - Webcam", frame)

        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

camera.release()
cv2.destroyAllWindows()
print("Webcam closed.")
