import { useEffect } from 'react';
import { BackHandler } from 'react-native';
import { useGallery } from '@/context/GalleryContext';

/** Intercepts the Android hardware back button while items are selected
 *  and clears the selection instead of navigating back / closing the app. */
export function useSelectionBackHandler() {
  const { isSelecting, clearSelection } = useGallery();

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isSelecting) {
        clearSelection();
        return true; // consumed — prevents default back behaviour
      }
      return false;
    });
    return () => sub.remove();
  }, [isSelecting, clearSelection]);
}