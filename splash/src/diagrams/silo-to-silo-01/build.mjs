#!/usr/bin/env node
/**
 * Regenerate the inline SVGs for /studies/collaborations/silo-to-silo-01/.
 *
 * The JSON files beside this script are Archify sources, authored from the
 * Mermaid in step 2 of the collaboration study. Archify validates each one
 * (showcase profile) and renders standalone HTML. This script keeps only the
 * <svg> element and makes it safe to inline next to three others:
 *
 *   - prefixes every id (and url(#...) / aria reference) per diagram,
 *   - drops Archify's own background grid (the splash has its own),
 *   - drops viewer-only interaction attributes (no Archify runtime here),
 *   - replaces the generic <desc> with one that says what the diagram shows,
 *   - optionally drops arrowheads where the relationship has no direction.
 *
 * Colors are not touched. Archify emits semantic classes (c-frontend,
 * a-dashed, t-muted, ...), and the page maps those classes onto the splash's
 * theme tokens, so the diagrams follow the dark / light / vibrant toggle.
 *
 * Usage (from splash/):
 *   node src/diagrams/silo-to-silo-01/build.mjs
 *
 * Archify is the vendored skill at
 *   <lossless-monorepo>/context-v/agent-skills/archify/archify/
 * Override with ARCHIFY=/path/to/bin/archify.mjs. Nothing is written inside
 * the Archify directory; HTML goes to a temp dir and is discarded.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ARCHIFY =
  process.env.ARCHIFY ??
  resolve(HERE, '../../../../../context-v/agent-skills/archify/archify/bin/archify.mjs');

const DIAGRAMS = [
  {
    name: 'harness-map-dev',
    type: 'architecture',
    arrows: false,
    desc:
      'Developer-agents harness. Lossless on the left, The Collaborator on the right, artifacts grouped by category. ' +
      'Each line joins a pair and is labelled shared, similar, or missing on their side. Three Lossless pieces ' +
      '(a root instruction file, CI and a changelog convention) have no counterpart on their side; the tree machinery ' +
      '(Stow-linked skills, the Chroma corpus, Spec Kit) has none either, and needs none.',
  },
  {
    name: 'harness-map-product',
    type: 'architecture',
    arrows: false,
    desc:
      'In-product-agents harness. Lossless on the left, The Collaborator on the right, artifacts grouped by category. ' +
      'Most pairs are similar. Three lines are missing on our side: a tiered simulator, run-to-run replay and live-model ' +
      'preflights. One is missing on their side: a source-of-truth rule between a coding-agent command and its in-product copy.',
  },
  {
    name: 'loop-dev-collaborator',
    type: 'workflow',
    arrows: true,
    desc:
      "The Collaborator's developer loop in four lanes. A signed-off design doc, a session that starts cold with no instruction file, " +
      'implementation, the verify skill with node tests and an ad-hoc browser drive, a measured commit, then merge and deploy. ' +
      'Memory is the git log, and sometimes a what-shipped section in the design doc.',
  },
  {
    name: 'loop-dev-lossless',
    type: 'workflow',
    arrows: true,
    desc:
      'The Lossless developer loop in the same four lanes. An exploration or issue becomes a signed-off spec and a plan per phase; ' +
      'the agent implements with layered instructions and skills. A red proof stops it; a green one leads to a changelog entry, ' +
      'a commit with CI, a handoff and submodule bump, and ingest into the Chroma corpus the next session queries.',
  },
  {
    name: 'loop-product-collaborator',
    type: 'workflow',
    arrows: true,
    desc:
      "The Collaborator's in-product loop for generating an exam. Source text and notes go into a session opener; the agent reads the rulebook " +
      'and craft ledger; the exam-build command or its in-product studio drafts a sketch and stops for human sign-off; the exam is assembled ' +
      'from a skeleton and validated, then run through a simulator with error bars and preflights. Findings go to the craft ledger; ' +
      'when it holds, a human sits the exam and the sitting is reviewed.',
  },
  {
    name: 'loop-product-lossless',
    type: 'workflow',
    arrows: true,
    desc:
      'The Lossless in-product loop for generating a memo. Deal inputs, an outline YAML and runtime rules, harvesting and section writing ' +
      'from a closed corpus, citation and fact-checking agents, then evaluation and scoring of one run. An analyst revises or exports. ' +
      'Lessons land in issue-resolution files or an AGENTS.md rule. Marked as missing: replay, tiered inputs and error bars.',
  },
  {
    name: 'shape',
    type: 'architecture',
    arrows: true,
    desc:
      'Left: the monolith. One repo with one app branches into its in-product exam chain (ledger, validator, simulator), ' +
      'developer work with no entry point, and a .claude folder with one skill, one command and an allowlist. ' +
      'Right: the pseudomonorepo. The anchor AGENTS.md leads to the ai-labs CLAUDE.md, then the augment-it and memopop-ai instruction files ' +
      'and the orchestrator, whose product harness (runtime AGENTS.md, outlines, agents) sits below it. A shared skills library is linked into both; ' +
      'context-v and changelog sit at every level and are ingested into a Chroma corpus.',
  },
];

function escapeXml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function extractSvg(html) {
  const start = html.indexOf('<svg viewBox');
  const end = html.indexOf('</svg>', start);
  if (start < 0 || end < 0) throw new Error('no <svg viewBox> in Archify output');
  return html.slice(start, end + '</svg>'.length);
}

function inlineSafe(svg, { name, arrows, desc }) {
  const p = `s2s-${name}-`;
  let out = svg;

  // Prefix ids and every reference to them.
  out = out.replace(/\bid="([^"]+)"/g, (_, id) => `id="${p}${id}"`);
  out = out.replace(/url\(#([^)]+)\)/g, (_, id) => `url(#${p}${id})`);
  out = out.replace(/aria-labelledby="([^"]+)"/g, (_, ids) =>
    `aria-labelledby="${ids.split(/\s+/).map((id) => p + id).join(' ')}"`,
  );

  // Archify's background grid. The splash draws its own blueprint grid.
  out = out.replace(/\s*<!-- Background Grid -->\s*<rect width="100%" height="100%" fill="url\(#[^)]+\)" \/>/, '');

  // Viewer-only interaction hooks: there is no Archify runtime on the page,
  // so nodes must not announce themselves as buttons.
  out = out.replace(/ tabindex="0"/g, '').replace(/ role="button"/g, '');
  out = out.replace(/ aria-pressed="(true|false)"/g, '');
  out = out.replace(/ aria-label="Focus [^"]*"/g, '');

  // A description that says what the diagram shows.
  out = out.replace(/<desc id="([^"]+)">[\s\S]*?<\/desc>/, (_, id) => `<desc id="${id}">${escapeXml(desc)}</desc>`);

  if (!arrows) out = out.replace(/ marker-end="url\(#[^)]+\)"/g, '');

  // Hook for the page's token mapping.
  out = out.replace('<svg viewBox', `<svg class="s2s-svg" data-diagram="${name}" focusable="false" viewBox`);
  return out.replace(/\n\s*\n/g, '\n') + '\n';
}

const tmp = mkdtempSync(join(tmpdir(), 's2s-archify-'));
try {
  for (const d of DIAGRAMS) {
    const src = join(HERE, `${d.name}.${d.type}.json`);
    const html = join(tmp, `${d.name}.html`);
    const receipt = JSON.parse(
      execFileSync('node', [ARCHIFY, 'deliver', d.type, src, html, '--quality', 'showcase', '--json'], {
        encoding: 'utf8',
      }),
    );
    if (!receipt.ok) throw new Error(`${d.name}: Archify delivery failed`);
    const v = receipt.validation;
    const svg = inlineSafe(extractSvg(readFileSync(html, 'utf8')), d);
    writeFileSync(join(HERE, `${d.name}.svg`), svg);
    console.log(
      `${d.name}: ${v.checksPassed}/${v.checkCount} checks, ${v.errors} errors, ${v.warnings} warnings -> ${d.name}.svg (${svg.length} bytes)`,
    );
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
