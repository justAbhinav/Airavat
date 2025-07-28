# =================================================================
# FILE: app.py (CORRECTED)
# =================================================================
# This version correctly combines JWT authentication with the robust
# status-checking logic from the previous iteration.

import os
import time
import json
import uuid
import threading
import jwt
from functools import wraps
from flask import Flask, request, jsonify
from redis import Redis
from rq import Queue
from rq.registry import StartedJobRegistry
from pyngrok import ngrok
from flask_cors import CORS

from tasks import process_heavy_task, load_db

# --- Configuration & Global State ---
REDIS_HOST = os.environ.get("REDIS_HOST", "localhost")
REDIS_PORT = int(os.environ.get("REDIS_PORT", 6379))
MAIN_SERVER_PORT = 5000
DATA_EXPIRATION_SECONDS = 600

# --- JWT Configuration ---
JWT_SECRET = "abbajabbadabba"
JWT_ALGORITHM = "HS256"

webhook_data_store = {}
webhook_data_lock = threading.Lock()
ngrok_tunnel = None
ngrok_lock = threading.Lock()

def cleanup_webhook_store():
    while True:
        with webhook_data_lock:
            current_time = time.time()
            keys_to_delete = [
                job_id for job_id, item in webhook_data_store.items()
                if (current_time - item['timestamp']) > DATA_EXPIRATION_SECONDS
            ]
            for key in keys_to_delete:
                del webhook_data_store[key]
        time.sleep(300)

# --- Main App Initialization ---
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

try:
    redis_conn = Redis(host=REDIS_HOST, port=REDIS_PORT)
    task_queue = Queue(connection=redis_conn)
    print("Successfully connected to Redis.")
except Exception as e:
    print(f"Could not connect to Redis: {e}")
    exit(1)

# --- JWT Authentication Decorator ---
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            token = request.headers['Authorization'].split(" ")[1]
        if not token:
            return jsonify({'message': 'Authorization token is missing!'}), 401
        try:
            jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
            return jsonify({'message': 'Authentication Token is invalid!'}), 401
        return f(*args, **kwargs)
    return decorated

# --- API Endpoints ---
# Webhook receiver and viewer are unchanged
@app.route('/dashboard_webhook_receiver', methods=['POST'])
def dashboard_webhook_receiver():
    payload = request.get_json()
    job_id = payload.get('job_id')
    if job_id:
        with webhook_data_lock:
            webhook_data_store[job_id] = {'timestamp': time.time(), 'data': payload}
    return jsonify({"status": "webhook received"}), 200

@app.route('/view_webhook/<job_id>')
def view_webhook(job_id):
    with webhook_data_lock:
        item = webhook_data_store.get(job_id)
    html = f"""<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Webhook Viewer for Job {job_id}</title><style>body{{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background-color:#111827;color:#e5e7eb;line-height:1.6;padding:2rem}}h1{{color:#fff;border-bottom:2px solid #374151;padding-bottom:.5rem}}.job-id{{background-color:#3b82f6;color:#fff;padding:.2rem .6rem;border-radius:5px;font-family:monospace;font-size:.9em}}.webhook-item{{background-color:#1f2937;border:1px solid #374151;border-radius:8px;margin-top:1.5rem}}.webhook-header{{background-color:#374151;padding:.75rem 1rem;font-weight:700;border-top-left-radius:8px;border-top-right-radius:8px}}pre{{background-color:#0d1117;color:#c9d1d9;padding:1rem;border-radius:5px;white-space:pre-wrap;word-wrap:break-word;font-size:.875rem}}.waiting-state{{text-align:center;color:#9ca3af;margin-top:3rem;font-size:1.2rem}}.spinner{{margin:2rem auto;width:40px;height:40px;border:4px solid #374151;border-top:4px solid #3b82f6;border-radius:50%;animation:spin 1s linear infinite}}@keyframes spin{{0%{{transform:rotate(0)}}100%{{transform:rotate(360deg)}}}}</style></head><body><h1>Webhook Viewer</h1><p>Viewing results for Job ID: <span class="job-id">{job_id}</span></p>"""
    if item:
        html += f"""<div class="webhook-item"><div class="webhook-header">Received at: {time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(item['timestamp']))}</div><pre>{json.dumps(item['data'], indent=2)}</pre></div>"""
    else:
        html += '<meta http-equiv="refresh" content="3"><div class="waiting-state"><div class="spinner"></div><p>Waiting for worker to complete the job...</p><p>This page will automatically refresh.</p></div>'
    html += "</body></html>"
    return html

# --- /submit endpoint with JWT authentication ---
@app.route('/submit', methods=['POST'])
@token_required
def submit_task():
    global ngrok_tunnel
    data = request.get_json()
    task_payload = data.get('payload')
    create_webhook = data.get('create_webhook', False)
    job_id = str(uuid.uuid4())
    respond_back_url = None
    if create_webhook:
        with ngrok_lock:
            if ngrok_tunnel is None:
                try:
                    ngrok_tunnel = ngrok.connect(MAIN_SERVER_PORT)
                except Exception as e:
                    return jsonify({"error": "Failed to create webhook tunnel."}), 500
        if ngrok_tunnel:
            respond_back_url = f"{ngrok_tunnel.public_url}/dashboard_webhook_receiver"
    task_queue.enqueue(process_heavy_task, args=(task_payload, respond_back_url), job_id=job_id)
    response_data = {"message": "Task submitted successfully.", "job_id": job_id, "status_url": f"/status/{job_id}"}
    if create_webhook:
        response_data["webhook_viewer_url"] = f"http://127.0.0.1:{MAIN_SERVER_PORT}/view_webhook/{job_id}"
    return jsonify(response_data), 202

# --- /status endpoint with the correct, robust logic ---
@app.route('/status/<job_id>', methods=['GET'])
def get_status(job_id):
    # 1. Check for a final result in the file database first.
    results_db = load_db()
    job_info = results_db.get(job_id)
    if job_info and job_info.get('status') != 'processing':
        return jsonify({"job_id": job_id, **job_info}), 200

    # 2. If no final result, check Redis to see if the job is active.
    try:
        if job_id in task_queue.job_ids:
            return jsonify({"job_id": job_id, "status": "pending", "message": "Job is in the queue waiting to be processed."}), 202
        
        started_registry = StartedJobRegistry(queue=task_queue)
        if job_id in started_registry:
            return jsonify({"job_id": job_id, "status": "processing", "message": "Job is currently being executed by a worker."}), 202
    except Exception as e:
        print(f"Error checking Redis for job status: {e}")

    # 3. If not found anywhere, assume it's expired or invalid.
    return jsonify({
        "job_id": job_id,
        "status": "expired or not found",
        "message": "The job result has expired or the ID is invalid. Please submit a new job."
    }), 404

if __name__ == '__main__':
    if not os.path.exists('job_results.json'):
        with open('job_results.json', 'w') as f: json.dump({}, f)
    cleanup_thread = threading.Thread(target=cleanup_webhook_store, daemon=True)
    cleanup_thread.start()
    app.run(debug=False, host='0.0.0.0', port=MAIN_SERVER_PORT)