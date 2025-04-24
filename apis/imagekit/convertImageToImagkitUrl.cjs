/**
 * convertImageToImagkitUrl.cjs
 *
 * A common Node.js script to upload a single image or all images in a directory to ImageKit.io.
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

// Load .env if present (optional, for local dev)
try {
  require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
} catch (e) {
  // Ignore if dotenv not installed
}

// ===============================
// CONFIGURATION: Set path to file or directory here if you do NOT want to use CLI
// ===============================
// To use a hardcoded path, set HARDCODED_PATH below. Leave as null to use CLI argument.
const HARDCODED_PATH = "/Users/mpstaton/code/lossless-monorepo/content/visuals/For/imageRep__North-Sea-of-Data.webp"; // <-- SET YOUR FILE OR DIRECTORY PATH HERE

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
// Helper: Check if file is an image
// ===============================
function isImageFile(filename) {
  return /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(filename);
}

// ===============================
// Main: Upload logic (uses upload endpoint for clarity in comments)
// ===============================
async function uploadFileToImageKit(filepath) {
  const fileName = path.basename(filepath);
  const fileBuffer = fs.readFileSync(filepath);
  const uploadFolder = "/uploads/lossless"; // Hardcoded, as no env var exists
  try {
    // The SDK internally uses the upload endpoint, but we clarify it for documentation
    const result = await imagekit.upload({
      file: fileBuffer,
      fileName,
      folder: uploadFolder,
    });
    console.log(`[SUCCESS] ${fileName} => ${result.url}`);
    console.log(`  [INFO] Uploaded to folder: ${uploadFolder}`);
    console.log(`  [INFO] CDN Endpoint: ${CDN_URL_ENDPOINT}`);
    console.log(`  [INFO] Upload Endpoint: ${UPLOAD_ENDPOINT}`);
  } catch (err) {
    console.error(`[FAIL] ${fileName}:`, err && err.message ? err.message : err);
  }
}

async function main() {
  // Prefer HARDCODED_PATH if set, otherwise use CLI argument
  let inputPath = HARDCODED_PATH || process.argv[2];

  // If HARDCODED_PATH is set and not absolute, resolve relative to monorepo root
  if (HARDCODED_PATH && !path.isAbsolute(HARDCODED_PATH)) {
    // __dirname = .../ai-labs/apis/imagekit, so go up two levels to monorepo root
    inputPath = path.resolve(__dirname, '../../', HARDCODED_PATH);
  } else if (!HARDCODED_PATH) {
    inputPath = path.resolve(process.cwd(), inputPath);
  }

  console.log(`[DEBUG] Using input path: ${inputPath}`);

  if (!fs.existsSync(inputPath)) {
    console.error('[ERROR] Path does not exist:', inputPath);
    process.exit(1);
  }
  const stat = fs.statSync(inputPath);
  if (stat.isDirectory()) {
    // Upload all image files in directory
    const files = fs.readdirSync(inputPath)
      .filter(isImageFile)
      .map(f => path.join(inputPath, f));
    if (files.length === 0) {
      console.log('[INFO] No image files found in directory:', inputPath);
      return;
    }
    for (const file of files) {
      await uploadFileToImageKit(file);
    }
  } else if (stat.isFile()) {
    if (!isImageFile(inputPath)) {
      console.error('[ERROR] Not an image file:', inputPath);
      process.exit(1);
    }
    await uploadFileToImageKit(inputPath);
  } else {
    console.error('[ERROR] Path is neither a file nor a directory:', inputPath);
    process.exit(1);
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