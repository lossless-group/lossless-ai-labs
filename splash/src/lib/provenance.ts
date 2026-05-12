/**
 * Provenance helpers for the rolled-up content collections.
 *
 * Every changelog and context-v entry rolled into this splash carries a
 * `from` (peer slug — `ai-labs`, `context-vigilance-kit`, `memopop-ai`,
 * `dididecks-ai`) and optionally `from_path` (where in the peer's tree the
 * entry came from). These helpers read those fields defensively (the lenient
 * schemas in `content.config.ts` mean they can arrive as strings, undefined,
 * or empty values) and pick the best-available date for sorting.
 *
 * Ported from `ai-labs/memopop-ai/apps/memopop-site/src/lib/provenance.ts`
 * with two adaptations: fallbackFrom default is 'ai-labs', and the
 * fromKindLabel set drops the memopop-specific 'app'/'package' labels.
 */

export interface ProvenanceMeta {
  from: string;
  fromKind: string;
  fromPath?: string;
}

export function readProvenance(
  data: Record<string, unknown>,
  fallbackFrom: string,
): ProvenanceMeta {
  const from = (typeof data.from === 'string' && data.from.trim()) ? data.from : fallbackFrom;
  const fromKind = (typeof data.from_kind === 'string' && data.from_kind.trim()) ? data.from_kind : 'peer';
  const fromPath = (typeof data.from_path === 'string' && data.from_path.trim()) ? data.from_path : undefined;
  return { from, fromKind, fromPath };
}

const DATE_KEYS = [
  'date_first_published',
  'date_authored_initial_draft',
  'date',
  'date_authored_current_draft',
  'date_modified',
  'date_last_updated',
  'date_created',
] as const;

export function pickDate(data: Record<string, unknown>, id: string): Date | null {
  for (const key of DATE_KEYS) {
    const v = data[key];
    if (v instanceof Date && !Number.isNaN(v.getTime())) return v;
  }
  // Last-ditch: parse a leading YYYY-MM-DD out of the entry id (changelog
  // filenames like `2026-05-11_02.md` carry the date in the slug).
  const m = id.match(/(\d{4}-\d{2}-\d{2})/);
  if (m) {
    const d = new Date(m[1]);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return null;
}

export function pickString(data: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const k of keys) {
    const v = data[k];
    if (typeof v === 'string' && v.trim()) return v;
  }
  return undefined;
}
