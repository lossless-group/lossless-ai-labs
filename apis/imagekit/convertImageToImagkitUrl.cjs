/**
 * convertImageToImagkitUrl.cjs
 *
 * A Node.js script to upload a single image or all images in a directory to ImageKit.io.
 *
 * - Loads ImageKit public/private keys and endpoints from environment variables.
 * - Accepts a file or directory path as a CLI argument or hardcoded path.
 * - Uploads to ImageKit and prints resulting URL(s) to console.
 *
 * Requires: imagekit (npm package), dotenv (optional, for .env loading)
 *
 * Usage:
 *   node convertImageToImagkitUrl.cjs <path-to-image-or-directory>
 */

// ===============================
// Imports & Environment Setup
// ===============================
const path = require('path');
const fs = require('fs');
const ImageKit = require('imagekit');
const fetch = require('node-fetch');

// Load .env if present (optional, for local dev)
try {
  require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
} catch (e) {
  // Ignore if dotenv not installed
}

// ===============================
// CONFIGURATION: Set path to file or directory here if you do NOT want to use CLI
// ===============================

OVERWRITE_IMAGEKIT_URL = false;

const PROCESS_SINGLE_IMAGE = false;
const SINGLE_IMAGE_PATH = "/Users/mpstaton/code/lossless-monorepo/content/visuals/For/repImage__Vibe-Coding-Tightrope.webp"; // <-- SET YOUR FILE OR DIRECTORY PATH HERE

const PROCESS_DIRECTORY = true;
const IMAGE_DOWNLOAD_BASE_PATH = "/Users/mpstaton/code/lossless-monorepo/content/visuals/For/Recraft-Generated/Essays";
const DIRECTORY_TO_PROCESS = "/Users/mpstaton/code/lossless-monorepo/content/essays";
const IMAGEKIT_FOLDER = "/uploads/lossless/essays";
const PROPERTIES_TO_SEND_TO_IMAGEKIT = [
  "portrait_image",
  "banner_image",
]


// ===============================
// Config: Load endpoints and keys from environment
// ===============================
const UPLOAD_ENDPOINT = process.env.IMAGEKIT_UPLOAD_ENDPOINT || 'https://upload.imagekit.io/api/v1/files/upload';
const CDN_URL_ENDPOINT = process.env.IMAGEKIT_URL_ENDPOINT || 'https://ik.imagekit.io/public/share';
const PUBLIC_KEY = process.env.IMAGEKIT_PUBLIC_KEY;
const PRIVATE_KEY = process.env.IMAGEKIT_PRIVATE_KEY;

if (!PUBLIC_KEY || !PRIVATE_KEY) {
  console.error('[ERROR] IMAGEKIT_PUBLIC_KEY or IMAGEKIT_PRIVATE_KEY not set in environment.');
  process.exit(1);
}

// ===============================
// ImageKit SDK initialization (uses CDN endpoint)
// ===============================
const imagekit = new ImageKit({
  publicKey: PUBLIC_KEY,
  privateKey: PRIVATE_KEY,
  urlEndpoint: CDN_URL_ENDPOINT,
});

// ===============================
// Helper: Recursively walk directory and return all markdown files
// ===============================
function walkDirectoryRecursive(dir, ext = '.md', fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkDirectoryRecursive(filePath, ext, fileList);
    } else if (filePath.endsWith(ext)) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

// ===============================
// Helper: Parse frontmatter from markdown file
// ===============================
function parseFrontmatter(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const match = content.match(/^---([\s\S]*?)---/);
  if (!match) return { frontmatter: {}, body: content };
  const yaml = match[1];
  const body = content.slice(match[0].length);
  const frontmatter = {};
  let currentKey = null;
  let isList = false;
  let listBuffer = [];
  yaml.split('\n').forEach(line => {
    // Detect start of block list (e.g. tags:)
    if (/^\s*([a-zA-Z0-9_\-]+):\s*$/.test(line)) {
      if (currentKey && isList) {
        frontmatter[currentKey] = listBuffer;
        listBuffer = [];
      }
      const key = line.split(':')[0].trim();
      currentKey = key;
      isList = true;
      return;
    }
    // Detect list item (e.g. - tag)
    if (isList && /^\s*-\s+/.test(line)) {
      const item = line.replace(/^\s*-\s+/, '').trim();
      if (item) listBuffer.push(item);
      return;
    }
    // Detect inline array (e.g. tags: [foo, bar])
    const idx = line.indexOf(':');
    if (idx > -1) {
      const key = line.slice(0, idx).trim();
      let value = line.slice(idx + 1).trim();
      // Inline array
      if (/^\[.*\]$/.test(value)) {
        value = value.replace(/\[|\]/g, '').split(',').map(s => s.trim()).filter(Boolean);
        frontmatter[key] = value;
        isList = false;
        currentKey = null;
        return;
      }
      // Regular key-value
      frontmatter[key] = value;
      isList = false;
      currentKey = null;
      return;
    }
    // End of list
    if (isList && line.trim() === '') {
      if (currentKey) {
        frontmatter[currentKey] = listBuffer;
        listBuffer = [];
        isList = false;
        currentKey = null;
      }
    }
  });
  // Finalize any open list at EOF
  if (currentKey && isList) {
    frontmatter[currentKey] = listBuffer;
  }
  return { frontmatter, body, yaml, full: content };
}

// ===============================
// Helper: Write updated frontmatter back to file, preserving delimiters and formatting
// ===============================
function writeFrontmatter(filePath, newFrontmatter, body, originalYaml, options = {}) {
  // ---
  // If options.omitTags is true, do NOT write tags field to frontmatter
  // ---
  if (options.omitTags && newFrontmatter.tags !== undefined) {
    delete newFrontmatter.tags;
  }

  // Normalize tags: always write as YAML array, never as both string and array
  // ---
  if (newFrontmatter.tags) {
    let tagsArr = Array.isArray(newFrontmatter.tags)
      ? newFrontmatter.tags
      : (typeof newFrontmatter.tags === 'string'
          ? newFrontmatter.tags.split(',').map(t => t.trim()).filter(Boolean)
          : []);
    // Remove duplicates
    tagsArr = [...new Set(tagsArr)];
    newFrontmatter.tags = tagsArr;
  }

  let yaml = '';
  if (originalYaml) {
    const lines = originalYaml.split('\n');
    const seen = new Set();
    for (let line of lines) {
      const idx = line.indexOf(':');
      if (idx > -1) {
        const key = line.slice(0, idx).trim();
        if (key === 'tags' && !seen.has('tags')) {
          // Only write tags if not omitted
          seen.add('tags');
          if (!options.omitTags && Array.isArray(newFrontmatter.tags) && newFrontmatter.tags.length > 0) {
            yaml += 'tags:\n';
            for (const tag of newFrontmatter.tags) {
              yaml += `  - ${tag}\n`;
            }
          }
          continue;
        }
        if (!seen.has(key) && key !== 'tags') {
          yaml += `${key}: ${newFrontmatter[key]}\n`;
          seen.add(key);
        }
      }
    }
    // Add any new keys not in the original order
    for (const k in newFrontmatter) {
      if (!seen.has(k) && k !== 'tags') {
        yaml += `${k}: ${newFrontmatter[k]}\n`;
      }
    }
    if (!options.omitTags && !seen.has('tags') && Array.isArray(newFrontmatter.tags) && newFrontmatter.tags.length > 0) {
      yaml += 'tags:\n';
      for (const tag of newFrontmatter.tags) {
        yaml += `  - ${tag}\n`;
      }
    }
  } else {
    for (const k in newFrontmatter) {
      if (k === 'tags' && Array.isArray(newFrontmatter.tags) && !options.omitTags) {
        yaml += 'tags:\n';
        for (const tag of newFrontmatter.tags) {
          yaml += `  - ${tag}\n`;
        }
      } else if (k !== 'tags') {
        yaml += `${k}: ${newFrontmatter[k]}\n`;
      }
    }
  }

  // Remove leading/trailing blank lines from yaml
  yaml = yaml.replace(/^\s+|\s+$/g, '');
  // Remove any trailing blank lines inside the yaml/frontmatter block
  yaml = yaml.replace(/\n+$/g, '');
  // Write frontmatter with NO blank line after the first delimiter and NO blank line before the closing delimiter
  const out = `---\n${yaml}\n---\n${body.replace(/^\n+/, '')}`;
  fs.writeFileSync(filePath, out, 'utf8');
}

// ===============================
// Helper: Update ONLY a single property in frontmatter, in-place, preserving all other keys, formatting, comments, and whitespace
// ===============================
function updateFrontmatterProperty(filePath, property, newValue) {
  /*
    This function updates ONLY the specified property in the YAML frontmatter of a markdown file.
    - If the property exists, only its value is replaced (indentation, comments, and whitespace are preserved).
    - If the property does not exist, it is inserted just before the closing --- delimiter.
    - All other lines, order, blank lines, and comments are left untouched.
    - No YAML library is used; this is a pure text manipulation for maximum safety and DRY compliance.
  */
  const content = fs.readFileSync(filePath, 'utf8');
  // Match the first frontmatter block (from --- to ---)
  const match = content.match(/^(---\n[\s\S]*?\n---\n?)/);
  if (!match) return; // No frontmatter found
  const frontmatterBlock = match[1];
  const body = content.slice(frontmatterBlock.length);
  const lines = frontmatterBlock.split('\n');

  // Find start and end of frontmatter block
  const startIdx = lines.findIndex(line => line.trim() === '---');
  const endIdx = lines.findIndex((line, idx) => idx > startIdx && line.trim() === '---');
  if (startIdx === -1 || endIdx === -1) return; // Malformed frontmatter

  // Search for the property line
  let found = false;
  for (let i = startIdx + 1; i < endIdx; i++) {
    // Match lines like 'property: ...' with optional whitespace and comments
    const propMatch = lines[i].match(/^([ \t]*)([a-zA-Z0-9_\-]+):(.*)$/);
    if (propMatch && propMatch[2] === property) {
      // Preserve indentation and any trailing comment
      const indent = propMatch[1] || '';
      const trailing = propMatch[3].replace(/^(.*?)(\s+#.*)?$/, '$2') || '';
      lines[i] = `${indent}${property}: ${newValue}${trailing}`;
      found = true;
      break;
    }
  }
  if (!found) {
    // Insert the property just before the closing ---
    lines.splice(endIdx, 0, `${property}: ${newValue}`);
  }
  // Reconstruct the frontmatter block
  const newFrontmatter = lines.join('\n');
  // Write back the file, preserving everything else
  fs.writeFileSync(filePath, `${newFrontmatter}\n${body.replace(/^\n+/, '')}`, 'utf8');
}

// ===============================
// Helper: Check if a URL is already an ImageKit URL
// ===============================
function isImageKitUrl(url) {
  // Accept both your prod domain and public endpoint
  return (
    typeof url === 'string' &&
    (url.startsWith('https://ik.imagekit.io/') || url.includes('imagekit.io/'))
  );
}

// ===============================
// Helper: Download image from URL and save with new name in new folder
// ===============================
/**
 * Download an image from a URL and save it with a descriptive, collision-resistant name.
 * Naming convention:
 *   <YYYY-MM-DD>_<property>_<markdown-base-name>_<original-image-base>.<ext>
 * Example:
 *   2025-05-04_banner_image_A-New-API-Standard-for-chaining-AI-Model-Context-Protocol_bannerimg.jpg
 *
 * @param {string} imageUrl - The URL of the image to download
 * @param {string} destDir - The directory to save the image in
 * @param {string} baseName - The base name of the markdown file (without extension)
 * @param {string} property - The property name (e.g., banner_image, portrait_image)
 * @returns {Promise<string>} - The full path to the downloaded image
 */
async function downloadAndRenameImage(imageUrl, destDir, baseName, property) {
  // Extract extension from image URL (default to jpg)
  const extMatch = imageUrl.match(/\.([a-zA-Z0-9]+)(\?|$)/);
  const ext = extMatch ? extMatch[1] : 'jpg';
  const today = new Date().toISOString().slice(0, 10);

  // Sanitize markdown base name (remove spaces, special chars)
  const safeBase = baseName.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9\-]/g, '');
  // Sanitize property name
  const safeProperty = property ? property.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9\-]/g, '') : 'image';
  // Extract original image base name (without extension)
  let originalImageBase = '';
  try {
    const urlParts = imageUrl.split('/');
    const lastPart = urlParts[urlParts.length - 1].split('?')[0];
    originalImageBase = lastPart.replace(/\.[^.]+$/, '').replace(/\s+/g, '-').replace(/[^a-zA-Z0-9\-]/g, '');
  } catch (e) {
    originalImageBase = 'img';
  }

  // Compose new filename
  const fileName = `${today}_${safeProperty}_${safeBase}_${originalImageBase}.${ext}`;
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
  const destPath = path.join(destDir, fileName);
  const res = await fetch(imageUrl);
  if (!res.ok) throw new Error(`Failed to download ${imageUrl}`);
  const buffer = await res.buffer();
  fs.writeFileSync(destPath, buffer);
  return destPath;
}

// ===============================
// MAIN: Directory processing logic
// ===============================
async function processDirectory() {
  const mdFiles = walkDirectoryRecursive(DIRECTORY_TO_PROCESS);
  for (const file of mdFiles) {
    const { frontmatter } = parseFrontmatter(file);
    for (const property of PROPERTIES_TO_SEND_TO_IMAGEKIT) {
      const imgUrl = frontmatter[property];
      // ===============================
      // If OVERWRITE_IMAGEKIT_URL is false and the field is already an ImageKit URL, skip processing this property
      // ===============================
      if (!imgUrl) continue;
      if (!OVERWRITE_IMAGEKIT_URL && isImageKitUrl(imgUrl)) {
        // Comment: Skipping update for this property because it is already an ImageKit URL and overwrite is disabled
        // Where this logic is called:
        //   - processDirectory > for (const property of PROPERTIES_TO_SEND_TO_IMAGEKIT)
        //   - This ensures existing valid ImageKit URLs are preserved
        continue;
      }
      // Download image
      // Use markdown filename (with .md removed) as the unique, safe folder name for images
      // This avoids using the title property, which may contain punctuation or unsafe characters
      const baseName = path.basename(file, path.extname(file));
      const destDir = path.join(IMAGE_DOWNLOAD_BASE_PATH, baseName.replace(/\s+/g, '-'));
      let downloadedPath;
      try {
        downloadedPath = await downloadAndRenameImage(imgUrl, destDir, baseName, property);
      } catch (e) {
        console.error(`[ERROR] Failed to download image for ${file} (${property}):`, e.message);
        continue;
      }
      // Upload to ImageKit
      let imagekitUrl = null;
      try {
        // --- Extract tags from frontmatter for ImageKit upload ---
        // Aggressively commented: tags are extracted from the markdown file's frontmatter
        const { frontmatter } = parseFrontmatter(file);
        let tags = [];
        if (frontmatter.tags) {
          // Only use tags for upload, never write them back or modify the file!
          if (Array.isArray(frontmatter.tags)) {
            tags = frontmatter.tags;
          } else if (typeof frontmatter.tags === 'string') {
            // Handle comma, hyphen, or JSON-like array string
            try {
              // Try parsing as JSON array first
              const parsed = JSON.parse(frontmatter.tags);
              if (Array.isArray(parsed)) {
                tags = parsed;
              } else {
                // Fallback: split on comma or hyphen
                tags = frontmatter.tags.split(/[,-]/).map(s => s.trim()).filter(Boolean);
              }
            } catch {
              // Not JSON, fallback: split on comma or hyphen
              tags = frontmatter.tags.split(/[,-]/).map(s => s.trim()).filter(Boolean);
            }
          }
        }
        // Remove duplicates for upload
        tags = [...new Set(tags)];
        // --- END tags extraction ---
        // --- Determine the upload filename: always use .webp extension for ImageKit ---
        // We always set the fileName to .webp for ImageKit, even if the source is .jpg or .png,
        // because ImageKit auto-converts to WebP and serves the file as WebP.
        // This keeps the extension and actual format aligned for clarity and correctness.
        const localExt = path.extname(downloadedPath).toLowerCase();
        let baseName = path.basename(downloadedPath, localExt);
        // --- ENFORCE UNDERSCORE IN PROPERTY NAME IN FILENAME ---
        // Aggressively ensure the property name is always _portrait_image_ or _banner_image_ in the filename
        if (property === 'portrait_image') {
          baseName = baseName.replace(/_portraitimage_/gi, '_portrait_image_');
        } else if (property === 'banner_image') {
          baseName = baseName.replace(/_bannerimage_/gi, '_banner_image_');
        }
        // If property is missing or not in the filename, append it for safety
        if (!baseName.includes(`_${property}_`)) {
          baseName = baseName + `_${property}_`;
        }
        let uploadFileName = baseName + '.webp'; // force .webp extension for clarity
        // --- END upload filename logic ---
        const uploadResult = await imagekit.upload({
          file: fs.readFileSync(downloadedPath),
          fileName: uploadFileName,
          folder: IMAGEKIT_FOLDER,
          tags: tags,
        });
        imagekitUrl = uploadResult.url;
        console.log(`[SUCCESS] Uploaded ${downloadedPath} to ImageKit: ${imagekitUrl}`);
      } catch (e) {
        console.error(`[ERROR] Failed to upload ${downloadedPath} to ImageKit:`, e.message);
        // Write imagekit_error_time to frontmatter with timestamp, wrapped in single quotes and curly braces
        try {
          const now = new Date().toISOString();
          const errorValue = `'{${now}}'`;
          const { frontmatter, body, yaml } = parseFrontmatter(file);
          frontmatter['imagekit_error_time'] = errorValue;
          writeFrontmatter(file, frontmatter, body, yaml);
          console.log(`[INFO] Wrote imagekit_error_time to ${file}`);
        } catch (err) {
          console.error(`[ERROR] Failed to write imagekit_error_time in ${file}:`, err.message);
        }
        continue;
      }
      // Overwrite frontmatter property
      try {
        updateFrontmatterProperty(file, property, imagekitUrl);
        console.log(`[INFO] Updated ${property} in ${file}`);
      } catch (e) {
        console.error(`[ERROR] Failed to update frontmatter in ${file}:`, e.message);
      }
    }
  }
}

// ===============================
// MAIN: Single image processing logic (optional)
// ===============================
// ===============================
// MAIN: Single image processing logic (for a single Markdown file)
// ===============================
/**
 * Processes a single Markdown file:
 *   - For each property in PROPERTIES_TO_SEND_TO_IMAGEKIT,
 *     - Checks if property exists and if it's already an ImageKit URL
 *     - Downloads the image, uploads to ImageKit, updates frontmatter
 *     - Handles errors robustly and writes error timestamps
 */
// ===============================
// MAIN: Single image upload logic (for a single image file, not markdown)
// ===============================
/**
 * Uploads a single image file (not markdown) to ImageKit and prints the resulting CDN URL.
 * No frontmatter, no markdown parsing—just a direct upload.
 */
async function processSingleImage() {
  const file = SINGLE_IMAGE_PATH;
  if (!fs.existsSync(file)) {
    console.error(`[ERROR] File does not exist: ${file}`);
    return;
  }
  // Only allow image files
  const allowedExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg'];
  const ext = path.extname(file).toLowerCase();
  if (!allowedExtensions.includes(ext)) {
    console.error(`[ERROR] File extension not supported for upload: ${ext}`);
    return;
  }
  // ===============================
  // Generate a sensible upload filename
  // ===============================
  // Use the local filename, but always upload as .webp for consistency (except .svg)
  let baseName = path.basename(file, ext);
  let uploadFileName = (ext === '.svg') ? baseName + '.svg' : baseName + '.webp';
  // ===============================
  // Upload to ImageKit
  // ===============================
  try {
    const uploadResult = await imagekit.upload({
      file: fs.readFileSync(file),
      fileName: uploadFileName,
      folder: '/uploads/lossless/repImages',
      tags: [],
    });
    const imagekitUrl = uploadResult.url;
    console.log(`[SUCCESS] Uploaded ${file} to ImageKit: ${imagekitUrl}`);
    // Print just the URL for easy copy-paste
    console.log(imagekitUrl);
  } catch (e) {
    console.error(`[ERROR] Failed to upload ${file} to ImageKit:`, e.message);
  }
}



// ===============================
// MAIN ENTRY
// ===============================
async function main() {
  if (PROCESS_DIRECTORY) {
    await processDirectory();
  } else if (PROCESS_SINGLE_IMAGE) {
    await processSingleImage();
  } else {
    console.error('[ERROR] Set PROCESS_DIRECTORY or PROCESS_SINGLE_IMAGE to true.');
  }
}

main();

/**
 * ENVIRONMENT VARIABLES:
 *   IMAGEKIT_PUBLIC_KEY - Your ImageKit public key
 *   IMAGEKIT_PRIVATE_KEY - Your ImageKit private key
 *   IMAGEKIT_URL_ENDPOINT - Your CDN base URL (for serving images)
 *   IMAGEKIT_UPLOAD_ENDPOINT - (Optional) Explicit upload API endpoint (for clarity/documentation)
 *
 * The ImageKit SDK only requires the CDN endpoint; upload endpoint is handled internally.
 *
 * - UPLOAD_ENDPOINT: Used for uploading images (handled by SDK, but documented)
 * - CDN_URL_ENDPOINT: Used for generating/serving image URLs
 *
 * To change the upload folder, modify the hardcoded value in the script.
 *
 * Where this is used:
 * - For uploading images to ImageKit for use in content and site assets.
 * - Ensures all image URLs are CDN-backed and optimized.
 *
 * How to use:
 * - Place your ImageKit keys in site/.env
 * - Run: node convertImageToImagkitUrl.cjs <file-or-directory>
 * - Output: Prints ImageKit URLs to console for use in markdown, JSON, etc.
 */
