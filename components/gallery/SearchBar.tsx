import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { useGallery } from '@/context/GalleryContext';

export default function SearchBar() {
  const { searchQuery, setSearchQuery } = useGallery();

  return (
    <View className="flex-row items-center bg-surface-2 rounded-xl mx-4 my-2 px-3 gap-2">
      <Ionicons name="search" size={18} color="#8E8E93" />
      <TextInput
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search"
        placeholderTextColor="#8E8E93"
        className="flex-1 py-2.5 text-white text-base"
        returnKeyType="search"
        clearButtonMode="while-editing"
      />
      {searchQuery.length > 0 && (
        <Pressable onPress={() => setSearchQuery('')}>
          <Ionicons name="close-circle" size={18} color="#8E8E93" />
        </Pressable>
      )}
    </View>
  );
}
