
import cv2
import mediapipe as mp
import numpy as np
from datasets import load_dataset
from huggingface_hub import hf_hub_download
from pathlib import Path

MODEL_PATH = "backend/models/hand_landmarker.task"
OUTPUT_DIR = Path("backend/processed_data_v3")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Process only five videos for the initial test.
TEST_LIMIT = 5

print("Loading dataset...")
ds = load_dataset("vidit031/isl-isolated-40words")
rows = ds["train"]

test_rows = rows.select(range(min(TEST_LIMIT, len(rows))))

BaseOptions = mp.tasks.BaseOptions
VisionRunningMode = mp.tasks.vision.RunningMode
HandLandmarker = mp.tasks.vision.HandLandmarker
HandLandmarkerOptions = mp.tasks.vision.HandLandmarkerOptions

options = HandLandmarkerOptions(
    base_options=BaseOptions(model_asset_path=MODEL_PATH),
    running_mode=VisionRunningMode.VIDEO,
    num_hands=2,
    min_hand_detection_confidence=0.1,
    min_hand_presence_confidence=0.1,
    min_tracking_confidence=0.1,
)

for index, row in enumerate(test_rows, 1):
    word = row["word"]
    video_path = row["video_path"]

    print(f"\n[{index}/{len(test_rows)}] {word}")

    try:
        video_file = hf_hub_download(
            repo_id="vidit031/isl-isolated-40words",
            repo_type="dataset",
            filename=video_path,
            local_files_only=False,
        )
    except Exception as error:
        print(f"  Download failed: {error}")
        continue

    cap = cv2.VideoCapture(video_file)

    if not cap.isOpened():
        print("  Could not open video; skipping")
        cap.release()
        continue

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

                # Mirror the video to match the webcam pipeline.
                mirrored_frame = cv2.flip(frame, 1)
                rgb_frame = cv2.cvtColor(
                    mirrored_frame, cv2.COLOR_BGR2RGB
                )

                mp_image = mp.Image(
                    image_format=mp.ImageFormat.SRGB,
                    data=rgb_frame,
                )

                result = landmarker.detect_for_video(
                    mp_image, timestamp_ms
                )

                frame_landmarks = np.zeros(
                    (2, 21, 3), dtype=np.float32
                )

                if result.hand_landmarks:
                    detected_frames += 1

                # Keep hand slots consistent using handedness.
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

                    for landmark_index, landmark in enumerate(hand):
                        frame_landmarks[slot, landmark_index] = [
                            landmark.x,
                            landmark.y,
                            landmark.z,
                        ]

                frames.append(frame_landmarks)

    finally:
        cap.release()

    if not frames:
        print("  No frames extracted; skipping")
        continue

    landmarks = np.asarray(frames, dtype=np.float32)

    output_file = OUTPUT_DIR / (
        Path(video_path).stem + ".npy"
    )
    np.save(output_file, landmarks)

    detection_rate = (
        detected_frames / frame_count * 100
        if frame_count
        else 0.0
    )

    print(f"  Total frames: {frame_count}")
    print(f"  Frames with hands: {detected_frames}")
    print(f"  Detection rate: {detection_rate:.1f}%")
    print(f"  Saved shape: {landmarks.shape}")
    print(f"  Saved to: {output_file}")

print("\nFive-video test complete.")
print("Original landmark files were not modified.")
