from datasets import load_dataset
from huggingface_hub import hf_hub_download

print("Loading dataset metadata...")

ds = load_dataset("vidit031/isl-isolated-40words")
rows = ds["train"]

print(f"Total videos: {len(rows)}")

for i, row in enumerate(rows):
    video_path = row["video_path"]

    print(f"[{i + 1}/{len(rows)}] Downloading: {row['word']}")

    hf_hub_download(
        repo_id="vidit031/isl-isolated-40words",
        repo_type="dataset",
        filename=video_path,
    )

print("All videos downloaded successfully.")

