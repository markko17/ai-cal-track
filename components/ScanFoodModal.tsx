import Colors from '@/constants/colors';
import { prepareScannedImage } from '@/utils/image';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

export interface ScanFoodModalProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function ScanFoodModal({ isVisible, onClose }: ScanFoodModalProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handlePickFromGallery = async () => {
    try {
      setIsLoading(true);
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          'Permission Required',
          'Permission to access photo library is required to select food images.'
        );
        setIsLoading(false);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        setIsLoading(false);
        return;
      }

      const asset = result.assets[0];
      const prepared = await prepareScannedImage(asset.uri);
      setIsLoading(false);
      onClose();
      router.push({
        pathname: '/analyze-food',
        params: {
          imageUri: prepared.uri,
          base64Data: prepared.base64,
        },
      } as any);
    } catch (error: any) {
      setIsLoading(false);
      console.error('Error selecting image from gallery:', error);
      Alert.alert('Error', 'Failed to pick image from gallery. Please try again.');
    }
  };

  const handleTakeCameraPicture = async () => {
    try {
      setIsLoading(true);
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          'Camera Permission Required',
          'Camera permission is required to capture food photos.'
        );
        setIsLoading(false);
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        setIsLoading(false);
        return;
      }

      const asset = result.assets[0];
      const prepared = await prepareScannedImage(asset.uri);
      setIsLoading(false);
      onClose();
      router.push({
        pathname: '/analyze-food',
        params: {
          imageUri: prepared.uri,
          base64Data: prepared.base64,
        },
      } as any);
    } catch (error: any) {
      setIsLoading(false);
      console.error('Error capturing image from camera:', error);
      Alert.alert('Error', 'Failed to capture photo with camera. Please try again.');
    }
  };

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalCard}>
              {/* Header Title */}
              <View style={styles.headerRow}>
                <View style={styles.headerTitleGroup}>
                  <View style={styles.cameraIconBg}>
                    <Ionicons name="camera" size={20} color="#8B5CF6" />
                  </View>
                  <Text style={styles.modalTitle}>Scan Food with AI</Text>
                </View>

                <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                  <Ionicons name="close" size={20} color={Colors.text} />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSubTitle}>
                Choose how you want to add your meal photo for instant AI analysis.
              </Text>

              {/* Options Group */}
              <View style={styles.optionsGroup}>
                {/* Take Picture Option */}
                <TouchableOpacity
                  style={styles.optionBtn}
                  onPress={handleTakeCameraPicture}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  <View style={[styles.optionIconBg, { backgroundColor: '#F0FDF4' }]}>
                    <Ionicons name="camera-outline" size={24} color="#16A34A" />
                  </View>
                  <View style={styles.optionTextCol}>
                    <Text style={styles.optionTitle}>Take a Picture</Text>
                    <Text style={styles.optionSub}>Open device camera to snap photo</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                </TouchableOpacity>

                {/* Gallery Option */}
                <TouchableOpacity
                  style={styles.optionBtn}
                  onPress={handlePickFromGallery}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  <View style={[styles.optionIconBg, { backgroundColor: '#EFF6FF' }]}>
                    <Ionicons name="images-outline" size={24} color="#2563EB" />
                  </View>
                  <View style={styles.optionTextCol}>
                    <Text style={styles.optionTitle}>Upload from Gallery</Text>
                    <Text style={styles.optionSub}>Select an existing photo from media library</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                </TouchableOpacity>
              </View>

              {/* Cancel Button */}
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 36,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cameraIconBg: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubTitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 20,
  },
  optionsGroup: {
    gap: 12,
    marginBottom: 16,
  },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  optionIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  optionTextCol: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  optionSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  cancelBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    marginTop: 4,
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#475569',
  },
});
