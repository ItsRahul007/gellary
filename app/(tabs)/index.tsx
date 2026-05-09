import FilterBar from "@/components/gallery/FilterBar";
import MediaGrid from "@/components/gallery/MediaGrid";
import SearchBar from "@/components/gallery/SearchBar";
import SelectionBar from "@/components/gallery/SelectionBar";
import SortMenu from "@/components/gallery/SortMenu";
import { useGallery } from "@/context/GalleryContext";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React, { useEffect } from "react";
import {
  AppState,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const AppLogo = () => (
  <Image
    source={require("@/assets/images/app-logo.png")}
    style={{ width: 96, height: 96, marginBottom: 24 }}
    contentFit="contain"
  />
);

export default function GalleryScreen() {
  const {
    hasPermission,
    needsDevBuild,
    requestPermission,
    recheckPermission,
    isSelecting,
    viewMode,
    setViewMode,
  } = useGallery();

  // Re-check permission when the user returns from the Settings app
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") recheckPermission();
    });
    return () => sub.remove();
  }, [recheckPermission]);

  if (needsDevBuild) {
    return (
      <SafeAreaView className="flex-1 bg-black items-center justify-center px-8">
        <AppLogo />
        <Text className="text-white text-2xl font-bold text-center mb-3">
          Development Build Required
        </Text>
        <Text className="text-gray-400 text-base text-center mb-6">
          Expo Go no longer supports full media library access on Android. Run
          the command below to create a local dev build:
        </Text>
        <View className="bg-surface-2 rounded-xl px-4 py-3 w-full mb-8">
          <Text className="text-green-400 font-mono text-sm text-center">
            npx expo run:android
          </Text>
        </View>
        <Text className="text-gray-600 text-xs text-center">
          Or use EAS Build for a shareable build.{"\n"}
          iOS users can continue using Expo Go.
        </Text>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView className="flex-1 bg-black items-center justify-center px-8">
        <AppLogo />
        <Text className="text-white text-2xl font-bold text-center mb-3">
          Access Your Gallery
        </Text>
        <Text className="text-gray-400 text-base text-center mb-8">
          Allow access to your photos and videos to use the gallery.
        </Text>
        <TouchableOpacity
          onPress={requestPermission}
          activeOpacity={0.7}
          style={{
            backgroundColor: "#007AFF",
            paddingHorizontal: 32,
            paddingVertical: 16,
            borderRadius: 16,
            alignItems: "center",
          }}
        >
          <Text className="text-white font-semibold text-base">
            Give Access
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center px-4 pt-2 pb-1">
        <Text className="text-white text-2xl font-bold flex-1">Gallery</Text>

        <Pressable
          onPress={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
          className="w-9 h-9 items-center justify-center rounded-full bg-surface-2 mr-2"
        >
          <Ionicons
            name={viewMode === "grid" ? "list" : "grid"}
            size={18}
            color="#aaa"
          />
        </Pressable>
        <SortMenu />
      </View>

      <SearchBar />
      <FilterBar />
      <MediaGrid />

      {isSelecting && <SelectionBar />}
    </SafeAreaView>
  );
}
