/**
 * /llms.txt — index of changelog + context-v content for LLM consumers.
 *
 * Spec: https://llmstxt.org/
 *
 * The human-editable prose template lives at `src/llms/llms.md` (with token
 * documentation in `src/llms/README.md`). This file is the dumb assembler:
 * it loads the template, computes dynamic values, and substitutes tokens.
 * To tweak voice or framing, edit the markdown — not this file.
 *
 * Conformance note: until DNS lands for a custom domain, this splash deploys
 * under a path on GitHub Pages (`/lossless-ai-labs/`), so the file lives at
 * https://lossless-group.github.io/lossless-ai-labs/llms.txt. Tools pointed
 * explicitly at that URL still work; convention-based discovery (a crawler
 * GET-ing `/llms.txt` from the host root) starts working once
 * `astro.config.mjs` flips `base` to '/' and `site` to the custom domain.
 *
 * Ported from `ai-labs/memopop-ai/apps/memopop-site/src/pages/llms.txt.ts`
 * with two adaptations:
 *  1. URL construction uses `entry.id` directly (matches ai-labs's
 *     `${base}changelog/${entry.id}/` page route), not the synthesized
 *     `${from}/${slug}` form memopop uses.
 *  2. The site name comes from `SITE_NAME` (ai-labs's seo.ts shape), not
 *     `SITE_DEFAULTS.name`.
 */

import type { APIRoute } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';
import { SITE_NAME } from '@lib/seo';
import { readProvenance, pickDate, pickString } from '@lib/provenance';
import template from '../llms/llms.md?raw';

type ChangelogEntry = CollectionEntry<'changelog'>;
type ContextVEntry = CollectionEntry<'context-v'>;

export const GET: APIRoute = async () => {
  const site = import.meta.env.SITE ?? 'https://lossless-group.github.io';
  const base = import.meta.env.BASE_URL ?? '/';
  const root = new URL(base, site).toString().replace(/\/$/, '');

  // The ai-labs splash's `[...slug].astro` detail pages render every entry
  // without a publish/private gate. Match that here so the rendered HTML and
  // the LLM-facing index never disagree. If a gate is added to the page
  // templates, re-derive the predicate here and apply it.
  const changelog = await getCollection('changelog');
  const contextV = await getCollection('context-v');

  // ─── Group helpers ──────────────────────────────────────────────────────

  function groupByFrom<T extends ChangelogEntry | ContextVEntry>(
    entries: T[],
  ): Map<string, T[]> {
    const map = new Map<string, T[]>();
    for (const entry of entries) {
      const data = entry.data as Record<string, unknown>;
      const { from } = readProvenance(data, 'ai-labs');
      if (!map.has(from)) map.set(from, []);
      map.get(from)!.push(entry);
    }
    return map;
  }

  // ─── Changelog index — grouped by `from`, sorted by date desc ───────────

  const changelogByFrom = groupByFrom(changelog);
  const changelogFroms = [...changelogByFrom.keys()].sort();
  for (const from of changelogFroms) {
    changelogByFrom.get(from)!.sort((a, b) => {
      const da = pickDate(a.data as Record<string, unknown>, a.id)?.getTime() ?? 0;
      const db = pickDate(b.data as Record<string, unknown>, b.id)?.getTime() ?? 0;
      return db - da;
    });
  }

  const changelogLines: string[] = [];
  for (const from of changelogFroms) {
    changelogLines.push(`### ${from}`);
    changelogLines.push('');
    for (const entry of changelogByFrom.get(from)!) {
      const data = entry.data as Record<string, unknown>;
      const title = pickString(data, 'title') ?? entry.id;
      const url = `${root}/changelog/${entry.id}/`;
      const lede = pickString(data, 'lede', 'summary', 'description');
      changelogLines.push(lede ? `- [${title}](${url}): ${lede}` : `- [${title}](${url})`);
    }
    changelogLines.push('');
  }

  // ─── Context-v index — grouped by `from`, sorted alpha by title ─────────

  const contextVByFrom = groupByFrom(contextV);
  const contextVFroms = [...contextVByFrom.keys()].sort();
  for (const from of contextVFroms) {
    contextVByFrom.get(from)!.sort((a, b) => {
      const ta = (pickString(a.data as Record<string, unknown>, 'title') ?? a.id).toLowerCase();
      const tb = (pickString(b.data as Record<string, unknown>, 'title') ?? b.id).toLowerCase();
      return ta.localeCompare(tb);
    });
  }

  const contextVLines: string[] = [];
  for (const from of contextVFroms) {
    contextVLines.push(`### ${from}`);
    contextVLines.push('');
    for (const entry of contextVByFrom.get(from)!) {
      const data = entry.data as Record<string, unknown>;
      const title = pickString(data, 'title') ?? entry.id;
      const url = `${root}/context-v/${entry.id}/`;
      const lede = pickString(data, 'lede', 'summary', 'description', 'purpose');
      contextVLines.push(lede ? `- [${title}](${url}): ${lede}` : `- [${title}](${url})`);
    }
    contextVLines.push('');
  }

  // ─── Counts ─────────────────────────────────────────────────────────────

  const allFroms = new Set<string>([...changelogFroms, ...contextVFroms]);

  const tokens: Record<string, string> = {
    SITE_NAME,
    CHANGELOG_COUNT: String(changelog.length),
    CONTEXTV_COUNT: String(contextV.length),
    REPO_COUNT: String(allFroms.size),
    SEARCH_URL: `${root}/search/`,
    LLMS_FULL_URL: `${root}/llms-full.txt`,
    LLMS_INDEX_URL: `${root}/llms.txt`,
    CHANGELOG_INDEX: changelogLines.join('\n').trimEnd(),
    CONTEXTV_INDEX: contextVLines.join('\n').trimEnd(),
  };

  const body = template.replace(/\{\{(\w+)\}\}/g, (match, name) =>
    Object.prototype.hasOwnProperty.call(tokens, name) ? tokens[name] : match,
  );

  return new Response(body, {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
};
