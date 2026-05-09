export type MediaType = 'photo' | 'video';
export type SortBy = 'date' | 'name' | 'size';
export type SortOrder = 'asc' | 'desc';
export type FilterType = 'all' | 'photo' | 'video';
export type ViewMode = 'grid' | 'list';

export interface MediaItem {
  id: string;
  uri: string;
  filename: string;
  mediaType: MediaType;
  width: number;
  height: number;
  duration: number;
  fileSize: number;
  creationTime: number;
  modificationTime: number;
  albumId?: string;
  albumTitle?: string;
}

export interface Album {
  id: string;
  title: string;
  assetCount: number;
  coverUri?: string;
}
