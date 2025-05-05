/**
 * Script: request-local-MSTY-model.ts
 * -----------------------------------
 * Automates sending a content auditing/generation prompt to the local MSTY (Gemma) LLM API.
 *
 * - Reads the main copywriter prompt file
 * - Iterates through all Markdown files in the target directory
 * - For any file missing `lede` or `image_prompt`, sends the prompt + file to the LLM
 * - Updates the file with the generated fields
 *
 * Uses shared YAML frontmatter utilities for robust parsing/writing.
 *
 * Usage: pnpm tsx ai-labs/apis/msty/request-local-MSTY-model.ts
 *
 * NOTE: All paths are now absolute, resolved from the monorepo root for robust execution from any working directory.
 *
 * Monorepo root is the package.json containing both 'ai-labs' and 'tidyverse' directories, NOT ai-labs/package.json
 */

import path from 'path';
import fs from 'fs/promises';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// --- Resolve monorepo root dynamically (skip ai-labs/package.json, require both ai-labs & tidyverse as siblings) ---
function findMonorepoRoot(): string {
  let dir = __dirname;
  const fsSync = require('fs');
  const isMonorepoRoot = (d: string) => {
    if (!fsSync.existsSync(path.join(d, 'package.json'))) return false;
    const children = fsSync.readdirSync(d);
    return children.includes('ai-labs') && children.includes('tidyverse');
  };
  while (!isMonorepoRoot(dir)) {
    const parent = path.dirname(dir);
    if (parent === dir) throw new Error('Could not find monorepo root (no package.json with ai-labs & tidyverse sibling dirs)');
    dir = parent;
  }
  return dir;
}
const MONOREPO_ROOT = findMonorepoRoot();

// --- Import YAML utilities from monorepo root ---
// Use new path alias for observer utilities
import { extractFrontmatter, writeFrontmatterToFile } from '@utils/yamlFrontmatter';

// --- CONFIGURATION ---
const PROMPT_FILE = path.join(MONOREPO_ROOT, 'content/lost-in-public/prompts/workflow/Ask-Local-LLM-to-Be-a-Copywriter.md');
const TARGET_DIR = path.join(MONOREPO_ROOT, 'content/lost-in-public/prompts/data-integrity');
const LLM_API_URL = process.env.LOCAL_MODEL_API_SERVICE_MSTY || 'http://localhost:10000';

// --- Recursively find all Markdown files in a directory ---
async function findMarkdownFiles(dir: string): Promise<string[]> {
  let results: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(await findMarkdownFiles(fullPath));
    } else if (entry.isFile() && fullPath.endsWith('.md')) {
      results.push(fullPath);
    }
  }
  return results;
}

// --- Send prompt + file to local LLM API ---
async function getLLMCompletion(prompt: string, fileContent: string, filePath: string): Promise<any> {
  const payload = {
    prompt,
    file_content: fileContent,
    file_path: filePath,
    task: 'audit-and-generate-lede-image_prompt'
  };
  const resp = await fetch(`${LLM_API_URL}/v1/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!resp.ok) {
    throw new Error(`LLM API error: ${resp.status} ${resp.statusText}`);
  }
  return await resp.json();
}

// --- Main logic ---
(async function main() {
  // Load the main copywriter prompt
  const mainPrompt = await fs.readFile(PROMPT_FILE, 'utf8');
  const mdFiles = await findMarkdownFiles(TARGET_DIR);

  for (const filePath of mdFiles) {
    const fileContent = await fs.readFile(filePath, 'utf8');
    const frontmatter = extractFrontmatter(fileContent);
    if (!frontmatter) continue;
    const missing: string[] = [];
    if (!frontmatter.lede) missing.push('lede');
    if (!frontmatter.image_prompt) missing.push('image_prompt');
    if (missing.length === 0) continue;

    console.log(`[AUDIT] ${filePath} is missing: ${missing.join(', ')}`);

    // Send to LLM for completion
    let llmResponse;
    try {
      llmResponse = await getLLMCompletion(mainPrompt, fileContent, filePath);
    } catch (err) {
      console.error(`[ERROR] LLM API failed for ${filePath}:`, err);
      continue;
    }

    // Expecting: { lede: ..., image_prompt: ... }
    let updated = false;
    for (const key of ['lede', 'image_prompt']) {
      if (missing.includes(key) && llmResponse[key]) {
        frontmatter[key] = llmResponse[key];
        updated = true;
        console.log(`[UPDATE] ${filePath}: set ${key}`);
      }
    }
    if (updated) {
      await writeFrontmatterToFile(filePath, frontmatter);
      console.log(`[WRITE] Updated frontmatter in ${filePath}`);
    }
  }

  console.log('[DONE] Audit and fill for lede/image_prompt complete.');
})();
