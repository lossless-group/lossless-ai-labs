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
 *  Some children are themselves pseudomonorepos with their own `apps/*` —
 *  each app gets auto-discovered at sync time and rolled up as a sub-child
 *  with slug `<child>/<app>`. The `apps/` subdir is inspected; any directory
 *  inside it that has `changelog/` or `context-v/` becomes a sub-child. */
const CHILDREN: { slug: string; dir: string }[] = [
  { slug: 'context-vigilance-kit', dir: 'context-vigilance-kit' },
  { slug: 'memopop-ai',            dir: 'memopop-ai' },
  { slug: 'dididecks-ai',          dir: 'dididecks-ai' },
  { slug: 'augment-it',            dir: 'augment-it' },
];

interface Source {
  /** Provenance slug — `<child>` or `<child>/<app>`. Used as the `from` field
   *  on every rolled-up file and as the on-disk path under the output root. */
  slug: string;
  /** Path relative to PARENT_DIR — e.g. `memopop-ai` or `memopop-ai/apps/memopop-native`. */
  dir: string;
}

async function discoverSubChildren(child: { slug: string; dir: string }): Promise<Source[]> {
  const appsDir = resolve(PARENT_DIR, child.dir, 'apps');
  let entries;
  try {
    entries = await readdir(appsDir, { withFileTypes: true });
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw err;
  }
  const out: Source[] = [];
  for (const e of entries) {
    if (!e.isDirectory() || e.name.startsWith('.') || e.name === 'node_modules') continue;
    const appDir = resolve(appsDir, e.name);
    const hasChangelog = await pathExists(resolve(appDir, 'changelog'));
    const hasContextV = await pathExists(resolve(appDir, 'context-v'));
    if (!hasChangelog && !hasContextV) continue;
    out.push({
      slug: `${child.slug}/${e.name}`,
      dir: `${child.dir}/apps/${e.name}`,
    });
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
  const sources = await resolveSources();

  console.log(`[rollup-sync] root:   ${ROLLUP_ROOT}`);
  console.log(`[rollup-sync] parent: ${PARENT_DIR}`);
  console.log(`[rollup-sync] sources: ${sources.map((s) => s.slug).join(', ')}`);

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
