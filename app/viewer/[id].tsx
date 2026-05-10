import { router, useLocalSearchParams } from 'expo-router';
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { FlatList, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useGallery } from '@/context/GalleryContext';
import { getViewerItems } from '@/utils/viewerItems';
import EditModal from '@/components/viewer/EditModal';
import FileDetails from '@/components/viewer/FileDetails';
import ImageViewer from '@/components/viewer/ImageViewer';
import RenameModal from '@/components/viewer/RenameModal';
import VideoPlayer from '@/components/viewer/VideoPlayer';
import ViewerHeader from '@/components/viewer/ViewerHeader';
import type { MediaItem } from '@/types/gallery';

const { width: W, height: H } = Dimensions.get('window');

// Each page is exactly the screen size — memoised so only the current page
// re-renders when zoom state changes (all others keep panEnabled=false).
const MediaPage = memo(function MediaPage({
  item,
  onZoomChange,
  panEnabled,
  isActive,
}: {
  item: MediaItem;
  panEnabled: boolean;
  onZoomChange: (z: boolean) => void;
  isActive: boolean;
}) {
  return (
    <View style={{ width: W, height: H, backgroundColor: '#000' }}>
      {item.mediaType === 'video'
        ? <VideoPlayer uri={item.uri} isActive={isActive} />
        : <ImageViewer uri={item.uri} panEnabled={panEnabled} onZoomChange={onZoomChange} />}
    </View>
  );
});

export default function ViewerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { mediaItems, deleteItems, refresh } = useGallery();

  // Use the ordered list set by the caller (album or gallery), fall back to all media
  const viewerItems = getViewerItems().length > 0 ? getViewerItems() : mediaItems;

  const flatListRef = useRef<FlatList<MediaItem>>(null);
  const [currentId, setCurrentId] = useState(id);
  const [isZoomed, setIsZoomed] = useState(false);

  const [showDetails, setShowDetails] = useState(false);
  const [showRename, setShowRename] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const initialIndex = Math.max(0, viewerItems.findIndex(i => i.id === id));
  const currentItem = viewerItems.find(i => i.id === currentId);

  // Scroll to the opened item after the list renders.
  // initialScrollIndex has a well-known first-render bug, so we use scrollToIndex instead.
  useEffect(() => {
    if (initialIndex > 0 && flatListRef.current) {
      // Tiny delay lets the list complete its first layout pass
      const t = setTimeout(() => {
        flatListRef.current?.scrollToIndex({ index: initialIndex, animated: false });
      }, 50);
      return () => clearTimeout(t);
    }
  }, [initialIndex]);

  // Update the overlay (header, details) as the user pages
  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 51 });
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems[0]) {
      setCurrentId(viewableItems[0].item.id);
      setIsZoomed(false); // each new page starts unzoomed → FlatList paging re-enabled
    }
  });

  const renderItem = useCallback(
    ({ item }: { item: MediaItem }) => (
      <MediaPage
        item={item}
        panEnabled={item.id === currentId && isZoomed}
        onZoomChange={setIsZoomed}
        isActive={item.id === currentId}
      />
    ),
    [currentId, isZoomed],
  );

  const keyExtractor = useCallback((item: MediaItem) => item.id, []);

  const getItemLayout = useCallback(
    (_: any, index: number) => ({ length: W, offset: W * index, index }),
    [],
  );

  const handleDelete = useCallback(() => {
    setShowDetails(false);
    setShowDeleteModal(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    setShowDeleteModal(false);
    if (currentItem) {
      await deleteItems([currentItem.id]);
      router.back();
    }
  }, [currentItem, deleteItems]);

  const handleRename = useCallback(() => {
    setShowDetails(false);
    setTimeout(() => setShowRename(true), 300);
  }, []);

  if (!currentItem) return null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <View style={styles.root}>
        {/* RNGH FlatList — lives in the same gesture system as ImageViewer,
            so horizontal paging and pinch/pan gestures coordinate correctly */}
        <FlatList
          ref={flatListRef}
          data={viewerItems}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEnabled={!isZoomed}
          getItemLayout={getItemLayout}
          onViewableItemsChanged={onViewableItemsChanged.current}
          viewabilityConfig={viewabilityConfig.current}
          removeClippedSubviews
          maxToRenderPerBatch={3}
          windowSize={5}
        />

        {/* Overlay: floats above the paged list and tracks the visible item */}
        <ViewerHeader
          item={currentItem}
          onInfo={() => setShowDetails(true)}
          onEdit={() => setShowEdit(true)}
        />

        <FileDetails
          item={currentItem}
          visible={showDetails}
          onClose={() => setShowDetails(false)}
          onRename={handleRename}
          onDelete={handleDelete}
        />

        <RenameModal
          item={currentItem}
          visible={showRename}
          onClose={() => setShowRename(false)}
        />

        <EditModal
          item={currentItem}
          visible={showEdit}
          onClose={() => setShowEdit(false)}
          onSaved={refresh}
        />

        <Modal visible={showDeleteModal} transparent animationType="fade">
          <View className="flex-1 bg-black/60 items-center justify-center px-8">
            <View className="bg-surface rounded-2xl p-6 w-full">
              <Text className="text-white text-lg font-bold text-center mb-2">
                Delete this file?
              </Text>
              <Text className="text-gray-400 text-sm text-center mb-6">
                This action cannot be undone.
              </Text>
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
  root: { flex: 1, backgroundColor: '#000' },
});