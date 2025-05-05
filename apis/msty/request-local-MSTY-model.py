"""
Script: request-local-MSTY-model.py
-----------------------------------
Automates sending a content auditing/generation prompt to the local MSTY (Gemma) LLM API.

- Reads the main copywriter prompt file
- Iterates through all Markdown files in the target directory
- For any file missing `lede` or `image_prompt`, sends the prompt + file to the LLM
- Updates the file with the generated fields

This Python version is designed to be run from anywhere in the monorepo, using absolute paths for robustness.

Usage:
    python ai-labs/apis/msty/request-local-MSTY-model.py
"""

import os
import sys
import json
from pathlib import Path
from urllib import request, error

# --- CONFIGURATION ---
MONOREPO_ROOT = Path(__file__).resolve()
while not (MONOREPO_ROOT / 'package.json').exists() or not all((MONOREPO_ROOT / d).exists() for d in ['ai-labs', 'tidyverse']):
    if MONOREPO_ROOT.parent == MONOREPO_ROOT:
        raise RuntimeError('Could not find monorepo root (no package.json with ai-labs & tidyverse sibling dirs)')
    MONOREPO_ROOT = MONOREPO_ROOT.parent

PROMPT_FILE = MONOREPO_ROOT / 'content/lost-in-public/prompts/workflow/Ask-Local-LLM-to-Be-a-Copywriter.md'
TARGET_DIR = MONOREPO_ROOT / 'content/lost-in-public/prompts/data-integrity'
LLM_API_URL = os.environ.get('LOCAL_MODEL_API_SERVICE_MSTY', 'http://localhost:10100')

# --- Helpers for YAML frontmatter ---
def extract_frontmatter(content):
    """
    Extract YAML frontmatter from Markdown content using string parsing only.
    Returns a dict or None.
    """
    if content.startswith('---'):
        end = content.find('---', 3)
        if end != -1:
            fm = content[3:end].strip()
            # Manual parse: only handles flat key: value pairs, no nesting or lists
            result = {}
            for line in fm.split('\n'):
                if ':' in line:
                    key, val = line.split(':', 1)
                    result[key.strip()] = val.strip().strip('"').strip("'")
            return result
    return None

def write_frontmatter_to_file(filepath, updated_frontmatter):
    """
    Overwrites the frontmatter in a Markdown file with the updated dict using string formatting only.
    """
    filepath = Path(filepath)
    content = filepath.read_text(encoding='utf-8')
    if content.startswith('---'):
        end = content.find('---', 3)
        if end != -1:
            body = content[end+3:].lstrip('\n')
        else:
            body = content
    else:
        body = content
    # Write keys in original order if possible
    yaml_str = '\n'.join(f'{k}: {v}' for k, v in updated_frontmatter.items())
    new_content = f"---\n{yaml_str}\n---\n\n{body}"
    filepath.write_text(new_content, encoding='utf-8')

# --- Robustly extract JSON object from LLM response (handles code blocks, extra text, etc.) ---
def extract_json_from_response(response_text):
    """
    Extracts the first JSON object from the response text, even if wrapped in code block markers or extra text.
    Returns a dict with 'lede' and 'image_prompt' as atomic string values.
    """
    import re
    import json
    # Remove markdown code block markers if present
    cleaned = re.sub(r'```[a-zA-Z]*', '', response_text)
    cleaned = cleaned.replace('```', '')
    # Find the first JSON object in the text
    json_match = re.search(r'{[\s\S]*?}', cleaned)
    if not json_match:
        # Fallback: treat entire cleaned text as JSON
        try:
            obj = json.loads(cleaned)
        except Exception:
            return {'lede': '', 'image_prompt': ''}
        return {
            'lede': str(obj.get('lede', '')).strip(),
            'image_prompt': str(obj.get('image_prompt', '')).strip()
        }
    try:
        obj = json.loads(json_match.group(0))
        return {
            'lede': str(obj.get('lede', '')).strip(),
            'image_prompt': str(obj.get('image_prompt', '')).strip()
        }
    except Exception:
        return {'lede': '', 'image_prompt': ''}

# --- Recursively find all Markdown files in a directory ---
def find_markdown_files(directory):
    files = []
    for root, _, filenames in os.walk(directory):
        for fn in filenames:
            if fn.endswith('.md'):
                files.append(os.path.join(root, fn))
    return files

# --- Send prompt + file to Ollama LLM API (gemma3:1b) ---
def get_llm_completion(prompt, file_content, file_path):
    # Use the correct Ollama API endpoint and payload
    payload = {
        'model': 'gemma3:1b',
        'prompt': prompt,
        # Optionally, you can include file_content or file_path in the prompt if needed
        # Ollama expects just 'prompt' and 'model' (see https://github.com/jmorganca/ollama/blob/main/docs/api.md)
    }
    data = json.dumps(payload).encode('utf-8')
    api_url = os.environ.get('LOCAL_MODEL_API_SERVICE_MSTY', 'http://localhost:10100')
    endpoint = f"{api_url.rstrip('/')}/api/generate"
    headers = {'Content-Type': 'application/json'}

    try:
        req = request.Request(endpoint, data=data, headers=headers, method='POST')
        with request.urlopen(req, timeout=10) as resp:
            # Ollama streams responses as JSON lines; collect all and concatenate
            output = ""
            for line in resp:
                try:
                    chunk = json.loads(line.decode('utf-8'))
                    output += chunk.get('response', '')
                    if chunk.get('done', False):
                        break
                except Exception:
                    continue
            # Extract atomic fields from the LLM output
            return extract_json_from_response(output)
    except error.HTTPError as e:
        raise RuntimeError(f'LLM API error: {e.code} {e.reason}')
    except error.URLError as e:
        raise RuntimeError(f'LLM API connection error: {e.reason}')

# --- Main logic ---
def main():
    main_prompt = PROMPT_FILE.read_text(encoding='utf-8')
    md_files = find_markdown_files(TARGET_DIR)
    # Set a conservative max prompt size for Gemma context window (e.g. 16000 chars)
    MAX_PROMPT_CHARS = 16000
    for file_path in md_files:
        content = Path(file_path).read_text(encoding='utf-8')
        frontmatter = extract_frontmatter(content)
        if not frontmatter:
            continue
        # Identify missing or empty fields
        missing = []
        if not frontmatter.get('lede') or not frontmatter['lede'].strip():
            missing.append('lede')
        if not frontmatter.get('image_prompt') or not frontmatter['image_prompt'].strip():
            missing.append('image_prompt')
        if not missing:
            continue
        print(f"[AUDIT] {file_path} is missing: {', '.join(missing)}")
        try:
            # Construct a focused prompt for only the missing fields
            missing_fields_str = ', '.join(missing)
            return_fields = ', '.join([f'\"{field}\"' for field in missing])
            prompt_instructions = (
                f"{main_prompt}\n\n***\nIMPORTANT: Do NOT use generic or placeholder text like 'Example citation', 'Example image', or any form of 'placeholder' or 'example'. Be creative, specific, and original. If you return generic or placeholder text, your output will be rejected and you will be asked again until you provide something vivid and creative.\n***\nBelow is the content of the file for which you must generate the following field(s): {missing_fields_str}.\n***\n"
            )
            prompt_suffix = (
                f"\n***\nReturn a JSON object with only the following fields: {return_fields}. Do not include markdown, explanations, or extra text. Only output the JSON object.\n"
            )

            # --- POST-PROCESSING CHECK FOR GENERIC OUTPUTS ---
            def is_generic_output(val):
                if not isinstance(val, str):
                    return False
                val_lower = val.lower().strip()
                generic_patterns = [
                    'placeholder',
                    'example',
                    'this is a placeholder',
                    'example citation',
                    'example image',
                    'sample',
                    'to be added',
                    'tbd',
                    'n/a',
                ]
                for pattern in generic_patterns:
                    if pattern in val_lower:
                        return True
                return False

            # Wrap LLM completion with retry logic if output is generic
            max_attempts = 3
            attempt = 0
            while attempt < max_attempts:
                combined_prompt = f"{prompt_instructions}{content}{prompt_suffix}"
                llm_result = get_llm_completion(combined_prompt, content, file_path)
                lede_val = llm_result.get('lede', '')
                image_prompt_val = llm_result.get('image_prompt', '')
                if (is_generic_output(lede_val) or is_generic_output(image_prompt_val)):
                    attempt += 1
                    print(f"[WARNING] LLM returned generic output for lede or image_prompt (attempt {attempt}). Retrying with sterner warning.")
                    # Strengthen the warning for subsequent attempts
                    prompt_instructions = (
                        f"{main_prompt}\n\n***\nCRITICAL: You MUST NOT use generic or placeholder text. Your previous output was rejected for being generic. Provide only vivid, creative, and original language.\n***\nBelow is the content of the file for which you must generate the following field(s): {missing_fields_str}.\n***\n"
                    )
                    continue
                break
            else:
                print("[ERROR] LLM failed to provide creative output after multiple attempts. Using last output.")
            llm_response = llm_result
        except Exception as e:
            print(f"[ERROR] LLM API failed for {file_path}: {e}")
            continue
        updated = False
        for key in missing:
            if llm_response.get(key):
                frontmatter[key] = llm_response[key]
                updated = True
                print(f"[UPDATE] {file_path}: set {key}")
        if updated:
            write_frontmatter_to_file(file_path, frontmatter)
            print(f"[WRITE] Updated frontmatter in {file_path}")
    print('[DONE] Audit and fill for lede/image_prompt complete.')

if __name__ == '__main__':
    main()
