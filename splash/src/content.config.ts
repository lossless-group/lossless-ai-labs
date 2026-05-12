import { defineCollection, z } from 'astro:content';
import { readFile, glob as fsGlob } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parseFrontmatter } from '@loaders/frontmatter';

// ─── Lenient preprocessors — never throw on author-written frontmatter ────

const lenientString = z.preprocess(
  (v) => (v === '' || v === null ? undefined : v),
  z.string().optional(),
);

const lenientStringArray = z.preprocess(
  (v) => {
    if (v === '' || v === null || v === undefined) return undefined;
    if (Array.isArray(v)) return v.map(String);
    if (typeof v === 'string') return [v];
    return v;
  },
  z.array(z.string()).optional(),
);

const lenientDate = z.preprocess(
  (v) => {
    if (v === undefined || v === null || v === '') return undefined;
    if (v instanceof Date) return Number.isNaN(v.getTime()) ? undefined : v;
    if (typeof v === 'number') {
      const d = new Date(v);
      return Number.isNaN(d.getTime()) ? undefined : d;
    }
    if (typeof v === 'string') {
      const t = v.trim();
      if (t === '' || t === '[]' || t === '~' || t === 'TBD' || t === 'tbd') return undefined;
      const d = new Date(t);
      return Number.isNaN(d.getTime()) ? undefined : d;
    }
    return undefined;
  },
  z.date().optional(),
);

const lenientNumber = z.preprocess(
  (v) => (v === '' || v === null ? undefined : v),
  z.number().optional(),
);

const lenientBoolean = z.preprocess(
  (v) => (v === '' || v === null ? undefined : v),
  z.boolean().optional(),
);

// ─── Paths ────────────────────────────────────────────────────────────────

const SPLASH_DIR = process.cwd();
const PARENT_DIR = resolve(SPLASH_DIR, '..');
const PARENT_CHANGELOG = resolve(PARENT_DIR, 'changelog');
const PARENT_CONTEXT_V = resolve(PARENT_DIR, 'context-v');
const ROLLUP_CHANGELOG = resolve(SPLASH_DIR, 'src', 'rollup', 'changelog');
const ROLLUP_CONTEXT_V = resolve(SPLASH_DIR, 'src', 'rollup', 'context-v');

// ─── Schema fields shared by both collections ─────────────────────────────

const provenanceFields = {
  /** Source slug — 'ai-labs' for parent-authored entries, child slug otherwise. */
  from: lenientString,
  /** Path within the originating repo's content root. */
  from_path: lenientString,
};

const changelogSchema = z
  .object({
    ...provenanceFields,
    title: lenientString,
    lede: lenientString,
    summary: lenientString,
    date: lenientDate,
    date_created: lenientDate,
    date_modified: lenientDate,
    date_first_published: lenientDate,
    entry: lenientString,
    authors: lenientStringArray,
    augmented_with: lenientStringArray,
    tags: lenientStringArray,
    publish: lenientBoolean,
    status: lenientString,
  })
  .passthrough();

const contextVSchema = z
  .object({
    ...provenanceFields,
    title: lenientString,
    lede: lenientString,
    description: lenientString,
    date: lenientDate,
    date_created: lenientDate,
    date_modified: lenientDate,
    date_authored_initial_draft: lenientDate,
    date_authored_current_draft: lenientDate,
    date_authored_final_draft: lenientDate,
    date_first_published: lenientDate,
    date_last_updated: lenientDate,
    at_semantic_version: lenientString,
    semantic_version: lenientString,
    status: lenientString,
    category: lenientString,
    tags: lenientStringArray,
    authors: lenientStringArray,
    augmented_with: lenientStringArray,
    publish: lenientBoolean,
  })
  .passthrough();

// ─── Union loader — merges parent's own dir + the rolled-up dir ──────────

interface UnionLoaderOpts {
  collectionName: 'changelog' | 'context-v';
  parentDir: string;
  parentProvenance: string;
  rollupDir: string;
}

function unionLoader(opts: UnionLoaderOpts) {
  return {
    name: `union-loader:${opts.collectionName}`,
    load: async ({ store, parseData, logger }: any): Promise<void> => {
      store.clear();
      let loaded = 0;
      let skipped = 0;

      const safeParse = async (id: string, data: unknown): Promise<Record<string, unknown>> => {
        try {
          return (await parseData({ id, data })) as Record<string, unknown>;
        } catch (err) {
          logger.warn?.(`[${opts.collectionName}] schema fallback for ${id}: ${(err as Error).message}`);
          return data as Record<string, unknown>;
        }
      };

      const ingest = async (root: string, fallbackProvenance: string, idPrefix: string) => {
        try {
          for await (const file of fsGlob('**/*.md', { cwd: root })) {
            if (file.toLowerCase() === 'readme.md') continue;
            const abs = resolve(root, file);
            const text = await readFile(abs, 'utf8');
            const { data, body } = parseFrontmatter(text);
            if (data.publish === false) { skipped++; continue; }

            const merged = {
              ...data,
              from: data.from ?? fallbackProvenance,
              from_path: data.from_path ?? file,
            };

            const id = `${idPrefix}${file.replace(/\.md$/, '')}`;
            const parsed = await safeParse(id, merged);
            store.set({ id, data: parsed, body });
            loaded++;
          }
        } catch (err) {
          if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
        }
      };

      // Parent-authored content lives directly at PARENT_DIR/<collection>/
      await ingest(opts.parentDir, opts.parentProvenance, '');
      // Rolled-up child content lives at splash/src/rollup/<collection>/<child>/
      await ingest(opts.rollupDir, 'rollup', '');

      logger.info?.(
        `[${opts.collectionName}] loaded ${loaded}, skipped ${skipped} (publish:false).`,
      );
    },
  };
}

// ─── Curated product cards (local content) ───────────────────────────────

const productHighlights = defineCollection({
  loader: {
    name: 'product-highlights-loader',
    load: async ({ store, parseData, logger }: any) => {
      store.clear();
      const dir = resolve(SPLASH_DIR, 'src', 'content', 'product-highlights');
      let count = 0;
      try {
        for await (const file of fsGlob('*.md', { cwd: dir })) {
          const abs = resolve(dir, file);
          const text = await readFile(abs, 'utf8');
          const { data, body } = parseFrontmatter(text);
          const id = file.replace(/\.md$/, '');
          try {
            const parsed = await parseData({ id, data });
            store.set({ id, data: parsed, body });
          } catch (err) {
            logger.warn?.(`[product-highlights] fallback for ${id}: ${(err as Error).message}`);
            store.set({ id, data, body });
          }
          count++;
        }
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
      }
      logger.info?.(`[product-highlights] loaded ${count}.`);
    },
  },
  schema: z
    .object({
      title: lenientString,
      lede: lenientString,
      slug: lenientString,
      repo: lenientString,
      status: lenientString,
      label: lenientString,
      order: lenientNumber,
      tags: lenientStringArray,
    })
    .passthrough(),
});

// ─── Collections ──────────────────────────────────────────────────────────

const changelog = defineCollection({
  loader: unionLoader({
    collectionName: 'changelog',
    parentDir: PARENT_CHANGELOG,
    parentProvenance: 'ai-labs',
    rollupDir: ROLLUP_CHANGELOG,
  }),
  schema: changelogSchema,
});

const contextV = defineCollection({
  loader: unionLoader({
    collectionName: 'context-v',
    parentDir: PARENT_CONTEXT_V,
    parentProvenance: 'ai-labs',
    rollupDir: ROLLUP_CONTEXT_V,
  }),
  schema: contextVSchema,
});

export const collections = {
  'product-highlights': productHighlights,
  changelog,
  'context-v': contextV,
};
