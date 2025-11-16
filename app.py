import os
import base64
from datetime import datetime
from functools import wraps

from flask import Flask, request, jsonify,g
import psycopg2.extras
import bcrypt
from flask_cors import CORS

from app_Utils.inference import detect_litter
from db import get_db  # your helper returning psycopg2 connection

app = Flask(__name__)

CORS(app, resources={
    r"/api/*": {
        "origins": [
            "http://localhost:5173",
            "https://warrant-motherboard-doubt-forecasts.trycloudflare.com"
        ]
    }
})

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# -------------------------
# Utility helpers
# -------------------------
def save_base64_image(b64_str, prefix="img"):
    header, data = (b64_str.split(",", 1) + [None])[:2]  # handle possible "data:image/..."
    img_bytes = base64.b64decode(data if data else b64_str)
    fname = f"{prefix}_{datetime.now().strftime('%Y%m%d_%H%M%S_%f')}.jpg"
    path = os.path.join(UPLOAD_FOLDER, fname)
    with open(path, "wb") as f:
        f.write(img_bytes)
    return path


def image_to_base64(path):
    try:
        with open(path, "rb") as img_file:
            return base64.b64encode(img_file.read()).decode("utf-8")
    except Exception:
        return None

def get_user_by_username(username):
    conn = get_db()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("SELECT * FROM users WHERE username = %s", (username,))
    user = cur.fetchone()
    cur.close(); conn.close()
    return user

# Simple decorator to require auth via username in payload (prototype)
def require_user(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        data = request.json or {}
        username = data.get("username") or request.args.get("username")
        if not username:
            return jsonify({"error": "missing username"}), 400
        user = get_user_by_username(username)
        if not user:
            return jsonify({"error": "user not found"}), 404
        g.current_user = user
        return func(*args, **kwargs)
    return wrapper

# -------------------------
# Auth endpoints
# -------------------------
@app.route("/api/auth/signup", methods=["POST"])
def signup():
    data = request.json
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")
    role = data.get("role", "citizen")

    if not username or not password:
        return jsonify({"error": "username and password required"}), 400

    pw_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("""
            INSERT INTO users (username, email, password_hash, role)
            VALUES (%s, %s, %s, %s) RETURNING id
        """, (username, email, pw_hash, role))
        user_id = cur.fetchone()[0]
        conn.commit()
    except Exception as e:
        conn.rollback()
        cur.close(); conn.close()
        return jsonify({"error": "could not create user", "detail": str(e)}), 400

    cur.close(); conn.close()
    return jsonify({"message": "user created", "user_id": user_id})

@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.json
    username = data.get("username")
    password = data.get("password")
    if not username or not password:
        return jsonify({"error": "username and password required"}), 400

    conn = get_db()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("SELECT * FROM users WHERE username = %s", (username,))
    user = cur.fetchone()
    cur.close(); conn.close()

    if not user:
        return jsonify({"error": "invalid credentials"}), 401

    if not bcrypt.checkpw(password.encode(), user["password_hash"].encode()):
        return jsonify({"error": "invalid credentials"}), 401

    # prototype: return user info (no JWT). Frontend can store username for requests.
    return jsonify({"message": "ok", "username": user["username"], "role": user["role"]})

@app.route("/api/auth/logout", methods=["POST"])
def logout():
    # since we're using stateless auth (username passed each time),
    # logout simply tells the frontend to clear stored credentials.
    return jsonify({"message": "logged out"})

# -------------------------
# 1) Report waste (before photo) - classifier applied
# -------------------------
@app.route("/api/report", methods=["POST"])
@require_user
def report_waste():
    data = request.json
    img_b64 = data.get("image")
    lat = data.get("lat")
    lon = data.get("lon")
    description = data.get("description", "")

    if not img_b64 or lat is None or lon is None:
        return jsonify({"error": "image, lat, lon required"}), 400

    # Save temp image
    img_path = save_base64_image(img_b64, prefix="before")

    # Run classifier
    result = detect_litter(img_path)
    print("Inference:", result)

    count = result.get("count", 0)
    categories = result.get("categories", [])

    # ---------------------------------------------
    # CLASSIFICATION LOGIC: Plastic + Pile
    # ---------------------------------------------
    plastic_count = sum(1 for c in categories if "plastic" in c.lower())
    pile_count = sum(1 for c in categories if "pile" in c.lower())

    # Rules:
    # - Accept if at least 1 pile
    # - OR if at least 5 plastics
    if pile_count >= 1:
        accept = True
    elif plastic_count >= 5:
        accept = True
    else:
        accept = False

    # ---------------------------------------------
    # Reject if the rules are not met
    # ---------------------------------------------
    if not accept:
        try:
            os.remove(img_path)
        except Exception:
            pass

        return jsonify({
            "message": "rejected",
            "reason": "insufficient_litter",
            "count": count,
            "plastic_count": plastic_count,
            "pile_count": pile_count
        }), 200

    # ---------------------------------------------
    # Store accepted report
    # ---------------------------------------------
    conn = get_db()
    cur = conn.cursor()

    # Convert numpy types → python types for DB
    clean_detections = []
    for det in result.get("detections", []):
        clean_det = {
            "bbox": [float(v) for v in det["bbox"]],
            "confidence": float(det["confidence"]),
            "name": det["name"]
        }
        clean_detections.append(clean_det)

    try:
        cur.execute("""
            INSERT INTO litter_reports
            (user_id, image_path, lat, lon, description, count, categories, raw_detections)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            g.current_user["id"],
            img_path,
            lat,
            lon,
            description,
            count,
            categories,
            psycopg2.extras.Json(clean_detections)
        ))
        report_id = cur.fetchone()[0]
        conn.commit()
    except Exception as e:
        conn.rollback()
        cur.close()
        conn.close()
        return jsonify({"error": "db insert failed", "detail": str(e)}), 500

    cur.close()
    conn.close()

    # ---------------------------------------------
    # SUCCESS RESPONSE
    # ---------------------------------------------
    return jsonify({
        "message": "accepted",
        "report_id": report_id,
        "count": count,
        "plastic_count": plastic_count,
        "pile_count": pile_count,
        "result": result
    })


# -------------------------
# 2) After cleanup upload
# -------------------------
@app.route("/api/cleanup", methods=["POST"])
@require_user
def upload_cleanup():
    data = request.json
    img_b64 = data.get("image")
    report_id = data.get("report_id")
    description = data.get("description", "")

    if not img_b64 or not report_id:
        return jsonify({"error": "image and report_id required"}), 400

    img_path = save_base64_image(img_b64, prefix="after")

    conn = get_db()
    cur = conn.cursor()
    try:
        # ensure report exists
        cur.execute("SELECT id FROM litter_reports WHERE id = %s", (report_id,))
        if not cur.fetchone():
            cur.close(); conn.close()
            # delete image because report invalid
            try: os.remove(img_path)
            except: pass
            return jsonify({"error": "report not found"}), 404

        cur.execute("""
            INSERT INTO cleanup_reports (report_id, user_id, image_path, description)
            VALUES (%s, %s, %s, %s)
        """, (report_id, g.current_user["id"], img_path, description))

        # mark the report as 'completed' (needs verification)
        cur.execute("UPDATE litter_reports SET status = 'completed' WHERE id = %s", (report_id,))
        conn.commit()
    except Exception as e:
        conn.rollback()
        cur.close(); conn.close()
        return jsonify({"error": "db error", "detail": str(e)}), 500

    cur.close(); conn.close()
    return jsonify({"message": "cleanup stored", "report_id": report_id})

# -------------------------
# 3) GET pending reports (active)
# -------------------------
@app.route("/api/reports/pending", methods=["GET"])
def get_pending_reports():
    conn = get_db()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    cur.execute("SELECT * FROM litter_reports WHERE status = 'active' ORDER BY created_at DESC")
    rows = cur.fetchall()

    cur.close()
    conn.close()

    # Add base64 image to each row
    for r in rows:
        img_b64 = image_to_base64(r["image_path"])
        r["image_base64"] = f"data:image/jpeg;base64,{img_b64}" if img_b64 else None

    return jsonify(rows)

# -------------------------
# 4) GET completed but not verified
# -------------------------
@app.route("/api/reports/completed", methods=["GET"])
def get_completed_reports():
    conn = get_db()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("SELECT lr.*, cr.id as cleanup_id, cr.image_path as cleanup_image, cr.created_at as cleanup_at "
                "FROM litter_reports lr LEFT JOIN cleanup_reports cr ON lr.id = cr.report_id "
                "WHERE lr.status = 'completed' ORDER BY lr.created_at DESC")
    rows = cur.fetchall()
    cur.close(); conn.close()
    return jsonify(rows)

# -------------------------
# 5) GET verified
# -------------------------
@app.route("/api/reports/verified", methods=["GET"])
def get_verified_reports():
    conn = get_db()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("SELECT * FROM litter_reports WHERE status = 'verified' ORDER BY verified_at DESC")
    rows = cur.fetchall()
    cur.close(); conn.close()
    return jsonify(rows)

# -------------------------
# 6) Official verification endpoint
# -------------------------
@app.route("/api/reports/verify", methods=["POST"])
@require_user
def verify_report():
    # This should be called by an official user (role check)
    if g.current_user["role"] != "official":
        return jsonify({"error": "only officials can verify"}), 403

    data = request.json
    report_id = data.get("report_id")
    action = data.get("action")  # 'approve' or 'disapprove'
    notes = data.get("notes", "")

    if action not in ("approve", "disapprove"):
        return jsonify({"error": "action must be 'approve' or 'disapprove'"}), 400

    conn = get_db()
    cur = conn.cursor()

    try:
        # ensure report exists
        cur.execute("SELECT * FROM litter_reports WHERE id = %s", (report_id,))
        if not cur.fetchone():
            cur.close(); conn.close()
            return jsonify({"error": "report not found"}), 404

        # record verification audit
        cur.execute("""
            INSERT INTO verifications (report_id, official_name, action, notes)
            VALUES (%s, %s, %s, %s)
        """, (report_id, g.current_user["username"], action, notes))

        if action == "approve":
            cur.execute("""
                UPDATE litter_reports
                SET status = 'verified', verified_by = %s, verified_at = NOW()
                WHERE id = %s
            """, (g.current_user["username"], report_id))
        else:
            # disapprove: mark as 'rejected' or return to active. We'll mark as 'rejected'
            cur.execute("""
                UPDATE litter_reports
                SET status = 'rejected'
                WHERE id = %s
            """, (report_id,))

        conn.commit()
    except Exception as e:
        conn.rollback()
        cur.close(); conn.close()
        return jsonify({"error":"db error", "detail": str(e)}), 500

    cur.close(); conn.close()
    return jsonify({"message": "verification recorded", "report_id": report_id, "action": action})

# -------------------------
# 7) Analytics endpoint
# -------------------------
@app.route("/api/analytics", methods=["GET"])
def analytics():
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("SELECT COUNT(*) FROM litter_reports WHERE status = 'active'")
        pending = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM litter_reports WHERE status = 'completed'")
        completed = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM litter_reports WHERE status = 'verified'")
        verified = cur.fetchone()[0]
        # active citizens = distinct usernames of reporters in last 10 days
        cur.execute("""
            SELECT COUNT(DISTINCT u.id) FROM users u
            JOIN litter_reports lr ON lr.user_id = u.id
            WHERE lr.created_at >= NOW() - INTERVAL '10 days'
        """)
        active_citizens = cur.fetchone()[0]
    finally:
        cur.close(); conn.close()

    return jsonify({
        "pending_count": pending,
        "completed_count": completed,
        "verified_count": verified,
        "active_citizens_10days": active_citizens
    })

# -------------------------
# 8) Recent 10-day log (optional detail)
# -------------------------
@app.route("/api/reports/recent", methods=["GET"])
def recent_logs():
    conn = get_db()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("""
        SELECT lr.*, array_agg(cr.image_path) AS cleanup_images
        FROM litter_reports lr
        LEFT JOIN cleanup_reports cr ON cr.report_id = lr.id
        WHERE lr.created_at >= NOW() - INTERVAL '10 days'
        GROUP BY lr.id
        ORDER BY lr.created_at DESC
    """)
    rows = cur.fetchall()
    cur.close(); conn.close()
    return jsonify(rows)

# -------------------------
# Health check
# -------------------------
@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "time": datetime.now().isoformat()})


# -------------------------
# Run app
# -------------------------
if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
