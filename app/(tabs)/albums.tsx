import { router } from 'expo-router';
import React, { useCallback } from 'react';
import { FlatList, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGallery } from '@/context/GalleryContext';
import AlbumCard from '@/components/gallery/AlbumCard';
import type { Album } from '@/types/gallery';

export default function AlbumsScreen() {
  const { albums, loading } = useGallery();

  const handlePress = useCallback((album: Album) => {
    router.push({ pathname: '/album/[id]', params: { id: album.id, title: album.title } });
  }, []);

  const renderItem = useCallback(({ item }: { item: Album }) => (
    <AlbumCard album={item} onPress={handlePress} />
  ), [handlePress]);

  const keyExtractor = useCallback((item: Album) => item.id, []);

  return (
    <SafeAreaView className="flex-1 bg-black" edges={['top']}>
      <View className="px-4 pt-2 pb-3">
        <Text className="text-white text-2xl font-bold">Albums</Text>
        <Text className="text-gray-500 text-sm">{albums.length} albums</Text>
      </View>

      {albums.length === 0 && !loading ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-4xl mb-3">🗂️</Text>
          <Text className="text-white text-lg font-semibold">No Albums</Text>
          <Text className="text-gray-400 text-sm mt-1">Your albums will appear here.</Text>
        </View>
      ) : (
        <FlatList
          data={albums}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          numColumns={2}
          contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}
