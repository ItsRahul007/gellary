import type { MediaItem } from '@/types/gallery';

// Module-level cache — set immediately before router.push('/viewer/[id]').
// The viewer reads this on mount to know which ordered list to page through.
// Cleared when navigating from the main gallery (so filteredItems takes over).

let _items: MediaItem[] = [];

export function setViewerItems(items: MediaItem[]) {
  _items = items;
}

export function getViewerItems(): MediaItem[] {
  return _items;
}