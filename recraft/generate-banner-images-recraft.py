#!/usr/bin/env python3
from dotenv import load_dotenv
load_dotenv()

"""
Script: generate-banner-images-recraft.py
Purpose: Generate vector banner images for markdown prompt files using the Recraft API, updating YAML frontmatter using ONLY string manipulation.

- Scans all markdown files in the target directory (recursively)
- Extracts YAML frontmatter and prompt
- Sends prompt to Recraft API for SVG (vector) image generation (16:9)
- Inserts/updates 'banner_image: <URL>' in frontmatter, preserving all other fields and formatting
- Never uses any YAML libraries
- Aggressively comments all logic and function calls

CRITICAL: Never destructively edit or lose any existing frontmatter or markdown content.
"""

import os
import re
import requests
from pathlib import Path

# --- ENV VARS ---
# Loads the RECRAFT_API_TOKEN from environment (assumes .env loaded by shell or system)
RECRAFT_API_TOKEN = os.environ.get('RECRAFT_API_TOKEN')
if not RECRAFT_API_TOKEN:
    raise RuntimeError("RECRAFT_API_TOKEN not set in environment!")

# --- CONSTANTS ---
# Directory containing markdown prompt files (recursive search)
PROMPT_DIR = Path('/Users/mpstaton/code/lossless-monorepo/content/lost-in-public/prompts/code-style')
# Regex for YAML frontmatter (--- ... ---)
FRONTMATTER_REGEX = re.compile(r'^(---\s*\n.*?\n?)^(---\s*$)', re.DOTALL | re.MULTILINE)
# Banner image field name
BANNER_FIELD = 'banner_image'
# Recraft API endpoint
RECRAFT_API_URL = 'https://external.api.recraft.ai/v1/images/generations'

# --- HELPER FUNCTIONS ---
def extract_frontmatter(md_text):
    """
    Extracts the YAML frontmatter block as a string from a markdown file.
    Returns (frontmatter_string, rest_of_file_string).
    Returns (None, md_text) if no frontmatter found.
    """
    m = FRONTMATTER_REGEX.search(md_text)
    if not m:
        return None, md_text
    return m.group(0), md_text[m.end():]

def update_banner_image_in_frontmatter(frontmatter, banner_url):
    """
    Inserts or updates the 'banner_image' field in the YAML frontmatter string.
    Preserves all other fields and formatting.
    Returns the updated frontmatter string.
    """
    lines = frontmatter.split('\n')
    found = False
    new_lines = []
    for line in lines:
        if line.startswith(BANNER_FIELD + ":"):
            # Replace the existing banner_image line
            new_lines.append(f"{BANNER_FIELD}: {banner_url}")
            found = True
        else:
            new_lines.append(line)
    if not found:
        # Insert just before the closing '---' (if present), else at end
        for i in range(len(new_lines)-1, -1, -1):
            if new_lines[i].strip() == '---':
                new_lines.insert(i, f"{BANNER_FIELD}: {banner_url}")
                break
        else:
            new_lines.append(f"{BANNER_FIELD}: {banner_url}")
    return '\n'.join(new_lines)

def extract_prompt_from_markdown(md_text):
    """
    Extracts prompt from markdown file.
    Looks for a line starting with 'image_prompt:' in frontmatter, else uses first H1/H2 or first paragraph after frontmatter.
    (Modify as needed for your project conventions.)
    """
    # Try to find 'image_prompt:' in frontmatter
    m = re.search(r'^image_prompt:\s*(.*)', md_text, re.MULTILINE)
    if m:
        return m.group(1).strip()
    # Else, use first non-empty line after frontmatter
    after_fm = FRONTMATTER_REGEX.sub('', md_text, count=1)
    for line in after_fm.split('\n'):
        if line.strip():
            return line.strip()
    return None

def log_request_out(payload):
    """
    Logs the exact payload sent to the Recraft API.
    """
    print(f"[REQUEST OUT] Payload to Recraft API: {payload}")

def log_response_in(response):
    """
    Logs the response received from the Recraft API.
    """
    print(f"[RESPONSE IN] Status: {response.status_code}, Response: {response.text}")

def log_file_update(filepath, updated_frontmatter):
    """
    Logs the file update and shows exactly what was updated in the frontmatter.
    """
    print(f"[FILE UPDATED] {filepath}\n[UPDATED FRONTMATTER]\n{updated_frontmatter}\n{'-'*40}")

def generate_recraft_image(prompt):
    """
    Sends a prompt to the Recraft API to generate a vector (SVG) image.
    Returns the URL of the generated image.
    """
    payload = {
        "prompt": prompt,
        "style": "vector_illustration",
        "ratio": "9:16",
        "output_format": "svg"
    }
    log_request_out(payload)
    headers = {
        "Authorization": f"Bearer {RECRAFT_API_TOKEN}",
        "Content-Type": "application/json"
    }
    resp = requests.post(RECRAFT_API_URL, json=payload, headers=headers)
    log_response_in(resp)
    if resp.status_code != 200:
        raise RuntimeError(f"Recraft API error {resp.status_code}: {resp.text}")
    data = resp.json()
    # Defensive: check for expected structure
    url = data.get('data', [{}])[0].get('url')
    if not url:
        raise RuntimeError(f"No image URL in Recraft API response: {data}")
    return url

# --- MAIN SCRIPT ---
def main():
    # Recursively find all .md files in PROMPT_DIR
    for md_path in PROMPT_DIR.rglob('*.md'):
        print(f"[PROCESSING] {md_path}")
        with md_path.open('r', encoding='utf-8') as f:
            md_text = f.read()
        # Extract frontmatter
        frontmatter, rest = extract_frontmatter(md_text)
        if not frontmatter:
            print(f"[SKIP] No frontmatter in {md_path}")
            continue
        # Extract prompt
        prompt = extract_prompt_from_markdown(md_text)
        if not prompt:
            print(f"[SKIP] No prompt found in {md_path}")
            continue
        print(f"[PROMPT] {prompt}")
        # Generate image
        try:
            banner_url = generate_recraft_image(prompt)
            print(f"[BANNER_IMAGE] {banner_url}")
        except Exception as e:
            print(f"[ERROR] Failed to generate image for {md_path}: {e}")
            continue
        # Update frontmatter
        new_frontmatter = update_banner_image_in_frontmatter(frontmatter, banner_url)
        log_file_update(md_path, new_frontmatter)
        # Write back file (preserving original content)
        new_md_text = new_frontmatter + rest
        with md_path.open('w', encoding='utf-8') as f:
            f.write(new_md_text)

if __name__ == "__main__":
    main()
