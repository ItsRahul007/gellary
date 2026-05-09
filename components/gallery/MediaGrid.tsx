import { useGallery } from "@/context/GalleryContext";
import type { MediaItem } from "@/types/gallery";
import React, { useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  SectionList,
  Text,
  View,
} from "react-native";
import MediaCard from "./MediaCard";

const COLUMNS = 3;
const GAP = 2;
const SCREEN_W = Dimensions.get("window").width;
const CELL_SIZE = (SCREEN_W - GAP * (COLUMNS - 1)) / COLUMNS;

type MediaRow = (MediaItem | null)[];

interface DateSection {
  title: string;
  data: MediaRow[];
}

function getDateLabel(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const todayStr = now.toDateString();
  const yest = new Date(now);
  yest.setDate(yest.getDate() - 1);

  if (date.toDateString() === todayStr) return "Today";
  if (date.toDateString() === yest.toDateString()) return "Yesterday";

  const daysAgo = Math.floor((now.getTime() - date.getTime()) / 86_400_000);
  if (daysAgo < 7) {
    return date.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  }
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
      {row.map((item, colIndex) =>
        item ? (
          <MediaCard key={item.id} item={item} index={colIndex} />
        ) : (
          <View
            key={`empty-${colIndex}`}
            style={{
              width: CELL_SIZE,
              height: CELL_SIZE,
              marginRight: colIndex < COLUMNS - 1 ? GAP : 0,
              marginBottom: GAP,
            }}
          />
        ),
      )}
    </View>
  );
}

export default function MediaGrid() {
  const {
    filteredItems,
    loading,
    loadingMore,
    hasMore,
    refreshing,
    refresh,
    loadMore,
  } = useGallery();

  const sections = useMemo(() => buildSections(filteredItems), [filteredItems]);

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
    (row: MediaRow, index: number) => row.find(Boolean)?.id ?? `row-${index}`,
    [],
  );

  const ListFooter = useCallback(
    () =>
      loadingMore ? (
        <View style={{ paddingVertical: 20, alignItems: "center" }}>
          <ActivityIndicator size="small" color="#007AFF" />
        </View>
      ) : null,
    [loadingMore],
  );

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#000",
        }}
      >
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ color: "#8E8E93", marginTop: 12, fontSize: 14 }}>
          Loading media…
        </Text>
      </View>
    );
  }

  if (sections.length === 0) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#000",
        }}
      >
        <Text style={{ fontSize: 48, marginBottom: 16 }}>📷</Text>
        <Text style={{ color: "#fff", fontSize: 18, fontWeight: "600" }}>
          No media found
        </Text>
        <Text
          style={{
            color: "#8E8E93",
            fontSize: 14,
            marginTop: 8,
            textAlign: "center",
            paddingHorizontal: 32,
          }}
        >
          Try changing your filters or add some photos and videos.
        </Text>
      </View>
    );
  }

  return (
    <SectionList
      sections={sections}
      renderItem={renderItem}
      renderSectionHeader={renderSectionHeader}
      keyExtractor={keyExtractor}
      style={{ backgroundColor: "#000" }}
      contentContainerStyle={{ paddingBottom: 100 }}
      stickySectionHeadersEnabled={false}
      onEndReached={hasMore ? loadMore : undefined}
      onEndReachedThreshold={2}
      ListFooterComponent={<ListFooter />}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refresh}
          tintColor="#007AFF"
        />
      }
      removeClippedSubviews
      maxToRenderPerBatch={6}
      windowSize={10}
    />
  );
}
