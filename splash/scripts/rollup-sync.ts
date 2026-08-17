#!/usr/bin/env node
/**
 * pnpm rollup:sync
 *
 * Walks each child submodule's locally-checked-out changelog/ and context-v/
 * and writes the results into splash/src/rollup/. Subsequent `pnpm build` and
 * `pnpm dev` runs read from those files — no API calls, no auth, just file IO.
 *
 * Local-filesystem variant (vs. content-farm/splash's GitHub Content API
 * version) — ai-labs's children are nested submodules always checked out
 * during local dev, so we skip the API call and read straight from disk.
 *
 * Run when:
 * - You bumped a submodule pointer and want the splash to reflect new content.
 * - A child shipped a new changelog entry and you want it surfaced.
 * - Periodically (e.g. weekly) to catch upstream drift.
 *
 * Output layout:
 *   splash/src/rollup/
 *     changelog/<child>/<filename>.md       (with provenance frontmatter)
 *     context-v/<child>/<section>/<filename>.md
 */

import { mkdir, rm, writeFile, readFile, readdir, stat } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const SPLASH_DIR = resolve(SCRIPT_DIR, '..');
const PARENT_DIR = resolve(SPLASH_DIR, '..');
const ROLLUP_ROOT = resolve(SPLASH_DIR, 'src', 'rollup');
const CHANGELOG_OUT = resolve(ROLLUP_ROOT, 'changelog');
const CONTEXT_V_OUT = resolve(ROLLUP_ROOT, 'context-v');

/** Children of ai-labs to roll up. Order is presentation-meaningful — first
 *  listed is shown first when entries are otherwise tied.
 *
 *  Some children are themselves pseudomonorepos with their own containers of
 *  sub-projects — each sub-project gets auto-discovered at sync time and
 *  rolled up as a sub-child with slug `<child>/<name>`. `containers` names
 *  the subdirs to inspect (default: `['apps']`); `'.'` scans the child's own
 *  direct children (the studies shape). Any directory found that has
 *  `changelog/` or `context-v/` becomes a sub-child. */
const CHILDREN: { slug: string; dir: string; containers?: string[] }[] = [
  { slug: 'context-vigilance-kit', dir: 'context-vigilance-kit' },
  { slug: 'memopop-ai',            dir: 'memopop-ai' },
  { slug: 'dididecks-ai',          dir: 'dididecks-ai', containers: ['apps', 'client-sites'] },
  { slug: 'augment-it',            dir: 'augment-it' },
  { slug: 'corpora-builder',       dir: 'corpora-builder' },
  { slug: 'id-didi-sh',            dir: 'id-didi-sh' },
  { slug: 'flave',                 dir: 'flave-ai' },
  { slug: 'studies',               dir: 'studies', containers: ['.'] },
];

interface Source {
  /** Provenance slug — `<child>` or `<child>/<app>`. Used as the `from` field
   *  on every rolled-up file and as the on-disk path under the output root. */
  slug: string;
  /** Path relative to PARENT_DIR — e.g. `memopop-ai` or `memopop-ai/apps/memopop-native`. */
  dir: string;
  /** Container this source was discovered in (`apps`, `client-sites`, …).
   *  Undefined for a top-level child. Drives DENIED_CONTAINERS. */
  container?: string;
}

async function discoverSubChildren(child: {
  slug: string;
  dir: string;
  containers?: string[];
}): Promise<Source[]> {
  const out: Source[] = [];
  for (const container of child.containers ?? ['apps']) {
    const containerDir =
      container === '.'
        ? resolve(PARENT_DIR, child.dir)
        : resolve(PARENT_DIR, child.dir, container);
    let entries;
    try {
      entries = await readdir(containerDir, { withFileTypes: true });
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') continue;
      throw err;
    }
    for (const e of entries) {
      if (!e.isDirectory() || e.name.startsWith('.') || e.name === 'node_modules') continue;
      const subDir = resolve(containerDir, e.name);
      const hasChangelog = await pathExists(resolve(subDir, 'changelog'));
      const hasContextV = await pathExists(resolve(subDir, 'context-v'));
      if (!hasChangelog && !hasContextV) continue;
      const relContainer = container === '.' ? '' : `${container}/`;
      out.push({
        slug: `${child.slug}/${e.name}`,
        dir: `${child.dir}/${relContainer}${e.name}`,
        container: container === '.' ? undefined : container,
      });
    }
  }
  return out;
}

async function pathExists(p: string): Promise<boolean> {
  try {
    await stat(p);
    return true;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return false;
    throw err;
  }
}

/* ─── Visibility gate ────────────────────────────────────────────────────────
 *
 * THIS SPLASH IS PUBLIC. Everything written under src/rollup/ is committed to
 * a public repo and rendered to GitHub Pages, so anything this script copies is
 * world-readable.
 *
 * A `publish: true` frontmatter flag is NOT sufficient authorisation to appear
 * here. That flag is set by whoever authored the entry, for THEIR repo's own
 * surface — a private client repo can legitimately mark every entry
 * `publish: true` and mean "publish on the client's gated site." On
 * 2026-08-17 that mismatch put a client's confidential fundraise position
 * (named lead investor, cash on hand, runway, ASP, forward run-rate) on a live
 * public URL. The publish flag is the wrong control at this boundary.
 *
 * The control is repository visibility, checked two ways:
 *
 *   1. DENYLIST below — explicit, never overridden, no network required.
 *   2. Auto-detect — an UNAUTHENTICATED GitHub API call. A public repo returns
 *      200; a private one returns 404 because an anonymous caller cannot see it
 *      at all. No token, no `gh` dependency, and it cannot accidentally succeed
 *      on a private repo the way an authenticated call would.
 *
 * FAILS CLOSED. Anything not provably public — private, missing, renamed,
 * network error, no git remote — is excluded and logged. A rollup that is
 * missing a repo is a cosmetic problem; a rollup that leaks one is not.
 */

/* Visibility is necessary but NOT sufficient. `reach-edu-hub` is a PUBLIC repo
 * and still a named client engagement — the auto-detect below would happily
 * include it. So client work is excluded structurally, by the container it was
 * discovered in, which means a client site added next month is denied without
 * anyone remembering to update a list.
 *
 * "Private" and "confidential" are different properties. This gate checks both. */
const DENIED_CONTAINERS: readonly string[] = ['client-sites'];

/** Never rolled up, whatever the auto-detect or container rule says. */
const DENYLIST: readonly string[] = [
  'dididecks-ai/chroma-decks',
  'dididecks-ai/calmstorm-decks',
  'dididecks-ai/reach-edu-hub',
  'dididecks-ai/eventcut-ai',
  'dididecks-ai/humain-vc-decks',
  'dididecks-ai/lossless-decks',
  'dididecks-ai/the-water-foundation',
];

/** `owner/repo` from a source directory's git remote, or null. */
async function ownerRepoOf(dir: string): Promise<string | null> {
  const { execFile } = await import('node:child_process');
  const { promisify } = await import('node:util');
  const run = promisify(execFile);
  try {
    const { stdout } = await run('git', ['-C', resolve(PARENT_DIR, dir), 'remote', 'get-url', 'origin']);
    const m = stdout.trim().match(/github\.com[/:]([^/]+)\/(.+?)(?:\.git)?$/);
    return m ? `${m[1]}/${m[2]}` : null;
  } catch {
    return null;
  }
}

/** True only when the repo is provably public to an anonymous caller. */
async function isPubliclyVisible(ownerRepo: string): Promise<boolean> {
  try {
    const res = await fetch(`https://api.github.com/repos/${ownerRepo}`, {
      headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'lossless-rollup-sync' },
    });
    if (res.status === 200) {
      const body = (await res.json()) as { private?: boolean };
      return body.private === false;
    }
    return false; // 404 == invisible to anonymous == private
  } catch {
    return false; // network trouble -> fail closed
  }
}

/** Drop every source that is not provably public. */
async function filterToPublic(sources: Source[]): Promise<Source[]> {
  const kept: Source[] = [];
  for (const s of sources) {
    if (s.container && DENIED_CONTAINERS.includes(s.container)) {
      console.log(`[rollup-sync] EXCLUDED ${s.slug} — discovered in '${s.container}' (client work)`);
      continue;
    }
    if (DENYLIST.includes(s.slug)) {
      console.log(`[rollup-sync] EXCLUDED ${s.slug} — denylist`);
      continue;
    }
    const ownerRepo = await ownerRepoOf(s.dir);
    if (!ownerRepo) {
      console.log(`[rollup-sync] EXCLUDED ${s.slug} — no github remote (cannot prove public)`);
      continue;
    }
    if (!(await isPubliclyVisible(ownerRepo))) {
      console.log(`[rollup-sync] EXCLUDED ${s.slug} — ${ownerRepo} is not publicly visible`);
      continue;
    }
    kept.push(s);
  }
  return kept;
}

/** Expand the top-level CHILDREN into the full source list, with each
 *  pseudomonorepo child followed by its apps/ sub-children. Order preserved. */
async function resolveSources(): Promise<Source[]> {
  const out: Source[] = [];
  for (const child of CHILDREN) {
    out.push({ slug: child.slug, dir: child.dir });
    out.push(...(await discoverSubChildren(child)));
  }
  return out;
}

async function walkMd(dir: string): Promise<string[]> {
  const out: string[] = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return out;
    throw err;
  }
  for (const e of entries) {
    if (e.name.startsWith('.') || e.name === 'node_modules') continue;
    const full = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walkMd(full)));
    else if (e.isFile() && e.name.endsWith('.md')) out.push(full);
  }
  return out;
}

function injectProvenance(text: string, fields: Record<string, string>): string {
  const fenceRe = /^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?([\s\S]*)$/;
  const match = text.match(fenceRe);
  const inject = Object.entries(fields)
    .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
    .join('\n');
  if (!match) {
    return `---\n${inject}\n---\n\n${text}`;
  }
  const [, fmText, body] = match;
  return `---\n${fmText}\n${inject}\n---\n${body}`;
}

async function syncCollection(
  collection: 'changelog' | 'context-v',
  outRoot: string,
  sources: Source[],
): Promise<{ total: number; perSource: Record<string, number> }> {
  let total = 0;
  const perSource: Record<string, number> = {};

  for (const src of sources) {
    const srcDir = resolve(PARENT_DIR, src.dir, collection);
    const files = await walkMd(srcDir);
    perSource[src.slug] = files.length;

    for (const abs of files) {
      const rel = relative(srcDir, abs);
      const text = await readFile(abs, 'utf8');
      const decorated = injectProvenance(text, {
        from: src.slug,
        from_path: `${collection}/${rel}`,
      });
      const outAbs = resolve(outRoot, src.slug, rel);
      await mkdir(dirname(outAbs), { recursive: true });
      await writeFile(outAbs, decorated, 'utf8');
      total++;
    }
  }

  return { total, perSource };
}

async function writeMarker(sources: Source[]): Promise<void> {
  const marker = `# Generated content — do not hand-edit

This directory is written by \`pnpm rollup:sync\` from each child submodule's
\`changelog/\` and \`context-v/\` directories — and from each \`apps/*\` inside
any child that is itself a pseudomonorepo. Edit at the source, then re-run
the sync. Files here carry \`from\` + \`from_path\` provenance frontmatter so
pages can show where each entry came from.

Sources rolled up:

${sources.map((s) => `- \`${s.slug}\``).join('\n')}

To refresh: \`pnpm rollup:sync\`
`;
  await writeFile(resolve(ROLLUP_ROOT, 'README.md'), marker, 'utf8');
}

async function main(): Promise<void> {
  const discovered = await resolveSources();
  console.log(`[rollup-sync] discovered: ${discovered.map((s) => s.slug).join(', ')}`);
  console.log('[rollup-sync] checking repository visibility (fails closed)…');
  const sources = await filterToPublic(discovered);

  console.log(`[rollup-sync] root:   ${ROLLUP_ROOT}`);
  console.log(`[rollup-sync] parent: ${PARENT_DIR}`);
  console.log(`[rollup-sync] sources: ${sources.map((s) => s.slug).join(', ')}`);
  console.log(`[rollup-sync] ${discovered.length - sources.length} of ${discovered.length} source(s) excluded`);

  await rm(ROLLUP_ROOT, { recursive: true, force: true });
  await mkdir(CHANGELOG_OUT, { recursive: true });
  await mkdir(CONTEXT_V_OUT, { recursive: true });

  const cl = await syncCollection('changelog', CHANGELOG_OUT, sources);
  const cv = await syncCollection('context-v', CONTEXT_V_OUT, sources);

  console.log(`[rollup-sync] changelog : ${cl.total} files`);
  for (const [slug, n] of Object.entries(cl.perSource)) console.log(`               · ${slug}: ${n}`);
  console.log(`[rollup-sync] context-v : ${cv.total} files`);
  for (const [slug, n] of Object.entries(cv.perSource)) console.log(`               · ${slug}: ${n}`);

  await writeMarker(sources);
  console.log('[rollup-sync] done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
