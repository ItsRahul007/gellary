import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useCallback } from 'react';
import { Dimensions, Pressable, Text, View } from 'react-native';
import { useGallery } from '@/context/GalleryContext';
import type { MediaItem } from '@/types/gallery';

const COLUMNS = 3;
const GAP = 2;
const CELL_SIZE = (Dimensions.get('window').width - GAP * (COLUMNS - 1)) / COLUMNS;

function formatDuration(secs: number) {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface Props {
  item: MediaItem;
  index: number;
}

export default function MediaCard({ item, index }: Props) {
  const { isSelecting, selectedIds, toggleSelection, favoriteIds, getDisplayName } = useGallery();
  const isSelected = selectedIds.has(item.id);
  const isFavorite = favoriteIds.has(item.id);
  const isVideo = item.mediaType === 'video';

  const handlePress = useCallback(() => {
    if (isSelecting) {
      toggleSelection(item.id);
    } else {
      router.push({ pathname: '/viewer/[id]', params: { id: item.id } });
    }
  }, [isSelecting, item.id, toggleSelection]);

  const handleLongPress = useCallback(() => {
    toggleSelection(item.id);
  }, [item.id, toggleSelection]);

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={handleLongPress}
      style={{ width: CELL_SIZE, height: CELL_SIZE, marginRight: (index % COLUMNS) < COLUMNS - 1 ? GAP : 0, marginBottom: GAP }}
    >
      <Image
        source={{ uri: item.uri }}
        style={{ width: CELL_SIZE, height: CELL_SIZE }}
        contentFit="cover"
        recyclingKey={item.id}
        transition={150}
      />

      {/* Selection overlay */}
      {isSelecting && (
        <View className="absolute inset-0 bg-black/30">
          <View className={`absolute top-2 right-2 w-6 h-6 rounded-full border-2 items-center justify-center ${isSelected ? 'bg-primary border-primary' : 'border-white bg-transparent'}`}>
            {isSelected && <Text className="text-white text-xs font-bold">✓</Text>}
          </View>
        </View>
      )}

      {/* Video badge */}
      {isVideo && (
        <View className="absolute bottom-1 right-1 bg-black/60 rounded px-1 py-0.5 flex-row items-center gap-1">
          <Text className="text-white text-xs">▶</Text>
          {item.duration > 0 && (
            <Text className="text-white text-xs">{formatDuration(item.duration)}</Text>
          )}
        </View>
      )}

      {/* Favorite badge */}
      {isFavorite && !isSelecting && (
        <View className="absolute bottom-1 left-1">
          <Text className="text-yellow-400 text-sm">♥</Text>
        </View>
      )}
    </Pressable>
  );
}
