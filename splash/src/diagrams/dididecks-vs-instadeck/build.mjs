#!/usr/bin/env node
/**
 * Regenerate the inline SVGs for /studies/collaborations/dididecks-vs-instadeck/.
 *
 * The JSON files beside this script are Archify sources, authored from the
 * Mermaid in step 2 of the collaboration study (dididecks-ai and Instadeck). Archify validates each one
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
 *   node src/diagrams/dididecks-vs-instadeck/build.mjs
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
      'Developer-agents harness. dididecks-ai on the left, Instadeck on the right, artifacts grouped by category. ' +
      'Each line joins a pair and is labelled shared, similar, different by design, or missing on our side. ' +
      'Three pairs are shared and ten similar. All four missing lines are verification pieces that Instadeck has and dididecks-ai lacks: ' +
      'CI that runs tests, tests at all, tests that pin documents, and a review packet. Unpaired boxes are differences that fit each side: ' +
      'her release records and archive branches, our pseudomonorepo machinery.',
  },
  {
    name: 'harness-map-product',
    type: 'architecture',
    arrows: false,
    desc:
      'In-product-agents harness. dididecks-ai on the left, Instadeck on the right, artifacts grouped by category. ' +
      'Skills and the Chromium render are shared; eight pairs are similar, including the Markdown document chain. ' +
      'Four lines are missing on our side (a prompt pin, measured repair, a frozen corpus, acceptance runners) and one on hers ' +
      '(variants kept side by side per slot). Memory is different by design, and our planned embedded chat has no counterpart.',
  },
  {
    name: 'loop-dev-instadeck',
    type: 'workflow',
    arrows: true,
    desc:
      "Instadeck's developer loop in four lanes. A spec or dated decision, a Codex brief, one branch per concern, " +
      'contract tests and CI, a pull request squash-merged to main, gate, rollback and review records, then a Railway deploy with migrations first. ' +
      'The reasons for a change live in PR titles and dated docs.',
  },
  {
    name: 'loop-dev-dididecks',
    type: 'workflow',
    arrows: true,
    desc:
      'The dididecks-ai developer loop in the same four lanes. An exploration or spec in context-v, a plan per phase, ' +
      'Claude Code implementing with layered CLAUDE.md files and skills, a browser walk with no automated tests, a changelog entry and ' +
      'sitemap status flip, a commit to development, submodule pointer bumps and a shell release, then Vercel and Pages deploys.',
  },
  {
    name: 'loop-product-instadeck',
    type: 'workflow',
    arrows: true,
    desc:
      "Instadeck's in-product loop. A customer uploads a deck; the pipeline reviews and researches it, writes the Markdown document chain " +
      'up to 06-DESIGN.md, and authors whole-deck HTML from per-slide files. Chromium proves the render: a measured failure goes to a repair skill ' +
      'and back, a pass publishes an immutable DesignVersion. One result per run.',
  },
  {
    name: 'loop-product-dididecks',
    type: 'workflow',
    arrows: true,
    desc:
      'The dididecks-ai in-product loop. An operator brings source material; Claude Code writes the DESIGN.md and ingests people and companies, ' +
      'writes a narrative file per slide, and builds the whole deck as one Scroll-UI page. A human ranks each slot in place: a weak slot gets a new variant ' +
      'and goes back, a strong one is recreated as a 16:9 Play-UI file and exported.',
  },
  {
    name: 'shape',
    type: 'architecture',
    arrows: true,
    desc:
      'Left: Instadeck, one repo with two apps. README routes to the product spec of record, which tests pin; the backend holds the product harness ' +
      '(prompts, skills, knowledge), and a wall keeps repo memory out of it. Right: dididecks-ai inside a tree. The anchor AGENTS.md leads to the ai-labs ' +
      'and dididecks-ai CLAUDE.md files, then to the deck-shell package and seven client sites. Shared skills feed both the repo and each client folder, ' +
      'and Claude Code reads all of it to generate.',
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
  const p = `dvi-${name}-`;
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
  out = out.replace('<svg viewBox', `<svg class="dvi-svg" data-diagram="${name}" focusable="false" viewBox`);
  return out.replace(/\n\s*\n/g, '\n') + '\n';
}

const tmp = mkdtempSync(join(tmpdir(), 'dvi-archify-'));
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
