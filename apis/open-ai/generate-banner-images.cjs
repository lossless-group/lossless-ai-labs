/*
 * generate-banner-images.js
 * CommonJS (CJS) rewrite of the original TypeScript/ESM script
 * Conversion date: 2025-04-14
 * This script processes all markdown files in /content/lost-in-public/prompts/code-style,
 * reads the image_prompt from frontmatter, calls OpenAI DALL·E 3 API, and inserts/updates banner_image URL.
 * All logic, comments, and structure preserved. No TypeScript, no ESM imports/exports.
 * Aggressive, comprehensive commenting style maintained.
 */

// --- BEGIN: Required dependencies and environment setup ---
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');
const OpenAI = require('openai');

// __dirname is available natively in CJS
// Load .env file from parent directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });
// --- END: Required dependencies and environment setup ---

// --- BEGIN: Constants and OpenAI Client ---
const PROMPT_DIR = path.resolve(__dirname, '../../content/lost-in-public/prompts/code-style');
const IMAGE_SIZE = "1024x1792"; // Only valid DALL·E 3 sizes: "1024x1792", "256x256", "512x512", "1024x1024", "1792x1024"
const MODEL = "dall-e-3";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
// --- END: Constants and OpenAI Client ---

/**
 * Extracts frontmatter block and its indices from markdown content
 * Returns { frontmatterLines, start, end, restLines }
 * @param {string} content - The full markdown file content
 * @returns {{ frontmatterLines: string[], start: number, end: number, restLines: string[] }}
 */
function extractFrontmatterLines(content) {
  const lines = content.split("\n");
  let start = -1, end = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === "---") {
      if (start === -1) start = i;
      else { end = i; break; }
    }
  }
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Frontmatter block not found or malformed");
  }
  return {
    frontmatterLines: lines.slice(start + 1, end),
    start,
    end,
    restLines: lines.slice(end + 1)
  };
}

/**
 * Parses frontmatter lines into a key-value map (only top-level keys, no nested objects)
 * @param {string[]} frontmatterLines
 * @returns {Object}
 */
function parseFrontmatterMap(frontmatterLines) {
  const map = {};
  for (const line of frontmatterLines) {
    // Only parse simple key: value pairs (skip lists, etc.)
    const match = line.match(/^([a-zA-Z0-9_\-]+):\s*(.*)$/);
    if (match && !line.startsWith("  - ")) {
      map[match[1]] = match[2];
    }
  }
  return map;
}

/**
 * Updates or inserts a key-value in the frontmatter lines (preserving formatting)
 * @param {string[]} frontmatterLines
 * @param {string} key
 * @param {string} value
 * @returns {string[]}
 */
function updateFrontmatterLines(frontmatterLines, key, value) {
  let found = false;
  const updated = frontmatterLines.map(line => {
    if (line.startsWith(`${key}:`)) {
      found = true;
      return `${key}: "${value}"`;
    }
    return line;
  });
  if (!found) {
    // Insert before the closing delimiter (end of frontmatter)
    updated.push(`${key}: "${value}"`);
  }
  return updated;
}

// --- BEGIN: Defensive Prompt Validation and Logging Patch ---
// This block aggressively validates and logs the prompt sent to OpenAI to prevent 400 errors.
/**
 * Cleans and normalizes the prompt string for OpenAI
 * @param {string} rawPrompt
 * @returns {string}
 */
function cleanPrompt(rawPrompt) {
  return rawPrompt
    .replace(/^['"`]+|['"`]+$/g, "") // Remove all leading/trailing quotes
    .replace(/^\|\s*|^>\s*/gm, "")    // Remove YAML block indicators
    .replace(/\s+/g, " ")               // Collapse whitespace
    .trim();
}
// --- END: Defensive Prompt Validation and Logging Patch ---

/**
 * Calls OpenAI DALL·E 3 API and returns image URL
 * @param {string} prompt
 * @returns {Promise<string>}
 */
async function generateBannerImage(prompt) {
  // Construct the request payload
  const requestPayload = {
    model: MODEL,
    prompt,
    n: 1,
    size: IMAGE_SIZE,
    response_format: "url", // REQUIRED for DALL·E 3 API
    // quality: "standard", // Optional: uncomment if you want to specify
    // style: "vivid",      // Optional: uncomment if you want to specify
  };
  // LOG: Show the exact request payload sent to OpenAI
  console.log('[OPENAI REQUEST PAYLOAD]', JSON.stringify(requestPayload, null, 2));

  // Calls OpenAI DALL·E 3 API and returns image URL
  const response = await openai.images.generate(requestPayload);
  // TYPE GUARD: Ensure the response contains a valid URL string.
  const url = response.data[0] && response.data[0].url;
  if (typeof url !== 'string' || !url) {
    // Defensive: If no URL is returned, throw an explicit error to prevent downstream failures.
    throw new Error('OpenAI API did not return a valid image URL for the prompt: ' + prompt);
  }
  return url;
}

/**
 * Returns an array of absolute paths to markdown files in the given directory
 * @param {string} dir
 * @returns {string[]}
 */
function getMarkdownFiles(dir) {
  return fs.readdirSync(dir)
    .filter(file => file.endsWith(".md"))
    .map(file => path.join(dir, file));
}

/**
 * Processes a single markdown file: reads, updates frontmatter, writes back
 * @param {string} filePath
 */
async function processFile(filePath) {
  // LOG: Start processing this file
  console.log(`[START] Processing file: ${path.basename(filePath)}`);
  const raw = fs.readFileSync(filePath, "utf-8");
  let extracted;
  try {
    extracted = extractFrontmatterLines(raw);
  } catch (err) {
    console.error(`[ERROR] Could not extract frontmatter from ${filePath}:`, err);
    return;
  }
  const { frontmatterLines, start, end, restLines } = extracted;
  const map = parseFrontmatterMap(frontmatterLines);

  // Defensive: ensure prompt is valid
  let prompt = map.image_prompt || "";
  prompt = cleanPrompt(prompt);
  if (!prompt || typeof prompt !== "string" || prompt.length < 5) {
    console.error(`[SKIP] No valid image_prompt for ${filePath} (got: '${prompt}')`);
    return;
  }
  // LOG: Outgoing prompt
  console.log(`[API REQUEST] Sending image_prompt to OpenAI for ${path.basename(filePath)}: "${prompt}"`);

  try {
    const url = await generateBannerImage(prompt);
    const updatedFrontmatterLines = updateFrontmatterLines(frontmatterLines, "banner_image", url);
    // Reconstruct file
    const newLines = [
      ...raw.split("\n").slice(0, start + 1),
      ...updatedFrontmatterLines,
      ...raw.split("\n").slice(end)
    ];
    fs.writeFileSync(filePath, newLines.join("\n"), "utf-8");
    // LOG: File write complete
    console.log(`[WRITE] banner_image written to ${path.basename(filePath)}`);
    console.log(`[SUCCESS] banner_image added for ${path.basename(filePath)}: ${url}`);
  } catch (err) {
    // LOG: Full error and prompt
    console.error(`[ERROR] Failed for ${filePath}:`, err);
    console.error(`[ERROR CONTEXT] image_prompt sent: '${prompt}'`);
  }
}

/**
 * Main entry point: scans directory, processes all markdown files concurrently
 */
async function main() {
  // LOG: Start of main execution
  console.log(`[MAIN] Scanning directory for markdown files: ${PROMPT_DIR}`);
  const files = getMarkdownFiles(PROMPT_DIR);
  // LOG: Number of files found
  console.log(`[MAIN] Found ${files.length} markdown files. Starting async processing...`);
  // Process all files concurrently for maximum throughput
  await Promise.all(files.map(file => processFile(file)));
  // LOG: All files processed
  console.log("\n[COMPLETE] All files processed.");
}

main();
