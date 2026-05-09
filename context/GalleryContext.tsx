import {
  type Album,
  type FilterType,
  type MediaItem,
  type MediaType,
  type SortBy,
  type SortOrder,
  type ViewMode,
} from "@/types/gallery";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as MediaLibrary from "expo-media-library";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Linking } from "react-native";

const FAVORITES_KEY = "@gallery_favorites";
const CUSTOM_NAMES_KEY = "@gallery_custom_names";
const PAGE_SIZE = 150;

interface GalleryContextType {
  mediaItems: MediaItem[];
  albums: Album[];
  loading: boolean;
  refreshing: boolean;
  hasPermission: boolean | null;
  needsDevBuild: boolean;
  filterType: FilterType;
  sortBy: SortBy;
  sortOrder: SortOrder;
  searchQuery: string;
  viewMode: ViewMode;
  selectedIds: Set<string>;
  isSelecting: boolean;
  favoriteIds: Set<string>;
  customNames: Record<string, string>;
  filteredItems: MediaItem[];
  favoriteItems: MediaItem[];
  hasMore: boolean;
  loadingMore: boolean;
  requestPermission: () => Promise<void>;
  recheckPermission: () => Promise<void>;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  setFilterType: (t: FilterType) => void;
  setSortBy: (s: SortBy) => void;
  setSortOrder: (o: SortOrder) => void;
  setSearchQuery: (q: string) => void;
  setViewMode: (m: ViewMode) => void;
  toggleFavorite: (id: string) => void;
  toggleSelection: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  setCustomName: (id: string, name: string) => Promise<void>;
  getDisplayName: (item: MediaItem) => string;
  deleteItems: (ids: string[]) => Promise<void>;
  mergeItems: (items: MediaItem[]) => void;
}

const GalleryContext = createContext<GalleryContextType | null>(null);

export function GalleryProvider({ children }: { children: React.ReactNode }) {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [needsDevBuild, setNeedsDevBuild] = useState(false);
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelecting, setIsSelecting] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [customNames, setCustomNames] = useState<Record<string, string>>({});
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const endCursorRef = useRef<string | undefined>(undefined);
  const isFetchingRef = useRef(false);

  useEffect(() => {
    loadPersistedData();
    checkPermission();
  }, []);

  async function loadPersistedData() {
    try {
      const [favStr, namesStr] = await Promise.all([
        AsyncStorage.getItem(FAVORITES_KEY),
        AsyncStorage.getItem(CUSTOM_NAMES_KEY),
      ]);
      if (favStr) setFavoriteIds(new Set(JSON.parse(favStr)));
      if (namesStr) setCustomNames(JSON.parse(namesStr));
    } catch {}
  }

  async function checkPermission() {
    try {
      const { status } = await MediaLibrary.getPermissionsAsync(false, [
        "photo",
        "video",
      ]);
      if (status === "granted") {
        setHasPermission(true);
        loadMedia();
      } else {
        setHasPermission(false);
        setLoading(false);
      }
    } catch (e: any) {
      const msg: string = e?.message ?? "";
      if (msg.includes("Expo Go") || msg.includes("development build")) {
        setNeedsDevBuild(true);
      }
      setHasPermission(false);
      setLoading(false);
    }
  }

  const requestPermission = useCallback(async () => {
    try {
      const result = await MediaLibrary.requestPermissionsAsync(false, [
        "photo",
        "video",
      ]);
      if (result.status === "granted") {
        setHasPermission(true);
        loadMedia();
      } else if (!result.canAskAgain) {
        Linking.openSettings();
      } else {
        setHasPermission(false);
      }
    } catch (e: any) {
      console.log(e);
      const msg: string = e?.message ?? "";
      if (msg.includes("Expo Go") || msg.includes("development build")) {
        setNeedsDevBuild(true);
      }
      setHasPermission(false);
    }
  }, []);

  // Called when the app returns to foreground (e.g. after user grants in Settings)
  const recheckPermission = useCallback(async () => {
    console.log("Running recheckPermission");

    try {
      const { status } = await MediaLibrary.getPermissionsAsync(false, [
        "photo",
        "video",
      ]);
      if (status === "granted") {
        setHasPermission(true);
        loadMedia();
      }
    } catch {}
  }, []);

  async function loadMedia(reset = true) {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    if (reset) {
      setLoading(true);
      endCursorRef.current = undefined;
    } else {
      setLoadingMore(true);
    }

    try {
      const result = await MediaLibrary.getAssetsAsync({
        first: PAGE_SIZE,
        after: reset ? undefined : endCursorRef.current,
        mediaType: [MediaLibrary.MediaType.photo, MediaLibrary.MediaType.video],
        sortBy: [MediaLibrary.SortBy.modificationTime],
      });

      const items: MediaItem[] = await Promise.all(
        result.assets.map(async (asset) => {
          let fileSize = 0;
          try {
            const info = await MediaLibrary.getAssetInfoAsync(asset.id, {
              shouldDownloadFromNetwork: false,
            });
            fileSize = (info as any).fileSize ?? 0;
          } catch {}
          return {
            id: asset.id,
            uri: asset.uri,
            filename: asset.filename,
            mediaType: asset.mediaType as MediaType,
            width: asset.width,
            height: asset.height,
            duration: asset.duration,
            fileSize,
            creationTime: asset.creationTime,
            modificationTime: asset.modificationTime,
            albumId: asset.albumId,
          };
        }),
      );

      if (reset) {
        setMediaItems(items);
      } else {
        setMediaItems((prev) => [...prev, ...items]);
      }

      endCursorRef.current = result.endCursor;
      setHasMore(result.hasNextPage);

      // Only reload albums on first load / refresh, not on pagination
      if (reset) {
        const albumsResult = await MediaLibrary.getAlbumsAsync({
          includeSmartAlbums: true,
        });
        const albumsWithCovers = await Promise.all(
          albumsResult
            .filter((a) => a.assetCount > 0)
            .map(async (a) => {
              try {
                const assets = await MediaLibrary.getAssetsAsync({
                  first: 1,
                  album: a.id,
                  mediaType: [
                    MediaLibrary.MediaType.photo,
                    MediaLibrary.MediaType.video,
                  ],
                });
                return {
                  id: a.id,
                  title: a.title,
                  assetCount: a.assetCount,
                  coverUri: assets.assets[0]?.uri,
                };
              } catch {
                return { id: a.id, title: a.title, assetCount: a.assetCount };
              }
            }),
        );
        setAlbums(albumsWithCovers);
      }
    } catch (e) {
      console.error("loadMedia error", e);
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }

  const loadMore = useCallback(async () => {
    if (!hasMore || isFetchingRef.current) return;
    await loadMedia(false);
  }, [hasMore]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await loadMedia(true);
  }, []);

  const mergeItems = useCallback((incoming: MediaItem[]) => {
    setMediaItems((prev) => {
      const existingIds = new Set(prev.map((i) => i.id));
      const novel = incoming.filter((i) => !existingIds.has(i.id));
      return novel.length > 0 ? [...prev, ...novel] : prev;
    });
  }, []);

  const toggleFavorite = useCallback(async (id: string) => {
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify([...next]));
      return next;
    });
  }, []);

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setIsSelecting(next.size > 0);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    const allIds = new Set(mediaItems.map((i) => i.id));
    setSelectedIds(allIds);
    setIsSelecting(true);
  }, [mediaItems]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setIsSelecting(false);
  }, []);

  const setCustomName = useCallback(async (id: string, name: string) => {
    setCustomNames((prev) => {
      const next = { ...prev, [id]: name };
      AsyncStorage.setItem(CUSTOM_NAMES_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const getDisplayName = useCallback(
    (item: MediaItem) => customNames[item.id] ?? item.filename,
    [customNames],
  );

  const deleteItems = useCallback(
    async (ids: string[]) => {
      try {
        await MediaLibrary.deleteAssetsAsync(ids);
        setMediaItems((prev) => prev.filter((i) => !ids.includes(i.id)));
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          ids.forEach((id) => next.delete(id));
          AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify([...next]));
          return next;
        });
        setCustomNames((prev) => {
          const next = { ...prev };
          ids.forEach((id) => delete next[id]);
          AsyncStorage.setItem(CUSTOM_NAMES_KEY, JSON.stringify(next));
          return next;
        });
        clearSelection();
      } catch (e) {
        console.error("delete error", e);
      }
    },
    [clearSelection],
  );

  const filteredItems = useMemo(() => {
    let items = [...mediaItems];
    if (filterType !== "all")
      items = items.filter((i) => i.mediaType === filterType);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter((i) =>
        (customNames[i.id] ?? i.filename).toLowerCase().includes(q),
      );
    }
    items.sort((a, b) => {
      let cmp = 0;
      if (sortBy === "date") cmp = a.modificationTime - b.modificationTime;
      else if (sortBy === "name")
        cmp = (customNames[a.id] ?? a.filename).localeCompare(
          customNames[b.id] ?? b.filename,
        );
      else if (sortBy === "size") cmp = a.fileSize - b.fileSize;
      return sortOrder === "asc" ? cmp : -cmp;
    });
    return items;
  }, [mediaItems, filterType, searchQuery, sortBy, sortOrder, customNames]);

  const favoriteItems = useMemo(
    () => filteredItems.filter((i) => favoriteIds.has(i.id)),
    [filteredItems, favoriteIds],
  );

  return (
    <GalleryContext.Provider
      value={{
        mediaItems,
        albums,
        loading,
        refreshing,
        hasPermission,
        needsDevBuild,
        filterType,
        sortBy,
        sortOrder,
        searchQuery,
        viewMode,
        selectedIds,
        isSelecting,
        favoriteIds,
        customNames,
        filteredItems,
        favoriteItems,
        hasMore,
        loadingMore,
        requestPermission,
        recheckPermission,
        refresh,
        loadMore,
        setFilterType,
        setSortBy,
        setSortOrder,
        setSearchQuery,
        setViewMode,
        toggleFavorite,
        toggleSelection,
        selectAll,
        clearSelection,
        setCustomName,
        getDisplayName,
        deleteItems,
        mergeItems,
      }}
    >
      {children}
    </GalleryContext.Provider>
  );
}

export function useGallery() {
  const ctx = useContext(GalleryContext);
  if (!ctx) throw new Error("useGallery must be used within GalleryProvider");
  return ctx;
}
