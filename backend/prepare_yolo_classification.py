from pathlib import Path
import csv
import hashlib
import random

import cv2
import numpy as np

RAW_DIR = Path("backend/raw_isl_dataset")
CLASSES_FILE = Path("backend/training_data/classes.npy")
OUTPUT_DIR = Path("backend/yolo_sign_dataset_v1")

SEED = 42
MIN_VIDEOS = 10
FRAME_POSITIONS = [0.10, 0.30, 0.50, 0.70, 0.90]
SPLITS = ("train", "val", "test")

if OUTPUT_DIR.exists() and any(OUTPUT_DIR.iterdir()):
    raise SystemExit(
        f"Output folder already contains files: {OUTPUT_DIR}\n"
        "Stopping to protect existing data. Do not delete it blindly."
    )

if not RAW_DIR.exists() or not CLASSES_FILE.exists():
    raise SystemExit("Dataset or existing class-label file not found.")

classes = np.load(CLASSES_FILE, allow_pickle=True).tolist()
rng = random.Random(SEED)

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
manifest_path = OUTPUT_DIR / "frames_manifest.csv"

total_videos = 0
total_frames = 0
skipped_videos = 0
summary = []

with manifest_path.open("w", newline="", encoding="utf-8") as manifest:
    writer = csv.writer(manifest)
    writer.writerow([
        "split", "class_name", "source_video",
        "frame_index", "image_path"
    ])

    for label in classes:
        class_name = str(label).replace(" ", "_")
        class_dir = RAW_DIR / class_name

        videos = sorted(class_dir.glob("*.mp4"))
        if len(videos) < MIN_VIDEOS:
            print(
                f"Skipping {label}: only {len(videos)} videos "
                f"(minimum {MIN_VIDEOS})"
            )
            continue

        # Shuffle videos deterministically, then split by VIDEO.
        rng.shuffle(videos)
        n = len(videos)
        n_train = round(n * 0.70)
        n_val = round(n * 0.15)

        n_train = max(1, min(n_train, n - 2))
        n_val = max(1, min(n_val, n - n_train - 1))

        assignments = (
            [("train", v) for v in videos[:n_train]]
            + [("val", v) for v in videos[n_train:n_train + n_val]]
            + [("test", v) for v in videos[n_train + n_val:]]
        )

        class_image_counts = {split: 0 for split in SPLITS}
        class_video_counts = {split: 0 for split in SPLITS}

        for split, video_path in assignments:
            cap = cv2.VideoCapture(str(video_path))

            if not cap.isOpened():
                skipped_videos += 1
                cap.release()
                continue

            frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            if frame_count < 2:
                skipped_videos += 1
                cap.release()
                continue

            video_id = hashlib.sha1(
                str(video_path.relative_to(RAW_DIR)).encode()
            ).hexdigest()[:12]

            saved_from_video = 0

            for frame_number, position in enumerate(FRAME_POSITIONS):
                frame_index = round((frame_count - 1) * position)
                cap.set(cv2.CAP_PROP_POS_FRAMES, frame_index)
                ok, frame = cap.read()

                if not ok or frame is None:
                    continue

                image_dir = OUTPUT_DIR / split / class_name
                image_dir.mkdir(parents=True, exist_ok=True)

                image_path = image_dir / (
                    f"{video_id}_frame{frame_number}.jpg"
                )

                if cv2.imwrite(
                    str(image_path),
                    frame,
                    [cv2.IMWRITE_JPEG_QUALITY, 95],
                ):
                    writer.writerow([
                        split,
                        class_name,
                        str(video_path.relative_to(RAW_DIR)),
                        frame_index,
                        str(image_path),
                    ])
                    saved_from_video += 1
                    class_image_counts[split] += 1
                    total_frames += 1

            cap.release()

            if saved_from_video:
                class_video_counts[split] += 1
                total_videos += 1
            else:
                skipped_videos += 1

        print(
            f"{class_name:15} "
            f"videos train/val/test="
            f"{class_video_counts['train']}/"
            f"{class_video_counts['val']}/"
            f"{class_video_counts['test']} | "
            f"images="
            f"{class_image_counts['train']}/"
            f"{class_image_counts['val']}/"
            f"{class_image_counts['test']}"
        )

        summary.append((
            class_name,
            class_image_counts,
            class_video_counts,
        ))

print("\n===== PREPARATION SUMMARY =====")
print("Eligible classes:", len(summary))
print("Videos contributing frames:", total_videos)
print("Frames saved:", total_frames)
print("Videos skipped or unreadable:", skipped_videos)
print("Dataset folder:", OUTPUT_DIR)
print("Frame manifest:", manifest_path)

# Check that every included class has images in all three splits.
problems = []
for class_name, images, _ in summary:
    for split in SPLITS:
        if images[split] == 0:
            problems.append(f"{class_name}: no images in {split}")

if problems:
    print("\nWARNING: Check these classes before training:")
    for problem in problems:
        print(" -", problem)
else:
    print("All included classes have images in all splits.")
