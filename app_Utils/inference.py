import torch
import sys
from pathlib import Path
import numpy as np
from PIL import Image

# force yolov5 path
YOLO_ROOT = Path(__file__).resolve().parent.parent / "yolov5"
sys.path.insert(0, str(YOLO_ROOT))

from yolov5.models.common import AutoShape
from yolov5.models.yolo import Model
from yolov5.utils.general import non_max_suppression, scale_coords
from yolov5.utils.augmentations import letterbox


MODEL_PATH = "models/pLitterStreet_YOLOv5l.pt"

# Load model like torch hub does internally
ckpt = torch.load(MODEL_PATH, map_location='cpu', weights_only=False)
model = ckpt['model'].float()
model.eval()

# Wrap with AutoShape (handles resizing, padding, NMS, scaling)
model = AutoShape(model)

def to_py(obj):
    """Convert numpy types to native Python types for JSON serialization."""
    if isinstance(obj, (np.generic, np.float32, np.float64, np.int32, np.int64)):
        return obj.item()
    if isinstance(obj, (list, tuple)):
        return [to_py(x) for x in obj]
    return obj

def detect_litter(image_path):
    results = model(image_path)

    # results.xyxy[0] gives standard YOLO output
    pred = results.xyxy[0].numpy()

    detections = []
    for *xyxy, conf, cls in pred:
        detections.append({
        "bbox": to_py(xyxy),
        "confidence": float(conf),
        "name": model.names[int(cls)],
        })

    return {
    "count": len(detections),
    "categories": [d["name"] for d in detections],
    "detections": detections
}
