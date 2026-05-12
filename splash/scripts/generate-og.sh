#!/usr/bin/env bash
#
# generate-og.sh — ai-labs/splash Ideogram v3 wrapper.
#
# Reads the locked recipe from DESIGN.md's `imagery:` block (style_type,
# magic_prompt, rendering_speed, seed, negative_prompt, color_palette,
# style_reference). Varies `prompt` and `aspect_ratio` per call. Saves
# candidates to .ideogram-candidates/ (dot-prefixed, outside public/).
#
# Usage:
#   ./scripts/generate-og.sh "<prompt>" <aspect_ratio> <subject_slug> [--no-ref]
#
# Example:
#   # First (seed) call — no style reference exists yet.
#   ./scripts/generate-og.sh \
#     "Top 1/3 of frame is empty negative space, dark gradient sky. \
#      Bottom 2/3 contains an isometric instrument panel with three \
#      labelled module faces aligned in a row on a bench surface." \
#     16x9 instrument-panel-three --no-ref
#
#   # Variant call — style reference is now committed.
#   ./scripts/generate-og.sh "<same prompt>" 3x4 instrument-panel-three
#
# Requires: $IDEOGRAM_API_KEY (sourced from ~/.secrets), curl, jq, python3+yaml.
# Run from splash/ root.

set -euo pipefail

if [[ $# -lt 3 ]]; then
  echo "Usage: $0 \"<prompt>\" <aspect_ratio> <subject_slug> [--no-ref]" >&2
  exit 2
fi

PROMPT="$1"
ASPECT_RATIO="$2"
SUBJECT_SLUG="$3"
USE_REF=1
USE_PALETTE=1
shift 3
while [[ $# -gt 0 ]]; do
  case "$1" in
    --no-ref)     USE_REF=0 ;;
    --no-palette) USE_PALETTE=0 ;;
    *) echo "Unknown flag: $1" >&2; exit 2 ;;
  esac
  shift
done

: "${IDEOGRAM_API_KEY:?IDEOGRAM_API_KEY not set. Source ~/.secrets first.}"

command -v curl >/dev/null || { echo "curl not found" >&2; exit 1; }
command -v jq   >/dev/null || { echo "jq not found"   >&2; exit 1; }

[[ -f DESIGN.md ]] || { echo "DESIGN.md not found in cwd. Run from splash/ root." >&2; exit 1; }

# Read the imagery: block.
read_imagery() {
  python3 - <<'PY'
import re, sys, yaml, json
text = open('DESIGN.md').read()
m = re.match(r'^---\n(.*?)\n---', text, re.DOTALL)
if not m: sys.exit(1)
d = yaml.safe_load(m.group(1))
imagery = d.get('imagery', {})

# YAML 1.1 treats ON/OFF/YES/NO as booleans. Ideogram expects the literal
# strings 'AUTO' / 'ON' / 'OFF'. Map booleans back to the API's enum.
def norm_flag(v, default):
    if v is True:  return 'ON'
    if v is False: return 'OFF'
    if v is None:  return default
    return str(v)

out = {
  'style_type':       norm_flag(imagery.get('defaults', {}).get('style_type'),       'AUTO'),
  'magic_prompt':     norm_flag(imagery.get('defaults', {}).get('magic_prompt'),     'OFF'),
  'rendering_speed':  norm_flag(imagery.get('defaults', {}).get('rendering_speed'),  'QUALITY'),
  'seed':             str(imagery.get('defaults', {}).get('seed', 4096)),
  'negative_prompt':  imagery.get('negative_prompt', '').strip(),
  'style_ref_path':   imagery.get('style_reference', {}).get('path', ''),
  'color_palette':    json.dumps(imagery.get('color_palette', {})),
}
print(json.dumps(out))
PY
}

CONFIG="$(read_imagery)"
STYLE_TYPE="$(echo "$CONFIG"      | jq -r .style_type)"
MAGIC_PROMPT="$(echo "$CONFIG"    | jq -r .magic_prompt)"
RENDERING_SPEED="$(echo "$CONFIG" | jq -r .rendering_speed)"
SEED="$(echo "$CONFIG"            | jq -r .seed)"
NEGATIVE_PROMPT="$(echo "$CONFIG" | jq -r .negative_prompt)"
STYLE_REF_PATH="$(echo "$CONFIG"  | jq -r .style_ref_path)"
COLOR_PALETTE_JSON="$(echo "$CONFIG" | jq -c .color_palette | jq -r .)"

# Compose style-ref flags if available + requested.
STYLE_REF_FLAG=()
if [[ "$USE_REF" == "1" && -n "$STYLE_REF_PATH" && -f "$STYLE_REF_PATH" ]]; then
  STYLE_REF_FLAG=( -F "style_reference_images=@${STYLE_REF_PATH}" )
  REF_LINE="$STYLE_REF_PATH"
else
  REF_LINE="<none — seeding pass>"
fi

TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
CAND_DIR=".ideogram-candidates/${SUBJECT_SLUG}-${ASPECT_RATIO//x/by}-${TIMESTAMP}"
mkdir -p "$CAND_DIR"

cat <<HEAD
→ POST https://api.ideogram.ai/v1/ideogram-v3/generate
    prompt:          $PROMPT
    aspect_ratio:    $ASPECT_RATIO
    style_type:      $STYLE_TYPE
    magic_prompt:    $MAGIC_PROMPT
    rendering_speed: $RENDERING_SPEED
    seed:            $SEED
    style_ref:       $REF_LINE
    candidates →     $CAND_DIR/
HEAD

PALETTE_FLAG=()
if [[ "$USE_PALETTE" == "1" ]]; then
  PALETTE_FLAG=( -F "color_palette=$COLOR_PALETTE_JSON" )
fi

RESPONSE="$(curl -sS \
  -H "Api-Key: $IDEOGRAM_API_KEY" \
  -F "prompt=$PROMPT" \
  -F "aspect_ratio=$ASPECT_RATIO" \
  -F "style_type=$STYLE_TYPE" \
  -F "magic_prompt=$MAGIC_PROMPT" \
  -F "rendering_speed=$RENDERING_SPEED" \
  -F "seed=$SEED" \
  -F "num_images=4" \
  -F "negative_prompt=$NEGATIVE_PROMPT" \
  "${PALETTE_FLAG[@]}" \
  "${STYLE_REF_FLAG[@]}" \
  https://api.ideogram.ai/v1/ideogram-v3/generate)"

# Surface API errors clearly.
if ! echo "$RESPONSE" | jq -e '.data' >/dev/null 2>&1; then
  echo "Ideogram API returned an error or unexpected response:" >&2
  echo "$RESPONSE" | jq . >&2 2>/dev/null || echo "$RESPONSE" >&2
  exit 1
fi

NUM_IMAGES="$(echo "$RESPONSE" | jq '.data | length')"
echo "→ received $NUM_IMAGES candidate(s)"

for i in $(seq 0 $((NUM_IMAGES - 1))); do
  URL="$(echo "$RESPONSE" | jq -r ".data[$i].url")"
  OUT="${CAND_DIR}/candidate-${i}.png"
  curl -sS -L "$URL" -o "$OUT"
  echo "→ saved $OUT"
done

echo "$RESPONSE" | jq . > "${CAND_DIR}/response.json"
echo "→ metadata saved to ${CAND_DIR}/response.json"
echo "→ done."

# Also emit the candidate dir on stdout for caller convenience.
echo "$CAND_DIR" > "${CAND_DIR}/.path"
