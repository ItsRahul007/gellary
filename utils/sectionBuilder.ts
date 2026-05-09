import type { MediaItem } from '@/types/gallery';

const COLUMNS = 3;

export type MediaRow = (MediaItem | null)[];
export interface DateSection { title: string; data: MediaRow[] }

export function getDateLabel(ts: number): string {
  const date = new Date(ts);
  const now  = new Date();
  const yest = new Date(now);
  yest.setDate(yest.getDate() - 1);
  if (date.toDateString() === now.toDateString())  return 'Today';
  if (date.toDateString() === yest.toDateString()) return 'Yesterday';
  const daysAgo = Math.floor((now.getTime() - date.getTime()) / 86_400_000);
  if (daysAgo < 7) {
    return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  }
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

export function toRows(items: MediaItem[]): MediaRow[] {
  const rows: MediaRow[] = [];
  for (let i = 0; i < items.length; i += COLUMNS) {
    rows.push([items[i] ?? null, items[i + 1] ?? null, items[i + 2] ?? null]);
  }
  return rows;
}

export function buildSections(items: MediaItem[]): DateSection[] {
  if (items.length === 0) return [];
  const groups = new Map<string, MediaItem[]>();
  for (const item of items) {
    const key = getDateLabel(item.modificationTime);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }
  return Array.from(groups.entries()).map(([title, dayItems]) => ({
    title,
    data: toRows(dayItems),
  }));
}

/**
 * Merges newly-arrived items into existing sections without rebuilding
 * sections that haven't changed. Unchanged sections keep the same object
 * reference so React.memo on row renderers can skip them entirely.
 */
export function mergeNewItems(newItems: MediaItem[], existing: DateSection[]): DateSection[] {
  const byDate = new Map<string, MediaItem[]>();
  for (const item of newItems) {
    const key = getDateLabel(item.modificationTime);
    if (!byDate.has(key)) byDate.set(key, []);
    byDate.get(key)!.push(item);
  }

  const result: DateSection[] = existing.map((section) => {
    const extra = byDate.get(section.title);
    if (!extra) return section; // same reference → no re-render
    const flat = section.data.flatMap((row) => row.filter(Boolean) as MediaItem[]);
    return { title: section.title, data: toRows([...flat, ...extra]) };
  });

  for (const [title, items] of byDate) {
    if (!existing.find((s) => s.title === title)) {
      result.push({ title, data: toRows(items) });
    }
  }

  return result;
}