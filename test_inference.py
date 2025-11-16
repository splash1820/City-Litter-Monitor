import torch
from pathlib import Path
from IPython.display import Image, display  # Optional (for notebooks)

# ---------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------
MODEL_PATH = "pLitterStreet_YOLOv5l.pt"   # Path to your downloaded model
IMAGE_PATH = "uploads/2Test2.jpeg"            # Path to the image you want to test

# ---------------------------------------------------------------------
# Load YOLOv5 model
# ---------------------------------------------------------------------
print("Loading model...")
model = torch.hub.load('ultralytics/yolov5', 'custom', path=MODEL_PATH, force_reload=True)
print("✅ Model loaded successfully!")

# ---------------------------------------------------------------------
# Run inference
# ---------------------------------------------------------------------
print(f"Running inference on {IMAGE_PATH} ...")
results = model(IMAGE_PATH)

# ---------------------------------------------------------------------
# Save annotated output
# ---------------------------------------------------------------------
results.save()   # saves to 'runs/detect/exp' by default
print("✅ Inference complete!")
print("Results saved in:", Path("runs/detect/exp").resolve())

# ---------------------------------------------------------------------
# Print detection summary
# ---------------------------------------------------------------------
detections = results.xyxy[0]  # detections for first (and only) image
if len(detections) == 0:
    print("🚫 No litter detected.")
else:
    print(f"🗑️ {len(detections)} litter objects detected:")
    for *box, conf, cls in detections:
        print(f"  - {model.names[int(cls)]} | confidence: {conf:.2f}")

# ---------------------------------------------------------------------
# (Optional) Display result if using Jupyter/Colab
# ---------------------------------------------------------------------
output_image = Path("runs/detect/exp") / Path(IMAGE_PATH).name
if output_image.exists():
    try:
        display(Image(filename=str(output_image)))
    except Exception:
        print("🖼️ Output image saved, open it manually to view the detection boxes.")
