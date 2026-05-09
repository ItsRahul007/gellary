import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGallery } from '@/context/GalleryContext';
import type { MediaItem } from '@/types/gallery';

function formatBytes(bytes: number) {
  if (bytes === 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDuration(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface Props {
  item: MediaItem;
  visible: boolean;
  onClose: () => void;
  onRename: () => void;
  onDelete: () => void;
}

const SHEET_HEIGHT = 480;
const OPEN  = { duration: 280, easing: Easing.out(Easing.cubic) } as const;
const CLOSE = { duration: 220, easing: Easing.in(Easing.cubic)  } as const;

export default function FileDetails({ item, visible, onClose, onRename, onDelete }: Props) {
  const { favoriteIds, toggleFavorite, getDisplayName } = useGallery();
  const { bottom } = useSafeAreaInsets();
  // Start off-screen; animate in/out via visible prop
  const translateY = useSharedValue(SHEET_HEIGHT);
  const isFavorite = favoriteIds.has(item.id);

  useEffect(() => {
    translateY.value = withTiming(visible ? 0 : SHEET_HEIGHT, visible ? OPEN : CLOSE);
  }, [visible]);

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY > 0) translateY.value = e.translationY;
    })
    .onEnd((e) => {
      if (e.translationY > 100) {
        translateY.value = withTiming(SHEET_HEIGHT, CLOSE);
        runOnJS(onClose)();
      } else {
        translateY.value = withTiming(0, OPEN);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const rows = [
    { label: 'File name', value: getDisplayName(item) },
    { label: 'Type', value: item.mediaType === 'photo' ? 'Photo' : 'Video' },
    { label: 'Size', value: formatBytes(item.fileSize) },
    ...(item.mediaType === 'photo'
      ? [{ label: 'Dimensions', value: `${item.width} × ${item.height}` }]
      : [
          { label: 'Duration', value: formatDuration(item.duration) },
          { label: 'Resolution', value: `${item.width} × ${item.height}` },
        ]),
    { label: 'Created', value: formatDate(item.creationTime) },
    { label: 'Modified', value: formatDate(item.modificationTime) },
  ];

  return (
    <>
      {/* Backdrop — only blocks interaction when sheet is open */}
      {visible && (
        <Pressable
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 20 }}
          onPress={onClose}
        />
      )}

      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            animatedStyle,
            {
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: '#1C1C1E',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingBottom: bottom + 16,
              zIndex: 30,
            },
          ]}
          // Prevent touches reaching through when hidden off-screen
          pointerEvents={visible ? 'auto' : 'none'}
        >
          {/* Drag handle */}
          <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 8 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#3A3A3C' }} />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 16 }}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>Details</Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={22} color="#8E8E93" />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: SHEET_HEIGHT - 120 }}>
            {rows.map((row, i) => (
              <View
                key={i}
                style={{
                  flexDirection: 'row',
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                  borderBottomWidth: i < rows.length - 1 ? 0.5 : 0,
                  borderBottomColor: '#2C2C2E',
                }}
              >
                <Text style={{ color: '#8E8E93', fontSize: 14, width: 112 }}>{row.label}</Text>
                <Text style={{ color: '#fff', fontSize: 14, flex: 1 }} numberOfLines={2}>{row.value}</Text>
              </View>
            ))}
          </ScrollView>

          {/* Action buttons */}
          <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingTop: 16 }}>
            <Pressable
              onPress={onRename}
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12, backgroundColor: '#2C2C2E' }}
            >
              <Ionicons name="pencil-outline" size={18} color="#007AFF" />
              <Text style={{ color: '#007AFF', fontWeight: '500' }}>Rename</Text>
            </Pressable>

            <Pressable
              onPress={() => toggleFavorite(item.id)}
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12, backgroundColor: '#2C2C2E' }}
            >
              <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={18} color={isFavorite ? '#FF3B30' : '#007AFF'} />
              <Text style={{ color: isFavorite ? '#FF3B30' : '#007AFF', fontWeight: '500' }}>
                {isFavorite ? 'Unfavorite' : 'Favorite'}
              </Text>
            </Pressable>

            <Pressable
              onPress={onDelete}
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12, backgroundColor: '#2C2C2E' }}
            >
              <Ionicons name="trash-outline" size={18} color="#FF3B30" />
              <Text style={{ color: '#FF3B30', fontWeight: '500' }}>Delete</Text>
            </Pressable>
          </View>
        </Animated.View>
      </GestureDetector>
    </>
  );
}