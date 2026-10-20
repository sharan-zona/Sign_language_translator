import csv
import cv2
import mediapipe as mp
import numpy as np

from pathlib import Path
from datasets import load_dataset
from huggingface_hub import hf_hub_download

PROCESSED_DIR = Path("backend/processed_data_v3")
MODEL_PATH = "backend/models/hand_landmarker.task"
PROCESSED_DIR.mkdir(parents=True, exist_ok=True)


CLASSES = [
    "drink", "eat", "father", "food", "friend", "go",
    "he", "hello", "help", "hospital", "market", "mother",
    "no", "okay", "please", "school", "she", "sister",
    "sit", "sorry", "student", "tea", "teacher", "thank you",
    "today", "water", "what", "where", "yes", "you",
]

print("Loading dataset...")
dataset = load_dataset("vidit031/isl-isolated-40words")
rows = dataset["train"]

selected = [
    (i, row) for i, row in enumerate(rows)
    if row["word"] in CLASSES
]

print("Total dataset videos:", len(rows))
print("Videos selected for our 30 classes:", len(selected))

BaseOptions = mp.tasks.BaseOptions
RunningMode = mp.tasks.vision.RunningMode
HandLandmarker = mp.tasks.vision.HandLandmarker
Options = mp.tasks.vision.HandLandmarkerOptions

options = Options(
    base_options=BaseOptions(model_asset_path=MODEL_PATH),
    running_mode=RunningMode.VIDEO,
    num_hands=2,
    min_hand_detection_confidence=0.1,
    min_hand_presence_confidence=0.1,
    min_tracking_confidence=0.1,
)

labels_file = PROCESSED_DIR / "labels.csv"

# Preserve labels from previous extraction runs.
records = []
if labels_file.exists():
    with labels_file.open(newline="", encoding="utf-8") as f:
        records = list(csv.DictReader(f))

existing_filenames = {row["filename"] for row in records}
failures = []

for position, (source_index, row) in enumerate(selected, 1):
    word = row["word"]
    video_path = row["video_path"]

    # Unique names avoid collisions with old V2 or test files.
    filename = f"v3_{source_index:04d}_{Path(video_path).stem}.npy"
    output_file = PROCESSED_DIR / filename

    # Skip existing files and preserve their labels.
    if output_file.exists():
        if filename not in existing_filenames:
            records.append({"filename": filename, "word": word})
            existing_filenames.add(filename)
        print(f"Skipping existing file: {filename}")
        continue

    print(f"\n[{position}/{len(selected)}] {word}: {filename}")

    try:
        video_file = hf_hub_download(
            repo_id="vidit031/isl-isolated-40words",
            repo_type="dataset",
            filename=video_path,
        )

        cap = cv2.VideoCapture(video_file)

        if not cap.isOpened():
            raise RuntimeError("Could not open downloaded video")

        fps = cap.get(cv2.CAP_PROP_FPS)
        if not fps or fps <= 0:
            fps = 30.0

        frames = []
        frame_count = 0
        detected_frames = 0

        try:
            with HandLandmarker.create_from_options(options) as landmarker:
                while True:
                    success, frame = cap.read()
                    if not success:
                        break

                    timestamp_ms = int(frame_count * 1000 / fps)
                    frame_count += 1

                    # Match the live webcam preprocessing.
                    frame = cv2.flip(frame, 1)
                    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

                    image = mp.Image(
                        image_format=mp.ImageFormat.SRGB,
                        data=rgb,
                    )

                    result = landmarker.detect_for_video(
                        image, timestamp_ms
                    )

                    landmarks = np.zeros(
                        (2, 21, 3), dtype=np.float32
                    )

                    if result.hand_landmarks:
                        detected_frames += 1

                    for hand, handedness in zip(
                        result.hand_landmarks,
                        result.handedness,
                    ):
                        label = (
                            handedness[0].category_name
                            if handedness else ""
                        )

                        if label == "Left":
                            slot = 0
                        elif label == "Right":
                            slot = 1
                        else:
                            continue

                        for j, point in enumerate(hand):
                            landmarks[slot, j] = [
                                point.x, point.y, point.z
                            ]

                    frames.append(landmarks)
        finally:
            cap.release()

        if not frames:
            raise RuntimeError("No frames extracted")

        array = np.asarray(frames, dtype=np.float32)

        if not np.isfinite(array).all():
            raise RuntimeError("Non-finite landmark values")

        if not np.any(array):
            raise RuntimeError("No hand landmarks detected in video")

        np.save(output_file, array)
        records.append({"filename": filename, "word": word})
        existing_filenames.add(filename)

        rate = 100 * detected_frames / frame_count if frame_count else 0
        print(
            f"Saved {array.shape}; "
            f"hand-detection rate: {rate:.1f}%"
        )

    except Exception as error:
        failures.append((filename, word, str(error)))
        print("FAILED:", error)

# Write labels only for files successfully created in this run.
labels_file = PROCESSED_DIR / "labels.csv"
with labels_file.open("w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=["filename", "word"])
    writer.writeheader()
    writer.writerows(records)

print("\n========== EXTRACTION SUMMARY ==========")
print("Selected videos:", len(selected))
print("Successfully extracted:", len(records))
print("Failed:", len(failures))
print("Labels saved to:", labels_file)

print("\nClass counts:")
for word in CLASSES:
    count = sum(r["word"] == word for r in records)
    print(f"{word:12} {count}")

if failures:
    failure_file = PROCESSED_DIR / "extraction_failures.txt"
    with failure_file.open("w", encoding="utf-8") as f:
        for filename, word, error in failures:
            f.write(f"{filename}\t{word}\t{error}\n")
    print("\nFailure details saved to:", failure_file)

print("\nExtraction finished. Review the counts before training.")
