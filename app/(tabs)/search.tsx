import React, { useCallback } from 'react';
import { FlatList, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGallery } from '@/context/GalleryContext';
import MediaCard from '@/components/gallery/MediaCard';
import SearchBar from '@/components/gallery/SearchBar';
import FilterBar from '@/components/gallery/FilterBar';
import type { MediaItem } from '@/types/gallery';

const COLUMNS = 3;

export default function SearchScreen() {
  const { filteredItems, searchQuery } = useGallery();

  const renderItem = useCallback(({ item, index }: { item: MediaItem; index: number }) => (
    <MediaCard item={item} index={index} />
  ), []);

  const keyExtractor = useCallback((item: MediaItem) => item.id, []);

  return (
    <SafeAreaView className="flex-1 bg-black" edges={['top']}>
      <View className="px-4 pt-2 pb-1">
        <Text className="text-white text-2xl font-bold">Search</Text>
      </View>

      <SearchBar />
      <FilterBar />

      {filteredItems.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-5xl mb-4">🔍</Text>
          <Text className="text-white text-lg font-semibold">
            {searchQuery ? 'No results' : 'Search your media'}
          </Text>
          <Text className="text-gray-400 text-sm mt-2 text-center px-8">
            {searchQuery
              ? `No photos or videos match "${searchQuery}"`
              : 'Type a filename to search your gallery.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          numColumns={COLUMNS}
          contentContainerStyle={{ paddingBottom: 100 }}
          removeClippedSubviews
          maxToRenderPerBatch={18}
          windowSize={10}
        />
      )}
    </SafeAreaView>
  );
}
