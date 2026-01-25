import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Spacing, BorderRadius, Typography } from '../../constants/theme';
import { useOnboarding } from '../../context/OnboardingContext';

type OnboardingStackParamList = {
  Welcome: undefined;
  Photo: undefined;
  Basics: undefined;
  Gender: undefined;
  Seeking: undefined;
  Goals: undefined;
  Interests: undefined;
  Complete: undefined;
};

const { width } = Dimensions.get('window');
const PHOTO_SIZE = (width - 80) / 2;

const OnboardingPhotoScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>();
  const { data, updateData, nextStep, prevStep, canProceed } = useOnboarding();
  const [loading, setLoading] = useState(false);

  const handleContinue = () => {
    nextStep();
    navigation.navigate('Basics');
  };

  const handleBack = () => {
    prevStep();
    navigation.goBack();
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photo library to add photos.');
        return;
      }

      setLoading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const newPhotos = [...data.profilePhotos, result.assets[0].uri];
        updateData({ profilePhotos: newPhotos.slice(0, 4) }); // Max 4 photos
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your camera to take photos.');
        return;
      }

      setLoading(true);
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const newPhotos = [...data.profilePhotos, result.assets[0].uri];
        updateData({ profilePhotos: newPhotos.slice(0, 4) });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = data.profilePhotos.filter((_, i) => i !== index);
    updateData({ profilePhotos: newPhotos });
  };

  const showPhotoOptions = () => {
    Alert.alert(
      'Add Photo',
      'Choose how you want to add a photo',
      [
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Library', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const renderPhotoSlot = (index: number) => {
    const photo = data.profilePhotos[index];

    if (photo) {
      return (
        <View key={index} style={styles.photoSlot}>
          <Image source={{ uri: photo }} style={styles.photo} />
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => removePhoto(index)}
          >
            <Ionicons name="close-circle" size={28} color={Colors.error} />
          </TouchableOpacity>
          {index === 0 && (
            <View style={styles.mainBadge}>
              <Text style={styles.mainBadgeText}>Main</Text>
            </View>
          )}
        </View>
      );
    }

    return (
      <TouchableOpacity
        key={index}
        style={[styles.photoSlot, styles.emptySlot]}
        onPress={showPhotoOptions}
        disabled={loading || (index > 0 && !data.profilePhotos[index - 1])}
      >
        <View style={styles.addIcon}>
          <Ionicons
            name="add"
            size={32}
            color={index === 0 || data.profilePhotos[index - 1] ? Colors.primary : Colors.gray300}
          />
        </View>
        <Text style={[
          styles.addText,
          { color: index === 0 || data.profilePhotos[index - 1] ? Colors.gray600 : Colors.gray300 }
        ]}>
          {index === 0 ? 'Add main photo' : 'Add photo'}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.gray800} />
        </TouchableOpacity>
        <View style={styles.progress}>
          <View style={[styles.progressBar, { width: '28%' }]} />
        </View>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Add your photos</Text>
        <Text style={styles.subtitle}>
          Add at least one photo to help others recognize you. Your main photo will be the first one shown.
        </Text>

        <View style={styles.photoGrid}>
          {[0, 1, 2, 3].map(renderPhotoSlot)}
        </View>

        <View style={styles.tips}>
          <Text style={styles.tipsTitle}>Photo Tips:</Text>
          <Text style={styles.tipText}>• Choose a clear photo of your face</Text>
          <Text style={styles.tipText}>• Good lighting makes a difference</Text>
          <Text style={styles.tipText}>• Show your authentic self</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, !canProceed() && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={!canProceed()}
        >
          <Text style={[styles.buttonText, !canProceed() && styles.buttonTextDisabled]}>
            Continue
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progress: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.gray200,
    borderRadius: 2,
    marginHorizontal: Spacing.md,
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  title: {
    ...Typography.h1,
    color: Colors.gray900,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.gray600,
    marginBottom: Spacing.xl,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.lg,
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  photoSlot: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  emptySlot: {
    backgroundColor: Colors.gray100,
    borderWidth: 2,
    borderColor: Colors.gray200,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.surface,
    borderRadius: 14,
  },
  mainBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  mainBadgeText: {
    ...Typography.caption,
    color: Colors.surface,
    fontWeight: '600',
  },
  addIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  addText: {
    ...Typography.caption,
  },
  tips: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
  },
  tipsTitle: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Colors.gray800,
    marginBottom: Spacing.sm,
  },
  tipText: {
    ...Typography.bodySmall,
    color: Colors.gray600,
    marginBottom: 4,
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: Colors.gray200,
  },
  buttonText: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.surface,
  },
  buttonTextDisabled: {
    color: Colors.gray400,
  },
});

export default OnboardingPhotoScreen;
