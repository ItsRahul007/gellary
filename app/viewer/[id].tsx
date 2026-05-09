import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useGallery } from '@/context/GalleryContext';
import EditModal from '@/components/viewer/EditModal';
import FileDetails from '@/components/viewer/FileDetails';
import ImageViewer from '@/components/viewer/ImageViewer';
import RenameModal from '@/components/viewer/RenameModal';
import VideoPlayer from '@/components/viewer/VideoPlayer';
import ViewerHeader from '@/components/viewer/ViewerHeader';

export default function ViewerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { mediaItems, deleteItems, refresh } = useGallery();
  const [showDetails, setShowDetails] = useState(false);
  const [showRename, setShowRename] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const item = mediaItems.find((i) => i.id === id);

  const handleDelete = useCallback(() => {
    setShowDetails(false);
    setShowDeleteModal(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    setShowDeleteModal(false);
    if (item) {
      await deleteItems([item.id]);
      router.back();
    }
  }, [item, deleteItems]);

  const handleRename = useCallback(() => {
    setShowDetails(false);
    setTimeout(() => setShowRename(true), 300);
  }, []);

  if (!item) return null;

  const isVideo = item.mediaType === 'video';

  return (
    <GestureHandlerRootView style={styles.root}>
      <View style={styles.root}>
        {isVideo ? <VideoPlayer uri={item.uri} /> : <ImageViewer uri={item.uri} />}

        <ViewerHeader
          item={item}
          onInfo={() => setShowDetails(true)}
          onEdit={() => setShowEdit(true)}
        />

        <FileDetails
          item={item}
          visible={showDetails}
          onClose={() => setShowDetails(false)}
          onRename={handleRename}
          onDelete={handleDelete}
        />

        <RenameModal
          item={item}
          visible={showRename}
          onClose={() => setShowRename(false)}
        />

        <EditModal
          item={item}
          visible={showEdit}
          onClose={() => setShowEdit(false)}
          onSaved={refresh}
        />

        <Modal visible={showDeleteModal} transparent animationType="fade">
          <View className="flex-1 bg-black/60 items-center justify-center px-8">
            <View className="bg-surface rounded-2xl p-6 w-full">
              <Text className="text-white text-lg font-bold text-center mb-2">Delete this file?</Text>
              <Text className="text-gray-400 text-sm text-center mb-6">This action cannot be undone.</Text>
              <View className="flex-row gap-3">
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
                  <Text className="text-white font-semibold">Delete</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
});
