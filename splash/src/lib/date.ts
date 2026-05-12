/**
 * Defensive date helpers. Lenient schemas + safeParse fallback means a date
 * field can arrive as Date, number, string, or undefined — `toDate` normalizes
 * to `Date | undefined` and never throws.
 */

export function toDate(v: unknown): Date | undefined {
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
}

export function formatDate(v: unknown, opts?: Intl.DateTimeFormatOptions): string {
  const d = toDate(v);
  if (!d) return '';
  return d.toLocaleDateString('en-US', opts ?? { year: 'numeric', month: 'short', day: '2-digit' });
}

export function isoDate(v: unknown): string {
  const d = toDate(v);
  return d ? d.toISOString().slice(0, 10) : '';
}
