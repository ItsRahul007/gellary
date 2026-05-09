import MediaCard from "@/components/gallery/MediaCard";
import { useGallery } from "@/context/GalleryContext";
import type { MediaItem, MediaType } from "@/types/gallery";
import { Ionicons } from "@expo/vector-icons";
import * as MediaLibrary from "expo-media-library";
import { router, useLocalSearchParams } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  RefreshControl,
  SectionList,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const COLUMNS = 3;
const GAP = 2;
const SCREEN_W = Dimensions.get("window").width;
const CELL_SIZE = (SCREEN_W - GAP * (COLUMNS - 1)) / COLUMNS;
const PAGE_SIZE = 100;

type MediaRow = (MediaItem | null)[];
interface DateSection {
  title: string;
  data: MediaRow[];
}

function getDateLabel(ts: number): string {
  const date = new Date(ts);
  const now = new Date();
  const yest = new Date(now);
  yest.setDate(yest.getDate() - 1);
  if (date.toDateString() === now.toDateString()) return "Today";
  if (date.toDateString() === yest.toDateString()) return "Yesterday";
  const daysAgo = Math.floor((now.getTime() - date.getTime()) / 86_400_000);
  if (daysAgo < 7)
    return date.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function buildSections(items: MediaItem[]): DateSection[] {
  if (items.length === 0) return [];
  const groups = new Map<string, MediaItem[]>();
  for (const item of items) {
    const key = getDateLabel(item.modificationTime);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }
  return Array.from(groups.entries()).map(([title, dayItems]) => {
    const rows: MediaRow[] = [];
    for (let i = 0; i < dayItems.length; i += COLUMNS) {
      rows.push([
        dayItems[i] ?? null,
        dayItems[i + 1] ?? null,
        dayItems[i + 2] ?? null,
      ]);
    }
    return { title, data: rows };
  });
}

function RowItem({ row }: { row: MediaRow }) {
  return (
    <View style={{ flexDirection: "row" }}>
      {row.map((item, col) =>
        item ? (
          <MediaCard key={item.id} item={item} index={col} />
        ) : (
          <View
            key={`e-${col}`}
            style={{
              width: CELL_SIZE,
              height: CELL_SIZE,
              marginRight: col < COLUMNS - 1 ? GAP : 0,
              marginBottom: GAP,
            }}
          />
        ),
      )}
    </View>
  );
}

export default function AlbumScreen() {
  const { id, title: titleParam } = useLocalSearchParams<{
    id: string;
    title: string;
  }>();
  const { mergeItems } = useGallery();

  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const cursorRef = useRef<string | undefined>(undefined);
  const fetchingRef = useRef(false);

  const loadItems = useCallback(
    async (reset = true) => {
      if (fetchingRef.current) return;
      fetchingRef.current = true;
      if (reset) {
        setLoading(true);
        cursorRef.current = undefined;
      } else setLoadingMore(true);

      try {
        const result = await MediaLibrary.getAssetsAsync({
          first: PAGE_SIZE,
          after: reset ? undefined : cursorRef.current,
          album: id,
          mediaType: [
            MediaLibrary.MediaType.photo,
            MediaLibrary.MediaType.video,
          ],
          sortBy: [MediaLibrary.SortBy.creationTime],
        });

        const mapped: MediaItem[] = result.assets.map((a) => ({
          id: a.id,
          uri: a.uri,
          filename: a.filename,
          mediaType: a.mediaType as MediaType,
          width: a.width,
          height: a.height,
          duration: a.duration,
          fileSize: 0,
          creationTime: a.creationTime,
          modificationTime: a.modificationTime,
          albumId: a.albumId,
        }));

        if (reset) setItems(mapped);
        else setItems((prev) => [...prev, ...mapped]);

        // Make items available to the viewer via gallery context
        mergeItems(mapped);

        cursorRef.current = result.endCursor;
        setHasMore(result.hasNextPage);
      } catch (e) {
        console.error("album load error", e);
      } finally {
        fetchingRef.current = false;
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [id, mergeItems],
  );

  useEffect(() => {
    loadItems(true);
  }, [loadItems]);

  const sections = useMemo(() => buildSections(items), [items]);

  const renderItem = useCallback(
    ({ item }: { item: MediaRow }) => <RowItem row={item} />,
    [],
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: DateSection }) => (
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 8,
          backgroundColor: "#000",
        }}
      >
        <Text style={{ color: "#fff", fontSize: 15, fontWeight: "600" }}>
          {section.title}
        </Text>
      </View>
    ),
    [],
  );

  const keyExtractor = useCallback(
    (row: MediaRow, i: number) => row.find(Boolean)?.id ?? `r-${i}`,
    [],
  );

  if (loading) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: "#000" }}
        edges={["top"]}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingVertical: 12,
          }}
        >
          <Pressable onPress={() => router.back()} style={{ marginRight: 12 }}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </Pressable>
          <Text
            style={{ color: "#fff", fontSize: 18, fontWeight: "700", flex: 1 }}
            numberOfLines={1}
          >
            {titleParam ?? "Album"}
          </Text>
        </View>
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }} edges={["top"]}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}
      >
        <Pressable onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text
            style={{ color: "#fff", fontSize: 18, fontWeight: "700" }}
            numberOfLines={1}
          >
            {titleParam ?? "Album"}
          </Text>
        </View>
      </View>

      {sections.length === 0 ? (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <Text style={{ color: "#8E8E93", fontSize: 16 }}>
            This album is empty
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          keyExtractor={keyExtractor}
          style={{ backgroundColor: "#000" }}
          contentContainerStyle={{ paddingBottom: 40 }}
          stickySectionHeadersEnabled={false}
          onEndReached={hasMore ? () => loadItems(false) : undefined}
          onEndReachedThreshold={1.5}
          ListFooterComponent={
            loadingMore ? (
              <View style={{ paddingVertical: 20, alignItems: "center" }}>
                <ActivityIndicator size="small" color="#007AFF" />
              </View>
            ) : null
          }
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={() => loadItems(true)}
              tintColor="#007AFF"
            />
          }
          removeClippedSubviews
          maxToRenderPerBatch={6}
          windowSize={10}
        />
      )}
    </SafeAreaView>
  );
}
