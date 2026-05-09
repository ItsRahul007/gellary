import { Image } from 'expo-image';
import React from 'react';
import { Dimensions, Pressable, Text, View } from 'react-native';
import type { Album } from '@/types/gallery';

const COLUMNS = 2;
const GAP = 12;
const CARD_SIZE = (Dimensions.get('window').width - GAP * (COLUMNS + 1)) / COLUMNS;

interface Props {
  album: Album;
  onPress: (album: Album) => void;
}

export default function AlbumCard({ album, onPress }: Props) {
  return (
    <Pressable
      onPress={() => onPress(album)}
      className="m-1.5 rounded-xl overflow-hidden"
      style={{ width: CARD_SIZE }}
    >
      {album.coverUri ? (
        <Image
          source={{ uri: album.coverUri }}
          style={{ width: CARD_SIZE, height: CARD_SIZE }}
          contentFit="cover"
        />
      ) : (
        <View style={{ width: CARD_SIZE, height: CARD_SIZE }} className="bg-surface-2 items-center justify-center">
          <Text className="text-4xl">🖼️</Text>
        </View>
      )}
      <View className="pt-2 pb-1">
        <Text className="text-white font-medium text-sm" numberOfLines={1}>{album.title}</Text>
        <Text className="text-gray-400 text-xs">{album.assetCount} items</Text>
      </View>
    </Pressable>
  );
}
