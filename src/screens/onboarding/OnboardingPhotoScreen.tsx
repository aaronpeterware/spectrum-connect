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
import * as Haptics from 'expo-haptics';
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
        updateData({ profilePhotos: newPhotos.slice(0, 6) }); // Max 6 photos
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
        updateData({ profilePhotos: newPhotos.slice(0, 6) });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const removePhoto = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newPhotos = data.profilePhotos.filter((_, i) => i !== index);
    // Adjust main photo index if needed
    let newMainIndex = data.mainPhotoIndex;
    if (index === data.mainPhotoIndex) {
      newMainIndex = 0;
    } else if (index < data.mainPhotoIndex) {
      newMainIndex = data.mainPhotoIndex - 1;
    }
    updateData({ profilePhotos: newPhotos, mainPhotoIndex: Math.min(newMainIndex, newPhotos.length - 1) });
  };

  const setMainPhoto = (index: number) => {
    if (data.profilePhotos[index]) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      updateData({ mainPhotoIndex: index });
    }
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
    const isMain = index === data.mainPhotoIndex;

    if (photo) {
      return (
        <TouchableOpacity
          key={index}
          style={[styles.photoSlot, isMain && styles.mainPhotoSlot]}
          onPress={() => setMainPhoto(index)}
          onLongPress={() => {
            Alert.alert(
              'Remove Photo',
              'Are you sure you want to remove this photo?',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Remove', style: 'destructive', onPress: () => removePhoto(index) },
              ]
            );
          }}
          activeOpacity={0.9}
        >
          <Image source={{ uri: photo }} style={styles.photo} />
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => removePhoto(index)}
          >
            <Ionicons name="close-circle" size={26} color={Colors.error} />
          </TouchableOpacity>
          {isMain && (
            <View style={styles.mainBadge}>
              <Ionicons name="star" size={12} color={Colors.surface} />
              <Text style={styles.mainBadgeText}>Profile</Text>
            </View>
          )}
          {!isMain && (
            <TouchableOpacity
              style={styles.setMainButton}
              onPress={() => setMainPhoto(index)}
            >
              <Ionicons name="star-outline" size={16} color={Colors.surface} />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      );
    }

    const canAdd = index === 0 || data.profilePhotos.length >= index;

    return (
      <TouchableOpacity
        key={index}
        style={[styles.photoSlot, styles.emptySlot, !canAdd && styles.disabledSlot]}
        onPress={canAdd ? showPhotoOptions : undefined}
        disabled={loading || !canAdd}
      >
        <View style={[styles.addIcon, !canAdd && styles.addIconDisabled]}>
          <Ionicons
            name="add"
            size={28}
            color={canAdd ? Colors.primary : Colors.gray300}
          />
        </View>
        <Text style={[styles.addText, !canAdd && styles.addTextDisabled]}>
          {index === 0 ? 'Add photo' : `Photo ${index + 1}`}
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
          Add up to 6 photos. Tap a photo to set it as your main profile picture.
        </Text>

        <View style={styles.photoGrid}>
          {[0, 1, 2, 3, 4, 5].map(renderPhotoSlot)}
        </View>

        <View style={styles.tips}>
          <View style={styles.tipRow}>
            <Ionicons name="star" size={16} color={Colors.primary} />
            <Text style={styles.tipText}>Tap any photo to make it your profile picture</Text>
          </View>
          <View style={styles.tipRow}>
            <Ionicons name="close-circle" size={16} color={Colors.gray400} />
            <Text style={styles.tipText}>Tap × or long press to remove a photo</Text>
          </View>
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
    paddingTop: Spacing.md,
  },
  title: {
    ...Typography.h1,
    color: Colors.gray900,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.gray600,
    marginBottom: Spacing.lg,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  photoSlot: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  mainPhotoSlot: {
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  emptySlot: {
    backgroundColor: Colors.gray100,
    borderWidth: 2,
    borderColor: Colors.gray200,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledSlot: {
    opacity: 0.5,
  },
  photo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: Colors.surface,
    borderRadius: 13,
  },
  mainBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  mainBadgeText: {
    ...Typography.caption,
    color: Colors.surface,
    fontWeight: '600',
  },
  setMainButton: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 6,
    borderRadius: BorderRadius.sm,
  },
  addIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  addIconDisabled: {
    backgroundColor: Colors.gray200,
    shadowOpacity: 0,
    elevation: 0,
  },
  addText: {
    ...Typography.caption,
    color: Colors.gray600,
  },
  addTextDisabled: {
    color: Colors.gray300,
  },
  tips: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  tipText: {
    ...Typography.bodySmall,
    color: Colors.gray600,
    flex: 1,
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
