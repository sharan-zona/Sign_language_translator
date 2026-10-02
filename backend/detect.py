import cv2
import mediapipe as mp

VIDEO_PATH = "/home/codespace/.cache/huggingface/hub/datasets--vidit031--isl-isolated-40words/snapshots/255ce7fd10da5d05bc30d59668ba256e5f02531c/thank_you/thank_you__CISLR__00000__-4MbWP5T-cU.mp4"

MODEL_PATH = "backend/models/hand_landmarker.task"

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

cap = cv2.VideoCapture(VIDEO_PATH)

if not cap.isOpened():
    print("Could not open video")
    exit()

frame_count = 0

with HandLandmarker.create_from_options(options) as landmarker:

    fps = cap.get(cv2.CAP_PROP_FPS)

    while True:
        success, frame = cap.read()

        if not success:
            break

        frame_count += 1

        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        mp_image = mp.Image(
            image_format=mp.ImageFormat.SRGB,
            data=rgb_frame
        )

        timestamp_ms = int((frame_count / fps) * 1000)

        result = landmarker.detect_for_video(
            mp_image,
            timestamp_ms
        )

        if result.hand_landmarks:
            print(
                f"Frame {frame_count}: "
                f"{len(result.hand_landmarks)} hand(s) detected"
            )

            for hand in result.hand_landmarks:
                print(f"  Landmarks: {len(hand)}")

        else:
            print(f"Frame {frame_count}: No hand detected")

cap.release()

print()
print("Total frames processed:", frame_count)