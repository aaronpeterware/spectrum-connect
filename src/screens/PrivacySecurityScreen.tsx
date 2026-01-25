import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography } from '../constants/theme';
import { useSettings } from '../context/SettingsContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PrivacySettings {
  showOnlineStatus: boolean;
  showLastActive: boolean;
  showProfileInSearch: boolean;
  allowMessageRequests: boolean;
  showReadReceipts: boolean;
  shareUsageData: boolean;
  personalizedAds: boolean;
  locationServices: boolean;
}

const PrivacySecurityScreen = () => {
  const navigation = useNavigation();
  const { triggerHaptic } = useSettings();

  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    showOnlineStatus: true,
    showLastActive: true,
    showProfileInSearch: true,
    allowMessageRequests: true,
    showReadReceipts: true,
    shareUsageData: false,
    personalizedAds: false,
    locationServices: true,
  });

  const [changePasswordModal, setChangePasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [deleteAccountModal, setDeleteAccountModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const updatePrivacySetting = (key: keyof PrivacySettings, value: boolean) => {
    triggerHaptic('light');
    setPrivacySettings(prev => ({ ...prev, [key]: value }));
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }

    setIsChangingPassword(true);
    triggerHaptic('light');

    // Simulate API call
    setTimeout(() => {
      setIsChangingPassword(false);
      setChangePasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      triggerHaptic('success');
      Alert.alert('Success', 'Your password has been updated');
    }, 1500);
  };

  const handleToggle2FA = () => {
    triggerHaptic('medium');
    if (twoFactorEnabled) {
      Alert.alert(
        'Disable Two-Factor Authentication',
        'This will make your account less secure. Are you sure?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disable',
            style: 'destructive',
            onPress: () => {
              setTwoFactorEnabled(false);
              triggerHaptic('warning');
            },
          },
        ]
      );
    } else {
      Alert.alert(
        'Enable Two-Factor Authentication',
        'We\'ll send a verification code to your email each time you log in from a new device.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Enable',
            onPress: () => {
              setTwoFactorEnabled(true);
              triggerHaptic('success');
              Alert.alert('Success', '2FA has been enabled for your account');
            },
          },
        ]
      );
    }
  };

  const handleDownloadData = () => {
    triggerHaptic('light');
    Alert.alert(
      'Download Your Data',
      'We\'ll prepare a copy of your Haven data including your profile, messages, and activity. You\'ll receive an email when it\'s ready (usually within 24 hours).',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request Download',
          onPress: () => {
            triggerHaptic('success');
            Alert.alert('Request Submitted', 'You\'ll receive an email when your data is ready to download.');
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    if (deleteConfirmText.toLowerCase() !== 'delete my account') {
      Alert.alert('Error', 'Please type "delete my account" to confirm');
      return;
    }

    triggerHaptic('error');
    Alert.alert(
      'Account Deleted',
      'Your account has been scheduled for deletion. You have 30 days to reactivate by logging in again.',
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  };

  const handleBlockedUsers = () => {
    triggerHaptic('light');
    Alert.alert(
      'Blocked Users',
      'You haven\'t blocked anyone yet. You can block users from their profile or chat.',
      [{ text: 'OK' }]
    );
  };

  const SettingToggle = ({
    icon,
    title,
    subtitle,
    value,
    onValueChange,
  }: {
    icon: string;
    title: string;
    subtitle: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
  }) => (
    <View style={styles.settingRow}>
      <View style={styles.settingIconContainer}>
        <Ionicons name={icon as any} size={22} color={Colors.primary} />
      </View>
      <View style={styles.settingInfo}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingSubtitle}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: Colors.gray300, true: Colors.primaryLight }}
        thumbColor={value ? Colors.primary : Colors.gray100}
      />
    </View>
  );

  const MenuRow = ({
    icon,
    title,
    subtitle,
    onPress,
    danger,
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress: () => void;
    danger?: boolean;
  }) => (
    <TouchableOpacity style={styles.menuRow} onPress={onPress}>
      <View style={[styles.settingIconContainer, danger && styles.dangerIcon]}>
        <Ionicons name={icon as any} size={22} color={danger ? Colors.error : Colors.primary} />
      </View>
      <View style={styles.settingInfo}>
        <Text style={[styles.settingTitle, danger && styles.dangerText]}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={20} color={Colors.gray400} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.gray900} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy & Security</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Privacy Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Privacy</Text>
          <View style={styles.card}>
            <SettingToggle
              icon="eye-outline"
              title="Show Online Status"
              subtitle="Let others see when you're active"
              value={privacySettings.showOnlineStatus}
              onValueChange={(v) => updatePrivacySetting('showOnlineStatus', v)}
            />
            <View style={styles.divider} />
            <SettingToggle
              icon="time-outline"
              title="Show Last Active"
              subtitle="Display when you were last online"
              value={privacySettings.showLastActive}
              onValueChange={(v) => updatePrivacySetting('showLastActive', v)}
            />
            <View style={styles.divider} />
            <SettingToggle
              icon="search-outline"
              title="Appear in Search"
              subtitle="Let others find you through search"
              value={privacySettings.showProfileInSearch}
              onValueChange={(v) => updatePrivacySetting('showProfileInSearch', v)}
            />
          </View>
        </View>

        {/* Messaging Privacy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Messaging</Text>
          <View style={styles.card}>
            <SettingToggle
              icon="chatbubble-outline"
              title="Message Requests"
              subtitle="Allow messages from people you haven't matched with"
              value={privacySettings.allowMessageRequests}
              onValueChange={(v) => updatePrivacySetting('allowMessageRequests', v)}
            />
            <View style={styles.divider} />
            <SettingToggle
              icon="checkmark-done-outline"
              title="Read Receipts"
              subtitle="Let others know when you've read their messages"
              value={privacySettings.showReadReceipts}
              onValueChange={(v) => updatePrivacySetting('showReadReceipts', v)}
            />
          </View>
        </View>

        {/* Security Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Security</Text>
          <View style={styles.card}>
            <MenuRow
              icon="key-outline"
              title="Change Password"
              subtitle="Update your account password"
              onPress={() => setChangePasswordModal(true)}
            />
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingIconContainer}>
                <Ionicons name="shield-checkmark-outline" size={22} color={Colors.primary} />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Two-Factor Authentication</Text>
                <Text style={styles.settingSubtitle}>Add an extra layer of security</Text>
              </View>
              <Switch
                value={twoFactorEnabled}
                onValueChange={handleToggle2FA}
                trackColor={{ false: Colors.gray300, true: Colors.primaryLight }}
                thumbColor={twoFactorEnabled ? Colors.primary : Colors.gray100}
              />
            </View>
            <View style={styles.divider} />
            <MenuRow
              icon="ban-outline"
              title="Blocked Users"
              subtitle="Manage your blocked list"
              onPress={handleBlockedUsers}
            />
          </View>
        </View>

        {/* Data & Privacy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data & Analytics</Text>
          <View style={styles.card}>
            <SettingToggle
              icon="analytics-outline"
              title="Share Usage Data"
              subtitle="Help improve Haven with anonymous usage data"
              value={privacySettings.shareUsageData}
              onValueChange={(v) => updatePrivacySetting('shareUsageData', v)}
            />
            <View style={styles.divider} />
            <SettingToggle
              icon="location-outline"
              title="Location Services"
              subtitle="Enable location-based features"
              value={privacySettings.locationServices}
              onValueChange={(v) => updatePrivacySetting('locationServices', v)}
            />
          </View>
        </View>

        {/* Your Data */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Data</Text>
          <View style={styles.card}>
            <MenuRow
              icon="download-outline"
              title="Download Your Data"
              subtitle="Get a copy of all your Haven data"
              onPress={handleDownloadData}
            />
            <View style={styles.divider} />
            <MenuRow
              icon="trash-outline"
              title="Delete Account"
              subtitle="Permanently delete your account and data"
              onPress={() => setDeleteAccountModal(true)}
              danger
            />
          </View>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="shield-checkmark" size={24} color={Colors.primary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Your privacy matters to us</Text>
            <Text style={styles.infoText}>
              Haven is designed with privacy in mind. We never sell your personal data to third parties.
            </Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Change Password Modal */}
      <Modal
        visible={changePasswordModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setChangePasswordModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setChangePasswordModal(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Change Password</Text>
            <TouchableOpacity onPress={handleChangePassword} disabled={isChangingPassword}>
              {isChangingPassword ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <Text style={styles.saveText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formSection}>
              <Text style={styles.inputLabel}>Current Password</Text>
              <TextInput
                style={styles.input}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Enter current password"
                placeholderTextColor={Colors.gray400}
                secureTextEntry
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.inputLabel}>New Password</Text>
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password"
                placeholderTextColor={Colors.gray400}
                secureTextEntry
              />
              <Text style={styles.inputHint}>Must be at least 8 characters</Text>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.inputLabel}>Confirm New Password</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm new password"
                placeholderTextColor={Colors.gray400}
                secureTextEntry
              />
            </View>

            <View style={styles.passwordTips}>
              <Text style={styles.tipsTitle}>Password Tips:</Text>
              <Text style={styles.tipText}>• Use a mix of letters, numbers, and symbols</Text>
              <Text style={styles.tipText}>• Avoid using personal information</Text>
              <Text style={styles.tipText}>• Don't reuse passwords from other sites</Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Delete Account Modal */}
      <Modal
        visible={deleteAccountModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setDeleteAccountModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setDeleteAccountModal(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Delete Account</Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.deleteWarning}>
              <Ionicons name="warning" size={48} color={Colors.error} />
              <Text style={styles.deleteTitle}>This action cannot be undone</Text>
              <Text style={styles.deleteText}>
                Deleting your account will permanently remove:
              </Text>
              <View style={styles.deleteList}>
                <Text style={styles.deleteItem}>• Your profile and photos</Text>
                <Text style={styles.deleteItem}>• All your matches and conversations</Text>
                <Text style={styles.deleteItem}>• Your community posts and comments</Text>
                <Text style={styles.deleteItem}>• Your learning progress and achievements</Text>
              </View>
              <Text style={styles.deleteNote}>
                You'll have 30 days to reactivate your account by logging in again.
              </Text>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.inputLabel}>Type "delete my account" to confirm</Text>
              <TextInput
                style={styles.input}
                value={deleteConfirmText}
                onChangeText={setDeleteConfirmText}
                placeholder="delete my account"
                placeholderTextColor={Colors.gray400}
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity
              style={[
                styles.deleteButton,
                deleteConfirmText.toLowerCase() !== 'delete my account' && styles.deleteButtonDisabled,
              ]}
              onPress={handleDeleteAccount}
              disabled={deleteConfirmText.toLowerCase() !== 'delete my account'}
            >
              <Ionicons name="trash" size={20} color="white" />
              <Text style={styles.deleteButtonText}>Delete My Account</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.gray900,
  },
  placeholder: {
    width: 40,
  },
  section: {
    marginTop: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Colors.gray500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginLeft: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  card: {
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  settingIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: `${Colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  dangerIcon: {
    backgroundColor: `${Colors.error}15`,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    ...Typography.body,
    fontWeight: '500',
    color: Colors.gray900,
  },
  settingSubtitle: {
    ...Typography.caption,
    color: Colors.gray500,
    marginTop: 2,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.gray100,
    marginLeft: 68,
  },
  dangerText: {
    color: Colors.error,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: `${Colors.primary}10`,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: `${Colors.primary}30`,
  },
  infoContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  infoTitle: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 4,
  },
  infoText: {
    ...Typography.bodySmall,
    color: Colors.gray600,
    lineHeight: 20,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.gray50,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  modalTitle: {
    ...Typography.h3,
    color: Colors.gray900,
  },
  cancelText: {
    ...Typography.body,
    color: Colors.gray500,
  },
  saveText: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.primary,
  },
  modalContent: {
    flex: 1,
    padding: Spacing.lg,
  },
  formSection: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Colors.gray700,
    marginBottom: Spacing.xs,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.gray200,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    ...Typography.body,
    color: Colors.gray900,
  },
  inputHint: {
    ...Typography.caption,
    color: Colors.gray500,
    marginTop: Spacing.xs,
  },
  passwordTips: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginTop: Spacing.lg,
  },
  tipsTitle: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.gray900,
    marginBottom: Spacing.sm,
  },
  tipText: {
    ...Typography.bodySmall,
    color: Colors.gray600,
    marginBottom: 4,
  },
  // Delete account styles
  deleteWarning: {
    alignItems: 'center',
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  deleteTitle: {
    ...Typography.h3,
    color: Colors.error,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  deleteText: {
    ...Typography.body,
    color: Colors.gray600,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  deleteList: {
    alignSelf: 'stretch',
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  deleteItem: {
    ...Typography.body,
    color: Colors.gray700,
    marginBottom: 8,
  },
  deleteNote: {
    ...Typography.bodySmall,
    color: Colors.gray500,
    textAlign: 'center',
    marginTop: Spacing.md,
    fontStyle: 'italic',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.error,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  deleteButtonDisabled: {
    backgroundColor: Colors.gray300,
  },
  deleteButtonText: {
    ...Typography.body,
    fontWeight: '600',
    color: 'white',
  },
});

export default PrivacySecurityScreen;
