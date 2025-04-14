// generate-banner-images.ts
// Step 2 of the workflow: For each markdown file in /content/lost-in-public/prompts/code-style,
// read the image_prompt from frontmatter, call OpenAI DALL·E 3 API, and insert/update banner_image URL.
// This script is non-destructive, logs all changes, and preserves all other metadata.
// It does NOT use gray-matter or any YAML parser that could alter formatting.

import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import OpenAI from "openai";

// Load environment variables from .env
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const PROMPT_DIR = path.resolve(__dirname, "../../content/lost-in-public/prompts/code-style");
const IMAGE_SIZE = "1024x1792";
const MODEL = "dall-e-3";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Extracts frontmatter block and its indices from markdown content
 * Returns { frontmatterLines, start, end, restLines }
 */
function extractFrontmatterLines(content: string) {
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
 */
function parseFrontmatterMap(frontmatterLines: string[]): Record<string, string> {
  const map: Record<string, string> = {};
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
 */
function updateFrontmatterLines(frontmatterLines: string[], key: string, value: string): string[] {
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

async function generateBannerImage(prompt: string): Promise<string> {
  // Calls OpenAI DALL·E 3 API and returns image URL
  const response = await openai.images.generate({
    model: MODEL,
    prompt,
    n: 1,
    size: IMAGE_SIZE,
  });
  // TYPE GUARD: Ensure the response contains a valid URL string.
  // This prevents the TypeScript error: 'Type string | undefined is not assignable to type string.'
  const url = response.data[0]?.url;
  if (typeof url !== 'string' || !url) {
    // Defensive: If no URL is returned, throw an explicit error to prevent downstream failures.
    throw new Error('OpenAI API did not return a valid image URL for the prompt: ' + prompt);
  }
  return url;
}

function getMarkdownFiles(dir: string): string[] {
  return fs.readdirSync(dir)
    .filter(file => file.endsWith(".md"))
    .map(file => path.join(dir, file));
}

async function processFile(filePath: string) {
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

  if (!map.image_prompt || !map.image_prompt.trim()) {
    console.log(`[SKIP] No image_prompt in ${path.basename(filePath)}`);
    return;
  }
  if (map.banner_image && map.banner_image.trim()) {
    console.log(`[SKIP] banner_image already exists in ${path.basename(filePath)}`);
    return;
  }

  console.log(`[PROCESS] ${path.basename(filePath)} | prompt: ${map.image_prompt}`);
  try {
    const url = await generateBannerImage(map.image_prompt.replace(/^"|"$/g, ""));
    const updatedFrontmatterLines = updateFrontmatterLines(frontmatterLines, "banner_image", url);
    // Reconstruct file
    const newLines = [
      ...raw.split("\n").slice(0, start + 1),
      ...updatedFrontmatterLines,
      ...raw.split("\n").slice(end)
    ];
    fs.writeFileSync(filePath, newLines.join("\n"), "utf-8");
    console.log(`[SUCCESS] banner_image added for ${path.basename(filePath)}: ${url}`);
  } catch (err) {
    console.error(`[ERROR] Failed for ${filePath}:`, err);
  }
}

async function main() {
  const files = getMarkdownFiles(PROMPT_DIR);
  for (const file of files) {
    await processFile(file);
  }
  console.log("\n[COMPLETE] All files processed.");
}

main();
