import { useState } from 'react';
import { Alert, Linking } from 'react-native';

import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';

export interface ImagePickerResult {
  uri: string;
  type: string;
  name: string;
}

export const useImagePicker = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();

  const requestCameraPermission = async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert(
        t('Camera permission required'),
        t('We need access to your camera to take photos'),
        [
          { text: t('Cancel'), style: 'cancel' },
          {
            text: t('Go to Settings'),
            onPress: () => Linking.openSettings(),
          },
        ]
      );
      return false;
    }

    return true;
  };

  const requestMediaLibraryPermission = async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert(
        t('Photo library permission required'),
        t('We need access to your photo library to select images'),
        [
          { text: t('Cancel'), style: 'cancel' },
          {
            text: t('Go to Settings'),
            onPress: () => Linking.openSettings(),
          },
        ]
      );
      return false;
    }

    return true;
  };

  const takePhoto = async (): Promise<ImagePickerResult | null> => {
    setIsLoading(true);

    try {
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        return null;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        return {
          uri: asset.uri,
          type: asset.type || 'image',
          name: asset.fileName || `photo_${Date.now()}.jpg`,
        };
      }

      return null;
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert(t('Permission denied'), t('Unable to access camera'));
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const pickFromLibrary = async (): Promise<ImagePickerResult | null> => {
    setIsLoading(true);

    try {
      const hasPermission = await requestMediaLibraryPermission();
      if (!hasPermission) {
        return null;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        return {
          uri: asset.uri,
          type: asset.type || 'image',
          name: asset.fileName || `image_${Date.now()}.jpg`,
        };
      }

      return null;
    } catch (error) {
      console.error('Error picking from library:', error);
      Alert.alert(t('Permission denied'), t('Unable to access photo library'));
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const showImagePicker = () => {
    Alert.alert(t('Upload'), '', [
      { text: t('Take photo'), onPress: takePhoto },
      { text: t('Choose from library'), onPress: pickFromLibrary },
      { text: t('Cancel'), style: 'cancel' },
    ]);
  };

  return {
    takePhoto,
    pickFromLibrary,
    showImagePicker,
    isLoading,
  };
};
