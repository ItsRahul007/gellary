import React, { useEffect, useRef, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { useGallery } from '@/context/GalleryContext';
import type { MediaItem } from '@/types/gallery';

interface Props {
  item: MediaItem;
  visible: boolean;
  onClose: () => void;
}

export default function RenameModal({ item, visible, onClose }: Props) {
  const { setCustomName, getDisplayName } = useGallery();
  const [name, setName] = useState('');
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      setName(getDisplayName(item));
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [visible, item]);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (trimmed && trimmed !== item.filename) {
      await setCustomName(item.id, trimmed);
    }
    Keyboard.dismiss();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 bg-black/60 items-center justify-center px-8"
      >
        <View className="bg-surface rounded-2xl p-6 w-full">
          <Text className="text-white text-lg font-bold mb-1">Rename</Text>
          <Text className="text-gray-400 text-sm mb-5">Enter a new display name for this file.</Text>

          <TextInput
            ref={inputRef}
            value={name}
            onChangeText={setName}
            className="bg-surface-2 text-white rounded-xl px-4 py-3 text-base mb-5"
            placeholderTextColor="#8E8E93"
            placeholder="File name"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={handleSave}
            selectTextOnFocus
          />

          <View className="flex-row gap-3">
            <Pressable
              onPress={onClose}
              className="flex-1 py-3 rounded-xl border border-surface-3 items-center"
            >
              <Text className="text-white font-medium">Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              className="flex-1 py-3 rounded-xl bg-primary items-center"
            >
              <Text className="text-white font-semibold">Save</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
