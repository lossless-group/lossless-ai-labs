/**
 * YAML Formatter Utility
 * 
 * Provides utilities for formatting YAML frontmatter in a consistent way
 * without adding block scalar syntax or unnecessary quotes.
 * 
 * This is a standalone utility to ensure consistent YAML formatting
 * across the entire observer system.
 */

import { formatDate } from '@observer-utils/commonUtils';
import fs from 'fs/promises';
import { ReportingService } from '@observer-services/reportingService';

/**
 * =============================================================
 * CONDITIONAL RULES FOR RETURNED OBJECTS FROM APIs (Single Source of Truth)
 *
 * These rules apply to any string values (especially from APIs) that are to be written as YAML frontmatter:
 *
 * === RULES ===
 * 1. By default, any url coming back as the single value of a property should be written as a bare continguous string. 
 * 
 * 1. If the string contains any YAML reserved character (:, #, >, |, {, }, [, ], ,, &, *, !, ?, |, -, <, >, =, %, @, `, or quotes), wrap in single quotes ('').
 * 2. If the string contains a single quote ('), wrap in double quotes ("").
 * 3. If the string contains a double quote ("), wrap in single quotes ('').
 * 4. If the string contains both single and double quotes, use double quotes and escape internal double quotes (YAML allows escaping with \"').
 * 5. Never use block scalar syntax (|- or >-) for values returned from APIs.
 *
 * These rules are enforced (or should be enforced) in the formatFrontmatterLine function and any helpers.
 *
 * If you update this logic, update this comment block and all relevant helper functions.
 * =============================================================
 */

/**
 * Formats frontmatter as YAML with consistent formatting
 * NEVER uses block scalar syntax (>- or |-)
 * 
 * @param frontmatter The frontmatter object
 * @param templateOrder Optional array of keys to output first
 * @returns Formatted YAML frontmatter
 */
export function formatFrontmatter(frontmatter: Record<string, any>, templateOrder?: string[]): string {
  const formattedFrontmatter = { ...frontmatter };
  const arrayFields = ['tags', 'authors', 'aliases'];
  const extractedArrays: Record<string, any[]> = {};
  for (const field of arrayFields) {
    if (formattedFrontmatter[field] && Array.isArray(formattedFrontmatter[field])) {
      extractedArrays[field] = formattedFrontmatter[field];
      delete formattedFrontmatter[field];
    }
  }
  let yamlContent = '';
  if (templateOrder && Array.isArray(templateOrder)) {
    for (const key of templateOrder) {
      if (key in formattedFrontmatter) {
        yamlContent += formatFrontmatterLine(key, formattedFrontmatter[key]);
        delete formattedFrontmatter[key];
      }
    }
  }
  for (const [key, value] of Object.entries(formattedFrontmatter)) {
    if (arrayFields.includes(key)) continue;
    yamlContent += formatFrontmatterLine(key, value);
  }
  for (const [field, values] of Object.entries(extractedArrays)) {
    yamlContent += `${field}:\n`;
    for (const value of values) {
      yamlContent += `  - ${value}\n`;
    }
  }
  return yamlContent;
}

// Helper to format a single line according to project rules
function formatFrontmatterLine(key: string, value: any): string {
  if (key.startsWith('date_') && value) {
    return `${key}: ${formatDate(value)}\n`;
  }
  if (value === null) {
    return `${key}: null\n`;
  }
  if (
    typeof value === 'string' &&
    (key.endsWith('_error') || key.endsWith('_error_message') || key === 'og_error_message')
  ) {
    if ((value.startsWith("'") && value.endsWith("'")) || (value.startsWith('"') && value.endsWith('"'))) {
      return `${key}: ${value}\n`;
    }
    const singleQuoted = `'${value.replace(/'/g, "''")}'`;
    return `${key}: ${singleQuoted}\n`;
  }
  if (typeof value === 'string') {
    return `${key}: ${quoteForYaml(value)}\n`;
  }
  return `${key}: ${value}\n`;
}

// Assess a string and return the YAML-safe version, using single or double quotes as needed.
function quoteForYaml(value: string): string {
  const yamlReserved = /[:#>|{}\[\],&*!?\-<>=%@`'"]/g;
  if (!yamlReserved.test(value)) {
    return value;
  }
  if (value.includes("'") && value.includes('"')) {
    return `"${value.replace(/"/g, '\\"')}"`;
  }
  if (value.includes("'")) {
    return `"${value}"`;
  }
  if (value.includes('"')) {
    return `'${value}'`;
  }
  return `'${value}'`;
}

/**
 * Extracts frontmatter from markdown content using regex only - no YAML libraries
 * 
 * @param content The markdown content
 * @returns The extracted frontmatter as an object, or null if no frontmatter is found
 */
export function extractFrontmatter(content: string): Record<string, any> | null {
  const match = /^---\n([\s\S]*?)\n---/m.exec(content);
  if (!match) return null;
  const frontmatter: Record<string, any> = {};
  const lines = match[1].split(/\r?\n/);
  for (const line of lines) {
    const kv = line.match(/^([a-zA-Z0-9_\-]+):\s*(.*)$/);
    if (kv) {
      const key = kv[1];
      let value = kv[2];
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      frontmatter[key] = value;
    }
  }
  return frontmatter;
}

/**
 * Reports basic frontmatter inconsistencies for a Markdown file.
 * 
 * @param frontmatter The in-memory frontmatter object to check
 * @param template The template definition object (should have a `required` property)
 * @param filePath The file path for reporting context
 * @returns An object describing only missing or extra fields
 */
export function reportPotentialFrontmatterInconsistencies(
  frontmatter: Record<string, any>,
  template: any, // Should be MetadataTemplate, but using any for flexibility
  filePath: string
): {
  missingFields: string[];
  extraFields: string[];
  filePath: string;
} {
  const report = {
    missingFields: [] as string[],
    extraFields: [] as string[],
    filePath,
  };
  for (const key of Object.keys(template.required || {})) {
    if (!Object.prototype.hasOwnProperty.call(frontmatter, key)) {
      report.missingFields.push(key);
    }
  }
  const allowedFields = new Set([
    ...Object.keys(template.required || {}),
    ...Object.keys(template.optional || {}),
  ]);
  for (const key of Object.keys(frontmatter)) {
    if (!allowedFields.has(key)) {
      report.extraFields.push(key);
    }
  }
  return report;
}

// Updates the frontmatter in a Markdown file's content string.
export function updateFrontmatter(content: string, updatedFrontmatter: Record<string, any>, templateOrder?: string[]): string {
  const match = /^---\n([\s\S]*?)\n---/m.exec(content);
  let bodyContent = '';
  if (match) {
    bodyContent = content.slice(match[0].length).replace(/^\n+/, '');
  } else {
    bodyContent = content;
  }
  const formattedFrontmatter = formatFrontmatter(updatedFrontmatter, templateOrder);
  return `---\n${formattedFrontmatter}---\n\n${bodyContent}`;
}

// Remove internal/process-only keys from frontmatter before writing
function stripInternalFrontmatterKeys(frontmatter: Record<string, any>): Record<string, any> {
  const INTERNAL_KEYS = ['changed'];
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(frontmatter)) {
    if (!INTERNAL_KEYS.includes(key)) {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

/**
 * Writes updated frontmatter (and optionally body) back to a Markdown file.
 * Uses the custom serializer (formatFrontmatter) and updateFrontmatter logic.
 *
 * @param filePath Absolute path to the Markdown file
 * @param updatedFrontmatter The updated frontmatter object
 * @param templateOrder Optional array of keys for ordering
 * @param reportingService Optional instance of ReportingService for logging YAML reorders
 * @returns Promise<void>
 */
export async function writeFrontmatterToFile(
  filePath: string,
  updatedFrontmatter: Record<string, any>,
  templateOrder?: string[],
  reportingService?: ReportingService
): Promise<void> {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const prevFrontmatter = extractFrontmatter(content) || {};
    const previousOrder = Object.keys(prevFrontmatter);
    const cleanedFrontmatter = stripInternalFrontmatterKeys(updatedFrontmatter);
    const newContent = updateFrontmatter(content, cleanedFrontmatter, templateOrder);
    const newOrder = templateOrder && templateOrder.length > 0
      ? [...templateOrder, ...Object.keys(cleanedFrontmatter).filter(k => !templateOrder.includes(k))]
      : Object.keys(cleanedFrontmatter);
    const reorderedFields = previousOrder.filter((key, idx) => newOrder[idx] !== key || previousOrder[idx] !== newOrder[idx]);
    await fs.writeFile(filePath, newContent, 'utf8');
    console.log(`[yamlFrontmatter] Updated frontmatter written to: ${filePath}`);
    if (
      reportingService &&
      previousOrder.length > 0 &&
      JSON.stringify(previousOrder) !== JSON.stringify(newOrder)
    ) {
      reportingService.logFileYamlReorder(filePath, previousOrder, newOrder, reorderedFields);
    }
  } catch (err) {
    console.error(`[yamlFrontmatter] ERROR writing frontmatter to ${filePath}:`, err);
  }
}

/**
 * Example of extracted frontmatter from a Markdown file.
 */
export const exampleExtractedFrontmatter = {
  site_uuid: "d729680e-d296-4c7c-be91-9e08544aea99",
  created_by: "[[organizations/Meta]]",
  github_repo_url: "https://github.com/ollama/ollama",
  github_profile_url: "https://github.com/ollama",
  date_modified: "2025-04-17",
  date_created: "2025-03-31",
  tags: "[Open-Source]",
  url: "https://ollama.com/"
};
