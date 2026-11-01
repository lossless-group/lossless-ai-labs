/**
 * Markdown bodies for the changelog and context-v detail pages, rendered through
 * LFM (@lossless-group/lfm). Pattern: lifted from the context-vigilance-kit splash.
 *
 * The union loader in content.config.ts stores each entry's raw body and no
 * rendered HTML, so Astro's `render()` returns nothing here. Pages parse the body
 * with `renderable` and render the MDAST tree via
 * components/markdown/AstroMarkdown.astro, so callouts, hex-code citations, code
 * blocks, and images all follow LFM.
 *
 * Wikilinks (`[[Name]]`, `[[path/Name.md]]`, `[[path/Name.md|alias]]`) are resolved
 * before parsing: a doc on this site links to its page, and anything else stays as
 * plain text. Rolled-up docs come from many repos, so a path can't be mapped to one
 * GitHub repo the way a single-repo splash can.
 */
import { getCollection } from 'astro:content';
import { parseMarkdown } from '@lossless-group/lfm';

type Index = Map<string, string>;
let index: Index | null = null;

/** Lowercased name or id → site path (relative to BASE_URL). */
async function siteIndex(): Promise<Index> {
  if (index) return index;
  index = new Map();
  for (const e of await getCollection('context-v')) {
    const href = `context-v/${e.id}/`;
    index.set(e.id.toLowerCase(), href);
    index.set(e.id.split('/').pop()!.toLowerCase(), href);
  }
  for (const e of await getCollection('changelog')) {
    index.set(e.id.toLowerCase(), `changelog/${e.id}/`);
  }
  return index;
}

export async function resolveWikilinks(body: string): Promise<string> {
  const idx = await siteIndex();
  const base = import.meta.env.BASE_URL;
  // Odd segments are code, where `[[Name]]` is literal text.
  return body
    .split(/(```[\s\S]*?```|`[^`\n]*`)/)
    .map((part, i) =>
      i % 2
        ? part
        : part.replace(/\[\[([^\]|]+?)(?:\|([^\]]+))?\]\]/g, (_m, rawTarget: string, alias?: string) => {
            const target = rawTarget.trim().replace(/^(\.\.\/)+/, '').replace(/^\.\//, '');
            const noExt = target.replace(/\.md$/i, '');
            const name = noExt.split('/').pop()!;
            // No alias? Show the filename the way an alias would: - and _ as spaces.
            const label = (alias ?? name.replace(/[-_]+/g, ' ')).trim();
            const key = noExt.replace(/^context-v\//, '').toLowerCase();
            const href = idx.get(key) ?? idx.get(name.toLowerCase());
            return href ? `[${label}](${base}${href})` : label;
          }),
    )
    .join('');
}

export async function renderable(body: string | undefined) {
  // The page header already shows the title, so drop a leading `# Title`.
  const text = (body ?? '').replace(/^\s*#\s+[^\n]*\n/, '');
  const tree = await parseMarkdown(await resolveWikilinks(text));
  const citations = ((tree as any)?.data?.citations?.ordered ?? []) as any[];
  return { tree, citations };
}
