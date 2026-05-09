import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import React, { useState } from 'react';
import { Alert, Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGallery } from '@/context/GalleryContext';

export default function SelectionBar() {
  const { selectedIds, isSelecting, clearSelection, selectAll, deleteItems, mediaItems } = useGallery();
  const { bottom } = useSafeAreaInsets();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  if (!isSelecting) return null;

  const count = selectedIds.size;

  const handleShare = async () => {
    const items = mediaItems.filter((i) => selectedIds.has(i.id));
    const uris = items.map((i) => i.uri);
    for (const uri of uris) {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      }
    }
  };

  const handleDelete = () => setShowDeleteModal(true);

  const confirmDelete = async () => {
    setShowDeleteModal(false);
    await deleteItems([...selectedIds]);
  };

  return (
    <>
      <View
        className="absolute bottom-0 left-0 right-0 bg-surface border-t border-surface-3 flex-row items-center justify-around px-4"
        style={{ paddingBottom: bottom + 8, paddingTop: 12 }}
      >
        <Pressable onPress={clearSelection} className="items-center gap-1 flex-1">
          <Ionicons name="close" size={22} color="#aaa" />
          <Text className="text-gray-400 text-xs">Cancel</Text>
        </Pressable>

        <View className="flex-1 items-center">
          <Text className="text-white font-semibold text-base">{count} Selected</Text>
        </View>

        <Pressable onPress={selectAll} className="items-center gap-1 flex-1">
          <Ionicons name="checkmark-done" size={22} color="#007AFF" />
          <Text className="text-primary text-xs">All</Text>
        </Pressable>

        <Pressable onPress={handleShare} className="items-center gap-1 flex-1">
          <Ionicons name="share-outline" size={22} color="#007AFF" />
          <Text className="text-primary text-xs">Share</Text>
        </Pressable>

        <Pressable onPress={handleDelete} className="items-center gap-1 flex-1">
          <Ionicons name="trash-outline" size={22} color="#FF3B30" />
          <Text className="text-red-500 text-xs">Delete</Text>
        </Pressable>
      </View>

      <Modal visible={showDeleteModal} transparent animationType="fade">
        <View className="flex-1 bg-black/60 items-center justify-center px-8">
          <View className="bg-surface rounded-2xl p-6 w-full">
            <Text className="text-white text-lg font-bold text-center">Delete {count} item{count !== 1 ? 's' : ''}?</Text>
            <Text className="text-gray-400 text-sm text-center mt-2">This action cannot be undone.</Text>
            <View className="flex-row gap-3 mt-6">
              <Pressable
                onPress={() => setShowDeleteModal(false)}
                className="flex-1 py-3 rounded-xl border border-surface-3 items-center"
              >
                <Text className="text-white font-medium">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={confirmDelete}
                className="flex-1 py-3 rounded-xl bg-red-600 items-center"
              >
                <Text className="text-white font-medium">Delete</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
