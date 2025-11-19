# ✅ **requirements.txt**

```
Flask==3.0.3
psycopg2-binary==2.9.9
python-dotenv==1.0.1

# YOLOv5 + PyTorch
torch==2.2.2
torchvision==0.17.2

# Image + Array processing
Pillow==10.2.0
numpy==1.26.4

#
dotenv
flask_cors

# (Optional but recommended)
opencv-python-headless==4.10.0.84
```

⚠️ **Do NOT include ultralytics**
project uses local YOLOv5, not ultralytics package.

---

# ✅ **.env (place at project root)**

```
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=littermap
DB_USER=postgres
DB_PASS=YOUR_PASSWORD_HERE

# Flask
FLASK_ENV=development
SECRET_KEY=change_this_to_something_random
```

Replace `YOUR_PASSWORD_HERE`.

---

# ✅ **db.py (update to load from .env)**

Use python-dotenv to load credentials:

```python
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

def get_db():
    conn = psycopg2.connect(
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT"),
        database=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASS")
    )
    return conn
```

---


# 🗑️ City-Litter-Monitor – Smart City Litter Reporting & Cleanup System

City-Litter-Monitor is a smart waste-monitoring platform where citizens report litter hotspots using photographs, and authorities verify & track cleanup progress. It integrates **YOLOv5 litter detection**, **Flask backend**, **PostgreSQL**, and **a frontend app** to create a transparent, crowdsourced cleanliness system.

---

## 🚀 Features

### 🧑‍🤝‍🧑 Citizen Side

* Capture image (camera-only recommended)
* YOLOv5 automatically detects *plastic / pile* waste
* Location auto-attached
* Report stored only if litter threshold is met
* Upload cleanup photos after cleaning
* View own reports & status

### 🏛️ Authority/Admin Side

* View **pending**, **completed (awaiting verification)**, and **verified** reports
* Compare before/after images
* Approve or reject cleanup
* Monitor trends through analytics

### 🧠 ML Integration

* Local **YOLOv5 (v6.2)** inference
* AutoShape wrapper for perfect consistency with Google Colab
* Fast CPU inference
* Custom plastic/pile classifier: *pLitterStreet_YOLOv5l.pt*

---

## ⚙️ Setup Instructions

### 🔗 Download Model

pLitterStreet_YOLOv5l.pt
https://github.com/gicait/pLitter/releases/download/v0.0.0-street/pLitterStreet_YOLOv5l.pt

📁 Where to place it

After downloading, place the model inside:

City-Litter-Monitor/models/pLitterStreet_YOLOv5l.pt


Your folder structure should look like:
```bash
City-Litter-Monitor/
│
├── models/
│     └── pLitterStreet_YOLOv5l.pt
```

YOLO inference will not work unless the model is correctly placed in this folder.

## 🐍 YOLOv5 Setup (Required)

This project uses a local clone of YOLOv5 (v6.2) for inference.
You must clone the repo inside the project folder.

1️⃣ Clone YOLOv5

From inside the project root (City-Litter-Monitor/):

git clone https://github.com/ultralytics/yolov5.git
cd yolov5
git checkout v6.2


This ensures compatibility with the AutoShape wrapper used in this project.

2️⃣ Folder Structure After Cloning

Your project should look like:
```
City-Litter-Monitor/
│
├── yolov5/
```

# 💻 React Client Setup (Frontend)

This project includes a React-based frontend for citizens and authorities to upload litter reports, view status, and interact with the backend.

The React app is located in:

LitterMap/client/


Follow these steps to set it up:

1️⃣ Navigate to the client folder
```
cd client
```
2️⃣ Install dependencies
```
npm install
```

3️⃣ Configure API URL (Important)

Inside the React project, locate:

client/src/api/appClient.js

Then set:

baseURL = "http://localhost:5000"; -> Your backend url

## 🗂️ Project Structure

```
LitterMap/
│
├── app.py               # Flask backend
├── db.py
├── models/
├── yolov5/
│
├── client/              # React frontend
│     ├── src/
│     ├── public/
│     └── package.json
```

---

## 🛠️ Backend Setup

### 1️⃣ Clone the repository

```bash
git clone https://github.com/splash1820/City-Litter-Monitor.git
cd City-Litter-Monitor
```

### 2️⃣ Create a virtual environment

```bash
python -m venv venv
venv\Scripts\activate  # Windows
```

### 3️⃣ Install dependencies

```bash
pip install -r requirements.txt
```

### 4️⃣ Create `.env` file

```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=littermap
DB_USER=postgres
DB_PASS=yourpassword
```

### 5️⃣ Import PostgreSQL schema

Open pgAdmin or psql and run the tables from **/database/schema.sql**.

### 6️⃣ Run backend

```bash
python app.py
```

Backend runs at:
👉 **[http://localhost:5000](http://localhost:5000)**

---

## 🧠 YOLOv5 Inference

This project uses a **local YOLOv5 clone** (v6.2) with an **AutoShape wrapper** for maximum stability.

Inference example:

```python
from app_Utils.inference import detect_litter

print(detect_litter("uploads/test.jpg"))
```

---

## 🧪 API Overview

### Authentication

```
POST /api/auth/signup
POST /api/auth/login
POST /api/auth/logout
```

### Reporting

```
POST /api/report
POST /api/cleanup
```

### Retrieval

```
GET /api/reports/pending
GET /api/reports/completed
GET /api/reports/verified
GET /api/reports/recent
GET /api/analytics
```

### Verification

```
POST /api/reports/verify
```

---

## 🧹 Plastic Threshold Logic

Reports are only accepted if:

* YOLO detects litter
* At least **5 detections** contain `"plastic","pile"` substring

This minimizes false reporting.

---

## 🙌 Contributors

* **splash1820** — Backend, ML integration
* **Samarth Jadhav** - React Frontend integration
* YOLOv5 contributors
* Model Repository - https://github.com/gicait/pLitter

---

