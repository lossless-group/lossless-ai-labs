# test_msty_api.py
# This script probes the Ollama LLM API at http://localhost:10000/api/generate to test text generation.
# It uses only built-in Python libraries, per project rules.

import os
import json
from urllib import request, error

api_url = os.environ.get('LOCAL_MODEL_API_SERVICE_MSTY', 'http://localhost:10100')
generate_url = api_url.rstrip('/') + '/api/generate'

# Minimal valid payload for Ollama (update 'model' as needed)
payload = {
    "model": "gemma3:1b",  # Change to the model you have pulled (e.g., "msty", "gemma", etc.)
    "prompt": "Say hello from MSTY Gemma!"
}
data = json.dumps(payload).encode('utf-8')
headers = {'Content-Type': 'application/json'}

try:
    req = request.Request(generate_url, data=data, headers=headers, method='POST')
    with request.urlopen(req, timeout=10) as resp:
        print(f"[SUCCESS] Status: {resp.status}")
        print(resp.read().decode('utf-8'))
except error.HTTPError as e:
    print(f"[HTTP ERROR] Status: {e.code} - {e.reason}")
    print(e.read().decode('utf-8'))
except error.URLError as e:
    print(f"[URL ERROR] {e.reason}")
except Exception as e:
    print(f"[ERROR] {e}")
