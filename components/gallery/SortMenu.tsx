import React, { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { useGallery } from '@/context/GalleryContext';
import type { SortBy, SortOrder } from '@/types/gallery';

const SORT_OPTIONS: { label: string; value: SortBy }[] = [
  { label: 'Date', value: 'date' },
  { label: 'Name', value: 'name' },
  { label: 'Size', value: 'size' },
];

export default function SortMenu() {
  const { sortBy, sortOrder, setSortBy, setSortOrder } = useGallery();
  const [visible, setVisible] = useState(false);

  const currentLabel = SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? 'Date';
  const orderIcon = sortOrder === 'asc' ? '↑' : '↓';

  return (
    <>
      <Pressable
        onPress={() => setVisible(true)}
        className="flex-row items-center gap-1 px-3 py-1.5 rounded-full border border-surface-3"
      >
        <Text className="text-gray-300 text-sm">{currentLabel} {orderIcon}</Text>
      </Pressable>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <Pressable className="flex-1 bg-black/60" onPress={() => setVisible(false)}>
          <View className="absolute bottom-0 left-0 right-0 bg-surface rounded-t-2xl pb-8">
            <Text className="text-white text-base font-semibold px-6 pt-6 pb-4">Sort by</Text>
            {SORT_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                onPress={() => { setSortBy(opt.value); setVisible(false); }}
                className={`flex-row items-center justify-between px-6 py-4 ${sortBy === opt.value ? 'bg-surface-2' : ''}`}
              >
                <Text className="text-white text-base">{opt.label}</Text>
                {sortBy === opt.value && <Text className="text-primary text-base">✓</Text>}
              </Pressable>
            ))}
            <View className="h-px bg-surface-3 mx-6 my-2" />
            <Text className="text-white text-base font-semibold px-6 py-2">Order</Text>
            {([['asc', 'Ascending ↑'], ['desc', 'Descending ↓']] as [SortOrder, string][]).map(([val, label]) => (
              <Pressable
                key={val}
                onPress={() => { setSortOrder(val); setVisible(false); }}
                className={`flex-row items-center justify-between px-6 py-4 ${sortOrder === val ? 'bg-surface-2' : ''}`}
              >
                <Text className="text-white text-base">{label}</Text>
                {sortOrder === val && <Text className="text-primary text-base">✓</Text>}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}
