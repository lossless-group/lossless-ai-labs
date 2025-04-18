"""
Script: generate-style-recraft.py
Purpose: Generate a custom style for image requests using the Recraft API, following the canonical structure in ai-labs/recraft/generate-image-style-recraft.md.

This script logs all requests, responses, and file outputs, and validates response structure against the sample in the input file. It does NOT hardcode field names or structure, but reads and parses the canonical sample from the markdown file.

Author: Michael Staton
"""

import os
import sys
import json
import requests
import re
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv

# --- ENV VARS ---
# Load environment variables from .env if present (for local/dev parity)
load_dotenv()
RECRAFT_API_TOKEN = os.environ.get("RECRAFT_API_TOKEN")
if not RECRAFT_API_TOKEN:
    print("[ERROR] RECRAFT_API_TOKEN not set in environment!")
    sys.exit(1)

# --- CONFIGURATION ---
INPUT_SPEC_PATH = Path(__file__).parent / "generate-image-style-recraft.md"
OUTPUT_PATH = Path(__file__).parent / "styles-recraft.json"
RECRAFT_API_URL = "https://external.api.recraft.ai/v1/styles"

# --- LOGGING HELPERS ---
def log_request_out(url, headers, files, data):
    print(f"[REQUEST OUT] URL: {url}\nHeaders: {headers}\nFiles: {list(files.keys())}\nData: {data}\n{'-'*40}")

def log_response_in(resp):
    print(f"[RESPONSE IN] Status: {resp.status_code}\nResponse: {resp.text}\n{'-'*40}")

def log_file_output(filepath, content):
    print(f"[FILE OUTPUT] {filepath}\nContent:\n{content}\n{'-'*40}")

# --- UTILITY: Parse canonical structure from markdown spec ---
def extract_sample_json_from_md(md_path):
    """
    Extract the first JSON block from the markdown spec file.
    Returns a dict representing the required structure, or None.
    """
    text = md_path.read_text(encoding="utf-8")
    match = re.search(r'```json\s*(\{[\s\S]+?\})\s*```', text)
    if match:
        try:
            return json.loads(match.group(1))
        except Exception as e:
            print(f"[ERROR] Failed to parse JSON example from spec: {e}")
            return None
    print("[ERROR] No JSON example found in spec.")
    return None

# --- MAIN LOGIC ---
def main():
    # 1. Extract canonical structure from spec
    canonical = extract_sample_json_from_md(INPUT_SPEC_PATH)
    if not canonical:
        print("[ERROR] Could not determine canonical output structure. Aborting.")
        sys.exit(1)

    # 2. Prepare request (see sample in spec)
    # For demonstration, use the sample images and style from the markdown spec
    files = {}
    images = [
        "/Users/mpstaton/code/lossless-monorepo/content/visuals/Illustration__Creative-Assembly-Line.png",
        "/Users/mpstaton/code/lossless-monorepo/content/visuals/pictographOf_AI-Consumer.png",
        "/Users/mpstaton/code/lossless-monorepo/content/visuals/pictographOf_Assembly-Line.png",
        "/Users/mpstaton/code/lossless-monorepo/content/visuals/pictographOf_BusinessStrategy.png",
    ]
    for idx, img_path in enumerate(images):
        files[f"file{idx+1}"] = open(img_path, "rb")
    data = {"style": "digital_illustration"}
    headers = {"Authorization": f"Bearer {RECRAFT_API_TOKEN}"}

    # 3. Log outgoing request
    log_request_out(RECRAFT_API_URL, headers, files, data)
    try:
        resp = requests.post(RECRAFT_API_URL, headers=headers, files=files, data=data)
    finally:
        for f in files.values():
            f.close()

    # 4. Log incoming response
    log_response_in(resp)
    if resp.status_code != 200:
        print(f"[ERROR] API returned error: {resp.status_code} {resp.text}")
        sys.exit(1)
    try:
        response_json = resp.json()
    except Exception as e:
        print(f"[ERROR] Failed to parse JSON from response: {e}")
        sys.exit(1)

    # 5. Validate response structure
    # Only check that all canonical keys exist at top-level
    missing = [k for k in canonical if k not in response_json]
    if missing:
        print(f"[ERROR] Missing required fields in response: {missing}")
        sys.exit(1)

    # 6. Write output file (with timestamp if needed)
    out_path = OUTPUT_PATH
    if out_path.exists():
        ts = datetime.now().strftime("%Y-%m-%dT%H-%M-%S")
        out_path = out_path.with_name(f"styles-recraft-{ts}.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(response_json, f, indent=2)
    log_file_output(out_path, json.dumps(response_json, indent=2))

if __name__ == "__main__":
    main()