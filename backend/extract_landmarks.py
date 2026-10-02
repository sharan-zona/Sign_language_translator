import cv2
import mediapipe as mp
import numpy as np
from datasets import load_dataset
from huggingface_hub import hf_hub_download
from pathlib import Path


MODEL_PATH = "backend/models/hand_landmarker.task"
OUTPUT_DIR = Path("backend/processed_data")

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


print("Loading dataset...")

ds = load_dataset("vidit031/isl-isolated-40words")
rows = ds["train"]

print("Total videos:", len(rows))


BaseOptions = mp.tasks.BaseOptions
VisionRunningMode = mp.tasks.vision.RunningMode

HandLandmarker = mp.tasks.vision.HandLandmarker
HandLandmarkerOptions = mp.tasks.vision.HandLandmarkerOptions


options = HandLandmarkerOptions(
    base_options=BaseOptions(model_asset_path=MODEL_PATH),
    running_mode=VisionRunningMode.VIDEO,
    num_hands=2,
    min_hand_detection_confidence=0.5,
    min_hand_presence_confidence=0.5,
    min_tracking_confidence=0.5,
)


# Test only 5 videos first
test_rows = rows

for index, row in enumerate(test_rows, 1):

    word = row["word"]
    video_path = row["video_path"]

    print(f"[{index}/{len(rows)}] {word}")

    video_file = hf_hub_download(
        repo_id="vidit031/isl-isolated-40words",
        repo_type="dataset",
        filename=video_path,
        local_files_only=True,
    )

    cap = cv2.VideoCapture(video_file)

    if not cap.isOpened():
        print("  Could not open video")
        continue

    fps = cap.get(cv2.CAP_PROP_FPS)

    frames = []
    frame_count = 0

    # Fresh landmarker for each video
    with HandLandmarker.create_from_options(options) as landmarker:

        while True:

            success, frame = cap.read()

            if not success:
                break

            frame_count += 1

            rgb_frame = cv2.cvtColor(
                frame,
                cv2.COLOR_BGR2RGB
            )

            mp_image = mp.Image(
                image_format=mp.ImageFormat.SRGB,
                data=rgb_frame
            )

            timestamp_ms = int(
                ((frame_count - 1) / fps) * 1000
            )

            result = landmarker.detect_for_video(
                mp_image,
                timestamp_ms
            )

            # 2 hands × 21 landmarks × 3 coordinates
            frame_landmarks = np.zeros(
                (2, 21, 3),
                dtype=np.float32
            )

            for hand_index, hand in enumerate(
                result.hand_landmarks[:2]
            ):

                for landmark_index, landmark in enumerate(hand):

                    frame_landmarks[
                        hand_index,
                        landmark_index
                    ] = [
                        landmark.x,
                        landmark.y,
                        landmark.z
                    ]

            frames.append(frame_landmarks)

    cap.release()

    landmarks = np.array(
        frames,
        dtype=np.float32
    )

    filename = Path(video_path).stem + ".npy"
    output_file = OUTPUT_DIR / filename

    np.save(output_file, landmarks)

    print(f"  Frames: {frame_count}")
    print(f"  Saved: {landmarks.shape}")


print()
print("Test processing complete.")
print("Output folder:", OUTPUT_DIR)