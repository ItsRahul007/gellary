import type { MediaItem } from "@/types/gallery";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as MediaLibrary from "expo-media-library";
import { useEffect } from "react";
import { Alert } from "react-native";
import ImageCropPicker from "react-native-image-crop-picker";

interface Props {
  item: MediaItem;
  visible: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export default function EditModal({ item, visible, onClose, onSaved }: Props) {
  useEffect(() => {
    if (!visible) return;

    (async () => {
      try {
        const cropped = await ImageCropPicker.openCropper({
          path: item.uri,
          freeStyleCropEnabled: true,
          cropperRotateButtonsHidden: false,
          mediaType: "photo",
        });

        // Re-encode so the output file gets a current filesystem timestamp,
        // which expo-media-library uses as modificationTime.
        const ctx = ImageManipulator.manipulate(cropped.path);
        const ref = await ctx.renderAsync();
        const fresh = await ref.saveAsync({ compress: 0.97, format: SaveFormat.JPEG });

        await MediaLibrary.createAssetAsync(fresh.uri);
        onSaved?.();
        Alert.alert("Saved", "Edited copy saved to your library.");
      } catch (e: any) {
        if (e?.code !== "E_PICKER_CANCELLED") {
          Alert.alert("Error", "Could not save the edited image.");
        }
      } finally {
        onClose();
      }
    })();
  }, [visible]);

  return null;
}