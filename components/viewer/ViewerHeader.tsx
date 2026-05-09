import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGallery } from '@/context/GalleryContext';
import type { MediaItem } from '@/types/gallery';

interface Props {
  item: MediaItem;
  onInfo: () => void;
  onEdit: () => void;
}

export default function ViewerHeader({ item, onInfo, onEdit }: Props) {
  const { favoriteIds, toggleFavorite, getDisplayName } = useGallery();
  const { top } = useSafeAreaInsets();
  const isFavorite = favoriteIds.has(item.id);

  const handleShare = async () => {
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(item.uri);
    }
  };

  return (
    <View
      className="absolute top-0 left-0 right-0 flex-row items-center px-4 bg-black/50 z-10"
      style={{ paddingTop: top + 8, paddingBottom: 12 }}
    >
      <Pressable
        onPress={() => router.back()}
        className="w-9 h-9 items-center justify-center rounded-full bg-black/40 mr-3"
      >
        <Ionicons name="chevron-back" size={22} color="white" />
      </Pressable>

      <Text className="text-white font-semibold text-base flex-1" numberOfLines={1}>
        {getDisplayName(item)}
      </Text>

      <View className="flex-row gap-2">
        {/* Edit only makes sense for photos */}
        {item.mediaType === 'photo' && (
          <Pressable
            onPress={onEdit}
            className="w-9 h-9 items-center justify-center rounded-full bg-black/40"
          >
            <Ionicons name="pencil-outline" size={20} color="white" />
          </Pressable>
        )}

        <Pressable
          onPress={() => toggleFavorite(item.id)}
          className="w-9 h-9 items-center justify-center rounded-full bg-black/40"
        >
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={20}
            color={isFavorite ? '#FF3B30' : 'white'}
          />
        </Pressable>

        <Pressable
          onPress={handleShare}
          className="w-9 h-9 items-center justify-center rounded-full bg-black/40"
        >
          <Ionicons name="share-outline" size={20} color="white" />
        </Pressable>

        <Pressable
          onPress={onInfo}
          className="w-9 h-9 items-center justify-center rounded-full bg-black/40"
        >
          <Ionicons name="information-circle-outline" size={20} color="white" />
        </Pressable>
      </View>
    </View>
  );
}