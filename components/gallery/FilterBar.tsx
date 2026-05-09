import { useGallery } from "@/context/GalleryContext";
import type { FilterType } from "@/types/gallery";
import React from "react";
import { Pressable, Text, View } from "react-native";

const FILTERS: { label: string; value: FilterType }[] = [
  { label: "All", value: "all" },
  { label: "Photos", value: "photo" },
  { label: "Videos", value: "video" },
];

export default function FilterBar() {
  const { filterType, setFilterType } = useGallery();

  return (
    <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingVertical: 6, backgroundColor: "#000", borderBottomWidth: 0.5, borderBottomColor: "#3A3A3C" }}>
      {FILTERS.map((f) => {
        const active = filterType === f.value;
        return (
          <Pressable
            key={f.value}
            onPress={() => setFilterType(f.value)}
            style={{ paddingHorizontal: 16, paddingVertical: 5, borderRadius: 99, borderWidth: 1, borderColor: active ? "#007AFF" : "#3A3A3C", backgroundColor: active ? "#007AFF" : "transparent" }}
          >
            <Text style={{ fontSize: 13, fontWeight: "500", color: active ? "#fff" : "#8E8E93" }}>
              {f.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
