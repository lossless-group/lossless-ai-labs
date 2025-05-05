import os
import re
import anthropic
from typing import Dict, Tuple
# ---
# Load environment variables from .env file (for local development)
from dotenv import load_dotenv
load_dotenv()
# ---

# NOTE: Always resolve PROMPT_PATH relative to the monorepo root (not CWD),
#       using the script's location (__file__) for robust path resolution.
#       This uses the script's location (__file__) to reliably find the repo root.
#       The reason we use __file__ instead of os.getcwd() is that __file__ gives
#       us the absolute path of the script file itself, whereas os.getcwd() gives
#       us the current working directory, which can be different depending on how
#       the script is run. By using __file__, we can ensure that the script works
#       correctly even if it's run from a different directory.
PROMPT_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../..", "content/lost-in-public/prompts/workflow/Ask-Local-LLM-to-Be-a-Copywriter.md"))
# ---
# USER OPTION: Set the target directory for markdown files to process
# Edit this value to change which directory will be processed by default.
# NOTE: Always resolve TARGET_DIR relative to the monorepo root (not CWD),
#       so the script works regardless of where it is run from.
#       This uses the script's location (__file__) to reliably find the repo root.
#       The reason we use __file__ instead of os.getcwd() is that __file__ gives
#       us the absolute path of the script file itself, whereas os.getcwd() gives
#       us the current working directory, which can be different depending on how
#       the script is run. By using __file__, we can ensure that the script works
#       correctly even if it's run from a different directory.
TARGET_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../..", "content/lost-in-public/prompts/data-integrity"))
# ---
REQUIRED_FIELDS = ["lede", "image_prompt"]
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
# Anthropic model string per official docs (https://docs.anthropic.com/en/docs/models-overview)
# Use full version string (e.g. 'claude-3-7-sonnet-20250219') for production stability, or '-latest' alias for latest snapshot
ANTHROPIC_MODEL = "claude-3-7-sonnet-latest"  # Supported as of May 2025; see doc chunk 45
MAX_ATTEMPTS = 3

client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

# Helper: Find all markdown files in a directory recursively
def find_markdown_files(directory):
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith('.md'):
                yield os.path.join(root, file)

# Helper: Parse YAML frontmatter and return (frontmatter_dict, body_str)
def parse_frontmatter(filepath) -> Tuple[Dict, str]:
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    if not lines or not lines[0].startswith('---'):
        return { }, ''.join(lines)
    frontmatter_lines = []
    body_start = None
    for i, line in enumerate(lines[1:], 1):
        if line.startswith('---'):
            body_start = i + 1
            break
        frontmatter_lines.append(line)
    frontmatter = yaml.safe_load(''.join(frontmatter_lines)) or {}
    body = ''.join(lines[body_start:]) if body_start else ''
    return frontmatter, body

# Helper: Write YAML frontmatter and body back to file
# This function writes all frontmatter fields as single-line, single-quoted strings with no YAML library or folding.
def write_frontmatter(filepath, frontmatter, body):
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write('---\n')
        for k, v in frontmatter.items():
            # Escape single quotes by doubling them per YAML spec
            val = str(v).replace("'", "''").replace('\n', ' ').strip()
            f.write(f"{k}: '{val}'\n")
        f.write('---\n')
        f.write(body)

# Helper: Load prompt from file for use as prompt_base
# This function reads the copywriter prompt from the canonical markdown file
# and returns it as a string for use in prompt construction elsewhere in the script.
def load_prompt_base(prompt_path: str) -> str:
    """
    Loads the prompt base from the specified markdown file.
    Args:
        prompt_path (str): Path to the prompt markdown file.
    Returns:
        str: The contents of the prompt file as a string.
    """
    with open(prompt_path, 'r', encoding='utf-8') as f:
        return f.read()

# Detect generic/meta output
def is_generic(val):
    if not isinstance(val, str):
        return True
    val_lower = val.lower().strip()
    generic_patterns = [
        r'placeholder',
        r'example',
        r'this is',
        r'a simple json',
        r'lede:',
        r'image_prompt:',
        r'to be added',
        r'tbd',
        r'n/a',
        r'json object',
        r'fill in',
        r'empty',
        r'describe',
        r'template',
        r'field',
    ]
    for pattern in generic_patterns:
        if re.search(pattern, val_lower):
            return True
    # Too short or too meta
    if len(val_lower) < 10 or val_lower.startswith('{'):
        return True
    return False

# Call Claude to fill missing fields, retrying if output is generic
# NOTE: This uses the latest anthropic SDK (>=0.50.0), which supports the messages API.
def fill_missing_fields(frontmatter, content, prompt_base):
    missing = [f for f in REQUIRED_FIELDS if not frontmatter.get(f)]
    quoted_missing = ', '.join([f'"{f}"' for f in missing])
    prompt = (
        f"""{prompt_base}\n\n***\nBAD EXAMPLES (do NOT do this):\n- 'This is a placeholder for the document's lead.'\n- 'This is a simple JSON object with only the lede and image_prompt fields.'\n- 'lede: ...'\n- 'image_prompt: ...'\n\nGOOD EXAMPLES:\n- lede: 'A sweeping overview of how citation processing can transform knowledge management, bridging the gap between scattered footnotes and a unified scholarly record.'\n- image_prompt: 'A tangled web of handwritten notes and digital citations converging into a single glowing registry, with lines connecting books, articles, and code.'\n***\nBelow is the content of the file for which you must generate the following field(s): {', '.join(missing)}.\n***\n{content}\n***\nReturn a JSON object with only these fields: {quoted_missing}. Do not include markdown, explanations, or extra text. Only output the JSON object.\n"""
    )
    for attempt in range(1, MAX_ATTEMPTS + 1):
        # anthropic >=0.50.0 uses messages.create()
        response = client.messages.create(
            model=ANTHROPIC_MODEL,
            max_tokens=512,
            temperature=0.7,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        # The response content is a list of content blocks; get the text
        text = "".join([block.text for block in response.content if hasattr(block, "text")])
        try:
            data = yaml.safe_load(text)
            # If the output is not a dict or missing fields, treat as generic
            if not isinstance(data, dict) or any(is_generic(data.get(f, '')) for f in missing):
                continue
            return data
        except Exception:
            continue
    # If all attempts fail, return empty values for missing fields
    return {f: '' for f in missing}

def main(target_dir):
    # Load the canonical prompt from the markdown file for use as prompt_base
    prompt_base = load_prompt_base(PROMPT_PATH)
    for md_file in find_markdown_files(target_dir):
        frontmatter, body = parse_frontmatter(md_file)
        missing = [f for f in REQUIRED_FIELDS if not frontmatter.get(f)]
        if not missing:
            continue
        new_vals = fill_missing_fields(frontmatter, body, prompt_base)
        updated = False
        for field in missing:
            if not is_generic(new_vals.get(field, '')):
                frontmatter[field] = new_vals[field]
                updated = True
        if updated:
            write_frontmatter(md_file, frontmatter, body)
            print(f"[UPDATE] {md_file}: set {', '.join([f for f in missing if f in new_vals and not is_generic(new_vals[f])])}")

if __name__ == "__main__":
    import sys
    # ---
    # Prefer user option at top of file; allow CLI override for advanced use
    # ---
    if len(sys.argv) == 2:
        target_dir = sys.argv[1]
        print(f"[INFO] Using target directory from command-line argument: {target_dir}")
    else:
        target_dir = TARGET_DIR
        print(f"[INFO] Using target directory from script option: {target_dir}")
    if not os.path.isdir(target_dir):
        print(f"[ERROR] The directory '{target_dir}' does not exist or is not a directory.")
        sys.exit(1)
    main(target_dir)