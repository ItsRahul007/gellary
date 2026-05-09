import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import React, { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { useGallery } from '@/context/GalleryContext';

/** Replaces the normal app-bar while items are selected.
 *  Drop this in any screen that renders MediaCard items. */
export default function SelectionHeader() {
  const { selectedIds, clearSelection, selectAll, deleteItems, mediaItems } = useGallery();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const count = selectedIds.size;

  const handleShare = async () => {
    const uris = mediaItems.filter((i) => selectedIds.has(i.id)).map((i) => i.uri);
    for (const uri of uris) {
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri);
    }
  };

  const confirmDelete = async () => {
    setShowDeleteModal(false);
    await deleteItems([...selectedIds]);
  };

  return (
    <>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 8,
          paddingVertical: 6,
          backgroundColor: '#1C1C1E',
        }}
      >
        {/* Cancel */}
        <Pressable
          onPress={clearSelection}
          style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="close" size={22} color="#8E8E93" />
        </Pressable>

        {/* Count */}
        <Text style={{ flex: 1, color: '#fff', fontWeight: '600', fontSize: 16, textAlign: 'center' }}>
          {count} Selected
        </Text>

        {/* Select all */}
        <Pressable
          onPress={selectAll}
          style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="checkmark-done" size={22} color="#007AFF" />
        </Pressable>

        {/* Share */}
        <Pressable
          onPress={handleShare}
          style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="share-outline" size={22} color="#007AFF" />
        </Pressable>

        {/* Delete */}
        <Pressable
          onPress={() => setShowDeleteModal(true)}
          style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="trash-outline" size={22} color="#FF3B30" />
        </Pressable>
      </View>

      <Modal visible={showDeleteModal} transparent animationType="fade">
        <View className="flex-1 bg-black/60 items-center justify-center px-8">
          <View className="bg-surface rounded-2xl p-6 w-full">
            <Text className="text-white text-lg font-bold text-center">
              Delete {count} item{count !== 1 ? 's' : ''}?
            </Text>
            <Text className="text-gray-400 text-sm text-center mt-2">
              This action cannot be undone.
            </Text>
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