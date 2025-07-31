
import os
import time
import json
import requests
from rq import get_current_job

RESULT_DB_FILE = 'job_results.json'
DATA_EXPIRATION_SECONDS = 600  # 10 minutes

def load_db():
    if not os.path.exists(RESULT_DB_FILE): return {}
    try:
        with open(RESULT_DB_FILE, 'r') as f: return json.load(f)
    except (json.JSONDecodeError, FileNotFoundError): return {}

def save_and_cleanup_db(job_id, data_to_save):
    """
    Loads the database, cleans up old entries, adds the new one,
    and saves the file.
    """
    db = load_db()
    
    # --- NEW: Cleanup Logic ---
    current_time = time.time()
    # Create a new dictionary with only the non-expired jobs
    cleaned_db = {
        jid: job_data for jid, job_data in db.items()
        if 'timestamp' in job_data and (current_time - job_data['timestamp']) < DATA_EXPIRATION_SECONDS
    }
    
    # Add the new job data with a fresh timestamp
    data_to_save['timestamp'] = current_time
    cleaned_db[job_id] = data_to_save
    
    # Save the cleaned database back to the file
    with open(RESULT_DB_FILE, 'w') as f:
        json.dump(cleaned_db, f, indent=4)

# --- Worker Task Definition (MODIFIED) ---
def process_heavy_task(task_data, respond_back_url=None):
    job = get_current_job()
    job_id = job.id

    print(f"Worker processing job_id: {job_id}")
    # Save initial "processing" status
    save_and_cleanup_db(job_id, {'status': 'processing', 'result': None})

    try:
        external_webhook_url = 'http://localhost:5678/webhook/vra-webhook'
        print(f"Calling external webhook: {external_webhook_url}")
        response = requests.post(external_webhook_url, json=task_data, timeout=600)
        response.raise_for_status()
        final_result = response.json()
        status = 'completed'
    except requests.exceptions.RequestException as e:
        print(f"Error calling external webhook for job_id {job_id}: {e}")
        final_result = {'error': str(e), 'details': 'Failed to get response from external service.'}
        status = 'failed'

    # Save the final result
    save_and_cleanup_db(job_id, {'status': status, 'result': final_result})
    print(f"Worker finished job_id: {job_id} with status: {status}")

    if respond_back_url:
        print(f"Forwarding result for job_id {job_id} to: {respond_back_url}")
        try:
            forward_payload = {'job_id': job_id, 'status': status, 'data': final_result}
            requests.post(respond_back_url, json=forward_payload, timeout=10)
        except requests.exceptions.RequestException as e:
            print(f"Webhook forwarding failed for job_id {job_id}: {e}")
            
    return final_result
