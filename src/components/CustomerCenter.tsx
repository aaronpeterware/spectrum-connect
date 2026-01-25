import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePurchases } from '../context/PurchaseContext';
import { useTheme } from '../hooks/useTheme';
import { getManagementURL } from '../services/revenueCatService';
import { Colors, Spacing, BorderRadius, Typography } from '../constants/theme';

interface CustomerCenterProps {
  onClose?: () => void;
}

const CustomerCenter: React.FC<CustomerCenterProps> = ({ onClose }) => {
  const { colors, isDark } = useTheme();
  const { customerInfo, isProUser, restorePurchases } = usePurchases();
  const [isRestoring, setIsRestoring] = useState(false);
  const [isLoadingManagement, setIsLoadingManagement] = useState(false);

  const handleRestorePurchases = async () => {
    setIsRestoring(true);
    try {
      const result = await restorePurchases();
      if (result.hasProAccess) {
        Alert.alert('Success', 'Your purchases have been restored.');
      } else {
        Alert.alert('No Purchases Found', 'We couldn\'t find any previous purchases.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to restore purchases');
    } finally {
      setIsRestoring(false);
    }
  };

  const handleManageSubscription = async () => {
    setIsLoadingManagement(true);
    try {
      const managementUrl = await getManagementURL();
      if (managementUrl) {
        await Linking.openURL(managementUrl);
      } else {
        // Fallback to App Store subscriptions
        await Linking.openURL('https://apps.apple.com/account/subscriptions');
      }
    } catch (error: any) {
      Alert.alert('Error', 'Unable to open subscription management.');
    } finally {
      setIsLoadingManagement(false);
    }
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getActiveEntitlement = () => {
    if (!customerInfo?.entitlements?.active) return null;
    const activeEntitlements = Object.values(customerInfo.entitlements.active);
    return activeEntitlements[0] || null;
  };

  const activeEntitlement = getActiveEntitlement();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        {onClose && (
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={28} color={colors.text} />
          </TouchableOpacity>
        )}
        <Text style={[styles.title, { color: colors.text }]}>Subscription</Text>
      </View>

      {/* Status Card */}
      <View style={[styles.statusCard, { backgroundColor: colors.cardBackground }]}>
        <View style={styles.statusHeader}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: isProUser ? Colors.primary : Colors.gray400 },
            ]}
          >
            <Ionicons
              name={isProUser ? 'checkmark-circle' : 'close-circle'}
              size={20}
              color="white"
            />
            <Text style={styles.statusBadgeText}>
              {isProUser ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>

        <Text style={[styles.planName, { color: colors.text }]}>
          {isProUser ? 'Haven Pro' : 'Free Plan'}
        </Text>

        {activeEntitlement && (
          <View style={styles.subscriptionDetails}>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                Renews
              </Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {formatDate(activeEntitlement.expirationDate)}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                Product
              </Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {activeEntitlement.productIdentifier}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        {isProUser && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.cardBackground }]}
            onPress={handleManageSubscription}
            disabled={isLoadingManagement}
          >
            <Ionicons name="settings-outline" size={24} color={Colors.primary} />
            <View style={styles.actionTextContainer}>
              <Text style={[styles.actionTitle, { color: colors.text }]}>
                Manage Subscription
              </Text>
              <Text style={[styles.actionSubtitle, { color: colors.textSecondary }]}>
                Change or cancel your plan
              </Text>
            </View>
            {isLoadingManagement ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.cardBackground }]}
          onPress={handleRestorePurchases}
          disabled={isRestoring}
        >
          <Ionicons name="refresh-outline" size={24} color={Colors.primary} />
          <View style={styles.actionTextContainer}>
            <Text style={[styles.actionTitle, { color: colors.text }]}>
              Restore Purchases
            </Text>
            <Text style={[styles.actionSubtitle, { color: colors.textSecondary }]}>
              Restore previous purchases
            </Text>
          </View>
          {isRestoring ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.cardBackground }]}
          onPress={() => Linking.openURL('mailto:support@haven.app')}
        >
          <Ionicons name="help-circle-outline" size={24} color={Colors.primary} />
          <View style={styles.actionTextContainer}>
            <Text style={[styles.actionTitle, { color: colors.text }]}>
              Contact Support
            </Text>
            <Text style={[styles.actionSubtitle, { color: colors.textSecondary }]}>
              Get help with your subscription
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Terms Link */}
      <TouchableOpacity
        style={styles.termsLink}
        onPress={() => Linking.openURL('https://haven.app/terms')}
      >
        <Text style={[styles.termsText, { color: Colors.primary }]}>
          Terms of Service
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.termsLink}
        onPress={() => Linking.openURL('https://haven.app/privacy')}
      >
        <Text style={[styles.termsText, { color: Colors.primary }]}>
          Privacy Policy
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    left: 0,
    padding: Spacing.sm,
  },
  title: {
    ...Typography.h2,
  },
  statusCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.lg,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: Spacing.md,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  statusBadgeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  planName: {
    ...Typography.h1,
    marginBottom: Spacing.md,
  },
  subscriptionDetails: {
    gap: Spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    ...Typography.bodySmall,
  },
  detailValue: {
    ...Typography.bodySmall,
    fontWeight: '600',
  },
  actionsContainer: {
    gap: Spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    ...Typography.body,
    fontWeight: '600',
  },
  actionSubtitle: {
    ...Typography.caption,
    marginTop: 2,
  },
  termsLink: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    marginTop: Spacing.sm,
  },
  termsText: {
    ...Typography.bodySmall,
    fontWeight: '500',
  },
});

export default CustomerCenter;
