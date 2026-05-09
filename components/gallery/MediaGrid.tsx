import { useGallery } from "@/context/GalleryContext";
import type { MediaItem } from "@/types/gallery";
import { buildSections, mergeNewItems } from "@/utils/sectionBuilder";
import type { DateSection, MediaRow } from "@/utils/sectionBuilder";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
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

// Memoised so SectionList only re-renders rows whose props actually changed
const RowItem = memo(function RowItem({ row }: { row: MediaRow }) {
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
});

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

  // Sections are kept as state and updated incrementally on pagination
  // so existing rows keep their array references and React.memo skips them.
  const [sections, setSections] = useState<DateSection[]>([]);
  const prevItemsRef = useRef<MediaItem[]>([]);

  useEffect(() => {
    const prev = prevItemsRef.current;
    const curr = filteredItems;
    prevItemsRef.current = curr;

    if (curr.length === 0) {
      setSections([]);
      return;
    }

    // Detect a pure append: same prefix, only new items at the tail.
    // Anything else (filter/sort change, refresh) triggers a full rebuild.
    const isAppend =
      curr.length > prev.length &&
      prev.length > 0 &&
      curr[0]?.id === prev[0]?.id &&
      curr[prev.length - 1]?.id === prev[prev.length - 1]?.id;

    if (isAppend) {
      const newItems = curr.slice(prev.length);
      setSections((existing) => mergeNewItems(newItems, existing));
    } else {
      setSections(buildSections(curr));
    }
  }, [filteredItems]);

  const renderItem = useCallback(
    ({ item }: { item: MediaRow }) => <RowItem row={item} />,
    [],
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: DateSection }) => (
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, backgroundColor: "#000" }}>
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

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#000" }}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ color: "#8E8E93", marginTop: 12, fontSize: 14 }}>Loading media…</Text>
      </View>
    );
  }

  if (sections.length === 0) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#000" }}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>📷</Text>
        <Text style={{ color: "#fff", fontSize: 18, fontWeight: "600" }}>No media found</Text>
        <Text style={{ color: "#8E8E93", fontSize: 14, marginTop: 8, textAlign: "center", paddingHorizontal: 32 }}>
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
      contentContainerStyle={{ paddingBottom: 140 }}
      stickySectionHeadersEnabled={false}
      onEndReached={hasMore ? loadMore : undefined}
      onEndReachedThreshold={2}
      ListFooterComponent={
        loadingMore ? (
          <View style={{ paddingVertical: 20, alignItems: "center" }}>
            <ActivityIndicator size="small" color="#007AFF" />
          </View>
        ) : null
      }
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#007AFF" />
      }
      removeClippedSubviews
      maxToRenderPerBatch={6}
      windowSize={10}
    />
  );
}