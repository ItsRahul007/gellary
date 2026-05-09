import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback } from 'react';
import { FlatList, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGallery } from '@/context/GalleryContext';
import MediaCard from '@/components/gallery/MediaCard';
import type { MediaItem } from '@/types/gallery';
import { setViewerItems } from '@/utils/viewerItems';

const COLUMNS = 3;

export default function FavoritesScreen() {
  const { favoriteItems } = useGallery();

  const handlePress = useCallback((item: MediaItem) => {
    setViewerItems(favoriteItems);
    router.push({ pathname: '/viewer/[id]', params: { id: item.id } });
  }, [favoriteItems]);

  const renderItem = useCallback(({ item, index }: { item: MediaItem; index: number }) => (
    <MediaCard item={item} index={index} onPress={handlePress} />
  ), [handlePress]);

  const keyExtractor = useCallback((item: MediaItem) => item.id, []);

  return (
    <SafeAreaView className="flex-1 bg-black" edges={['top']}>
      <View className="flex-row items-center px-4 pt-2 pb-3">
        <Ionicons name="heart" size={22} color="#FF3B30" style={{ marginRight: 8 }} />
        <Text className="text-white text-2xl font-bold">Favorites</Text>
        <Text className="text-gray-500 text-sm ml-auto">{favoriteItems.length} items</Text>
      </View>

      {favoriteItems.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-5xl mb-4">♡</Text>
          <Text className="text-white text-lg font-semibold">No Favorites Yet</Text>
          <Text className="text-gray-400 text-sm mt-2 text-center px-8">
            Tap the heart icon on any photo or video to add it here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={favoriteItems}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          numColumns={COLUMNS}
          contentContainerStyle={{ paddingBottom: 140 }}
          removeClippedSubviews
          maxToRenderPerBatch={18}
          windowSize={10}
        />
      )}
    </SafeAreaView>
  );
}
