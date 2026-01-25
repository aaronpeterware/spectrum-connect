import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Modal,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, BorderRadius, Typography, ThemeColors } from '../constants/theme';
import { useUser } from '../context/UserContext';
import { useSettings } from '../context/SettingsContext';
import { useTheme } from '../hooks/useTheme';
import * as ImagePicker from 'expo-image-picker';
import MenuModal from '../components/MenuModal';

type RootStackParamList = {
  PrivacySecurity: undefined;
  TermsOfService: undefined;
  HelpSupport: undefined;
};

const SettingsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, updateUser, setProfileImage } = useUser();
  const {
    settings,
    setCalmMode,
    setHapticFeedback,
    setNotificationsEnabled,
    setReducedMotion,
    setTheme,
    triggerHaptic,
  } = useSettings();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState(user.name);
  const [editEmail, setEditEmail] = useState(user.email);
  const [editBio, setEditBio] = useState(user.bio || '');
  const [editLocation, setEditLocation] = useState(user.location || '');
  const [menuVisible, setMenuVisible] = useState(false);

  const handleOpenEdit = () => {
    triggerHaptic('light');
    setEditName(user.name);
    setEditEmail(user.email);
    setEditBio(user.bio || '');
    setEditLocation(user.location || '');
    setEditModalVisible(true);
  };

  const handleSaveProfile = () => {
    triggerHaptic('success');
    updateUser({
      name: editName,
      email: editEmail,
      bio: editBio,
      location: editLocation,
    });
    setEditModalVisible(false);
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const SettingRow = ({
    icon,
    title,
    subtitle,
    value,
    onValueChange,
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
  }) => (
    <View style={styles.settingRow}>
      <Text style={styles.settingIcon}>{icon}</Text>
      <View style={styles.settingInfo}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.gray300, true: colors.primaryLight }}
        thumbColor={value ? colors.primary : colors.gray100}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <MenuModal visible={menuVisible} onClose={() => setMenuVisible(false)} />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.placeholder} />
          <View style={styles.logoContainer}>
            <Text style={styles.logoTextSpectrum}>Haven</Text>
          </View>
          <TouchableOpacity style={styles.menuButton} onPress={() => setMenuVisible(true)}>
            <Ionicons name="menu" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          {user.profileImage ? (
            <Image source={{ uri: user.profileImage }} style={styles.profileAvatarImage} />
          ) : (
            <LinearGradient
              colors={[colors.gradientPink, colors.gradientPurple]}
              style={styles.profileAvatar}
            >
              <Text style={styles.profileInitial}>{user.name[0]}</Text>
            </LinearGradient>
          )}
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user.name}</Text>
            <Text style={styles.profileEmail}>{user.email}</Text>
          </View>
          <TouchableOpacity style={styles.editButton} onPress={handleOpenEdit}>
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>

          <View style={styles.card}>
            <View style={styles.themeRow}>
              <Text style={styles.themeIcon}>🎨</Text>
              <View style={styles.themeInfo}>
                <Text style={styles.settingTitle}>Theme</Text>
                <Text style={styles.settingSubtitle}>Choose your preferred appearance</Text>
              </View>
            </View>
            <View style={styles.themeSelectorContainer}>
              <TouchableOpacity
                style={[
                  styles.themeOption,
                  settings.theme === 'light' && styles.themeOptionSelected,
                ]}
                onPress={() => {
                  triggerHaptic('light');
                  setTheme('light');
                }}
              >
                <Ionicons
                  name="sunny"
                  size={20}
                  color={settings.theme === 'light' ? colors.primary : colors.textTertiary}
                />
                <Text
                  style={[
                    styles.themeOptionText,
                    settings.theme === 'light' && styles.themeOptionTextSelected,
                  ]}
                >
                  Light
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.themeOption,
                  settings.theme === 'dark' && styles.themeOptionSelected,
                ]}
                onPress={() => {
                  triggerHaptic('light');
                  setTheme('dark');
                }}
              >
                <Ionicons
                  name="moon"
                  size={20}
                  color={settings.theme === 'dark' ? colors.primary : colors.textTertiary}
                />
                <Text
                  style={[
                    styles.themeOptionText,
                    settings.theme === 'dark' && styles.themeOptionTextSelected,
                  ]}
                >
                  Dark
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.themeOption,
                  settings.theme === 'system' && styles.themeOptionSelected,
                ]}
                onPress={() => {
                  triggerHaptic('light');
                  setTheme('system');
                }}
              >
                <Ionicons
                  name="phone-portrait"
                  size={20}
                  color={settings.theme === 'system' ? colors.primary : colors.textTertiary}
                />
                <Text
                  style={[
                    styles.themeOptionText,
                    settings.theme === 'system' && styles.themeOptionTextSelected,
                  ]}
                >
                  Auto
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Accessibility Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Accessibility</Text>

          <View style={styles.card}>
            <SettingRow
              icon="🌙"
              title="Calm Mode"
              subtitle="Softer colors & slower animations for sensory comfort"
              value={settings.calmMode}
              onValueChange={setCalmMode}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="📳"
              title="Haptic Feedback"
              subtitle="Vibration feedback on button presses & interactions"
              value={settings.hapticFeedback}
              onValueChange={setHapticFeedback}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="🐢"
              title="Reduced Motion"
              subtitle="Minimize animations throughout the app"
              value={settings.reducedMotion}
              onValueChange={setReducedMotion}
            />
          </View>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>

          <View style={styles.card}>
            <SettingRow
              icon="🔔"
              title="Push Notifications"
              subtitle="Matches, messages, and updates"
              value={settings.notificationsEnabled}
              onValueChange={setNotificationsEnabled}
            />
          </View>
        </View>

        {/* Calm Mode Info Card */}
        {settings.calmMode && (
          <View style={styles.section}>
            <View style={[styles.card, styles.infoCard]}>
              <View style={styles.infoContent}>
                <Text style={styles.infoIcon}>💜</Text>
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoTitle}>Calm Mode Active</Text>
                  <Text style={styles.infoDescription}>
                    Colors are now softer and animations are gentler to reduce sensory overwhelm.
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          <View style={styles.card}>
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => {
                triggerHaptic('light');
                (navigation as any).navigate('PrivacySecurity');
              }}
            >
              <Text style={styles.menuIcon}>🔒</Text>
              <Text style={styles.menuTitle}>Privacy & Security</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => {
                triggerHaptic('light');
                (navigation as any).navigate('TermsOfService');
              }}
            >
              <Text style={styles.menuIcon}>📄</Text>
              <Text style={styles.menuTitle}>Terms of Service</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => {
                triggerHaptic('light');
                (navigation as any).navigate('HelpSupport');
              }}
            >
              <Text style={styles.menuIcon}>❓</Text>
              <Text style={styles.menuTitle}>Help & Support</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutButton}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Haven v1.0.0</Text>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={handleSaveProfile}>
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {/* Profile Image */}
              <TouchableOpacity style={styles.imageEditContainer} onPress={handlePickImage}>
                {user.profileImage ? (
                  <Image source={{ uri: user.profileImage }} style={styles.editProfileImage} />
                ) : (
                  <LinearGradient
                    colors={[colors.gradientPink, colors.gradientPurple]}
                    style={styles.editProfileImage}
                  >
                    <Text style={styles.editProfileInitial}>{user.name[0]}</Text>
                  </LinearGradient>
                )}
                <View style={styles.cameraOverlay}>
                  <Ionicons name="camera" size={20} color="white" />
                </View>
                <Text style={styles.changePhotoText}>Change Photo</Text>
              </TouchableOpacity>

              {/* Form Fields */}
              <View style={styles.formSection}>
                <Text style={styles.inputLabel}>Name</Text>
                <TextInput
                  style={styles.input}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Your name"
                  placeholderTextColor={colors.inputPlaceholder}
                />
              </View>

              <View style={styles.formSection}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={editEmail}
                  onChangeText={setEditEmail}
                  placeholder="Your email"
                  placeholderTextColor={colors.inputPlaceholder}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.formSection}>
                <Text style={styles.inputLabel}>Location</Text>
                <TextInput
                  style={styles.input}
                  value={editLocation}
                  onChangeText={setEditLocation}
                  placeholder="Where are you from?"
                  placeholderTextColor={colors.inputPlaceholder}
                />
              </View>

              <View style={styles.formSection}>
                <Text style={styles.inputLabel}>Bio</Text>
                <TextInput
                  style={[styles.input, styles.bioInput]}
                  value={editBio}
                  onChangeText={setEditBio}
                  placeholder="Tell us about yourself..."
                  placeholderTextColor={colors.inputPlaceholder}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <View style={{ height: 40 }} />
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  menuButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    width: 40,
    height: 40,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logoTextSpectrum: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.5,
  },
  logoTextConnect: {
    fontSize: 20,
    fontWeight: '300',
    color: colors.primary,
    fontStyle: 'italic',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    shadowColor: isDark ? '#000' : colors.gray900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.3 : 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  profileInitial: {
    fontSize: 24,
    fontWeight: '600',
    color: 'white',
  },
  profileInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  profileName: {
    ...Typography.h3,
    color: colors.text,
  },
  profileEmail: {
    ...Typography.bodySmall,
    color: colors.textSecondary,
  },
  editButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: BorderRadius.md,
  },
  editButtonText: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: colors.primary,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginLeft: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  card: {
    backgroundColor: colors.cardBackground,
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  settingIcon: {
    fontSize: 24,
    marginRight: Spacing.md,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    ...Typography.body,
    fontWeight: '500',
    color: colors.text,
  },
  settingSubtitle: {
    ...Typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  menuIcon: {
    fontSize: 24,
    marginRight: Spacing.md,
  },
  menuTitle: {
    ...Typography.body,
    flex: 1,
    color: colors.text,
  },
  menuArrow: {
    fontSize: 20,
    color: colors.textTertiary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginLeft: 56,
  },
  signOutButton: {
    marginHorizontal: Spacing.lg,
    padding: Spacing.lg,
    backgroundColor: colors.cardBackground,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  signOutText: {
    ...Typography.body,
    fontWeight: '600',
    color: colors.error,
  },
  version: {
    ...Typography.caption,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    ...Typography.h3,
    color: colors.text,
  },
  cancelText: {
    ...Typography.body,
    color: colors.textSecondary,
  },
  saveText: {
    ...Typography.body,
    fontWeight: '600',
    color: colors.primary,
  },
  modalContent: {
    flex: 1,
    padding: Spacing.lg,
  },
  imageEditContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  editProfileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editProfileInitial: {
    fontSize: 36,
    fontWeight: '600',
    color: 'white',
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 20,
    right: '50%',
    marginRight: -50,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  changePhotoText: {
    ...Typography.bodySmall,
    color: colors.primary,
    marginTop: Spacing.sm,
    fontWeight: '600',
  },
  formSection: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  input: {
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    ...Typography.body,
    color: colors.inputText,
  },
  bioInput: {
    minHeight: 100,
    paddingTop: Spacing.md,
  },
  // Info card styles
  infoCard: {
    backgroundColor: isDark ? '#3B2D5B' : '#F3E8FF',
    borderWidth: 1,
    borderColor: isDark ? '#5B4D7B' : '#DDD6FE',
  },
  infoContent: {
    flexDirection: 'row',
    padding: Spacing.lg,
    alignItems: 'flex-start',
  },
  infoIcon: {
    fontSize: 24,
    marginRight: Spacing.md,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    ...Typography.body,
    fontWeight: '600',
    color: isDark ? '#C4B5FD' : '#7C3AED',
    marginBottom: 4,
  },
  infoDescription: {
    ...Typography.caption,
    color: isDark ? '#A78BFA' : '#6B21A8',
    lineHeight: 18,
  },
  // Theme selector styles
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  themeIcon: {
    fontSize: 24,
    marginRight: Spacing.md,
  },
  themeInfo: {
    flex: 1,
  },
  themeSelectorContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  themeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: BorderRadius.lg,
    gap: Spacing.xs,
  },
  themeOptionSelected: {
    backgroundColor: `${colors.primary}15`,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  themeOptionText: {
    ...Typography.bodySmall,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  themeOptionTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
});

export default SettingsScreen;
