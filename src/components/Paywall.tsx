import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { usePurchases } from '../context/PurchaseContext';
import { useTheme } from '../hooks/useTheme';
import { Colors, Spacing, BorderRadius, Typography } from '../constants/theme';
import {
  trackPaywallViewed,
  trackPlanSelected,
  trackPurchaseInitiated,
  trackPurchaseCompleted,
  trackPurchaseFailed,
  trackPurchaseCancelled,
  trackPurchaseRestored,
  trackPaywallDismissed,
} from '../services/analyticsService';

interface PaywallProps {
  onClose?: () => void;
  onPurchaseComplete?: () => void;
}

const Paywall: React.FC<PaywallProps> = ({ onClose, onPurchaseComplete }) => {
  const { colors, isDark } = useTheme();
  const {
    offerings,
    isLoading,
    isProUser,
    purchaseProduct,
    restorePurchases,
    refreshOfferings,
  } = usePurchases();

  const [selectedPackage, setSelectedPackage] = useState<any | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [paywallSource] = useState<'onboarding' | 'store' | 'feature_gate'>('onboarding');

  useEffect(() => {
    refreshOfferings();
  }, []);

  // Track paywall view when offerings load
  useEffect(() => {
    if (offerings?.current?.availablePackages) {
      trackPaywallViewed(paywallSource, offerings.current.availablePackages.length);
    }
  }, [offerings]);

  // Select the default package (usually annual for best value)
  useEffect(() => {
    if (offerings?.current?.availablePackages) {
      const annual = offerings.current.availablePackages.find(
        pkg => pkg.identifier === '$rc_annual' || pkg.identifier === 'yearly'
      );
      const monthly = offerings.current.availablePackages.find(
        pkg => pkg.identifier === '$rc_monthly' || pkg.identifier === 'monthly'
      );
      setSelectedPackage(annual || monthly || offerings.current.availablePackages[0]);
    }
  }, [offerings]);

  const handlePurchase = async () => {
    if (!selectedPackage) return;

    const planType = selectedPackage.identifier || 'unknown';
    const price = selectedPackage.product?.priceString || 'unknown';

    trackPurchaseInitiated(planType, price);
    setIsPurchasing(true);

    try {
      const result = await purchaseProduct(selectedPackage);

      if (result.success) {
        trackPurchaseCompleted(planType, price);
        Alert.alert(
          'Welcome to Haven Pro!',
          'You now have unlimited access to all Haven features.',
          [{ text: 'Continue', onPress: onPurchaseComplete }]
        );
      } else if (result.error) {
        if (result.error === 'Purchase cancelled') {
          trackPurchaseCancelled(planType);
        } else {
          trackPurchaseFailed(planType, 'purchase_error', result.error);
          Alert.alert('Purchase Failed', result.error);
        }
      }
    } catch (error: any) {
      trackPurchaseFailed(planType, 'exception', error.message || 'Something went wrong');
      Alert.alert('Error', error.message || 'Something went wrong');
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      const result = await restorePurchases();

      if (result.hasProAccess) {
        trackPurchaseRestored('restored');
        Alert.alert(
          'Purchases Restored',
          'Your Haven Pro subscription has been restored.',
          [{ text: 'Continue', onPress: onPurchaseComplete }]
        );
      } else {
        Alert.alert(
          'No Purchases Found',
          'We couldn\'t find any previous purchases to restore.'
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to restore purchases');
    } finally {
      setIsRestoring(false);
    }
  };

  const handleClose = () => {
    trackPaywallDismissed(paywallSource);
    if (onClose) {
      onClose();
    }
  };

  const handleSelectPackage = (pkg: any) => {
    setSelectedPackage(pkg);
    const planType = pkg.identifier || 'unknown';
    const price = pkg.product?.priceString || 'unknown';
    trackPlanSelected(planType, price);
  };

  const formatPrice = (pkg: PurchasesPackage): string => {
    return pkg.product.priceString;
  };

  const getPeriodText = (pkg: PurchasesPackage): string => {
    switch (pkg.packageType) {
      case 'MONTHLY':
        return '/month';
      case 'ANNUAL':
        return '/year';
      case 'LIFETIME':
        return 'one-time';
      default:
        return '';
    }
  };

  const getSavingsText = (pkg: PurchasesPackage): string | null => {
    if (pkg.packageType === 'ANNUAL') {
      return 'Save 50%';
    }
    if (pkg.packageType === 'LIFETIME') {
      return 'Best Value';
    }
    return null;
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (isProUser) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.proContainer}>
          <Ionicons name="checkmark-circle" size={64} color={Colors.primary} />
          <Text style={[styles.proTitle, { color: colors.text }]}>
            You're a Haven Pro member!
          </Text>
          <Text style={[styles.proSubtitle, { color: colors.textSecondary }]}>
            Enjoy unlimited access to all features.
          </Text>
          {onClose && (
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  const packages = offerings?.current?.availablePackages || [];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Header */}
      <View style={styles.header}>
        {onClose && (
          <TouchableOpacity style={styles.closeIcon} onPress={handleClose}>
            <Ionicons name="close" size={28} color={colors.text} />
          </TouchableOpacity>
        )}
        <LinearGradient
          colors={[Colors.gradientPink, Colors.gradientPurple]}
          style={styles.iconContainer}
        >
          <Ionicons name="star" size={40} color="white" />
        </LinearGradient>
        <Text style={[styles.title, { color: colors.text }]}>
          Upgrade to Haven Pro
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Unlock the full Haven experience
        </Text>
      </View>

      {/* Features */}
      <View style={styles.featuresContainer}>
        <FeatureItem
          icon="infinite"
          title="Unlimited Voice Calls"
          description="Talk with companions without limits"
          colors={colors}
        />
        <FeatureItem
          icon="chatbubbles"
          title="Unlimited Chat"
          description="Send unlimited messages"
          colors={colors}
        />
        <FeatureItem
          icon="people"
          title="All Companions"
          description="Access all 20 AI companions"
          colors={colors}
        />
        <FeatureItem
          icon="sparkles"
          title="Priority Features"
          description="Early access to new features"
          colors={colors}
        />
      </View>

      {/* Packages */}
      <View style={styles.packagesContainer}>
        {packages.map((pkg) => (
          <TouchableOpacity
            key={pkg.identifier}
            style={[
              styles.packageCard,
              { backgroundColor: colors.cardBackground },
              selectedPackage?.identifier === pkg.identifier && styles.packageCardSelected,
            ]}
            onPress={() => handleSelectPackage(pkg)}
          >
            {getSavingsText(pkg) && (
              <View style={styles.savingsBadge}>
                <Text style={styles.savingsText}>{getSavingsText(pkg)}</Text>
              </View>
            )}
            <View style={styles.packageRadio}>
              <View
                style={[
                  styles.radioOuter,
                  selectedPackage?.identifier === pkg.identifier && styles.radioOuterSelected,
                ]}
              >
                {selectedPackage?.identifier === pkg.identifier && (
                  <View style={styles.radioInner} />
                )}
              </View>
            </View>
            <View style={styles.packageInfo}>
              <Text style={[styles.packageTitle, { color: colors.text }]}>
                {pkg.product.title || pkg.identifier}
              </Text>
              <Text style={[styles.packagePrice, { color: colors.text }]}>
                {formatPrice(pkg)}{getPeriodText(pkg)}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Purchase Button */}
      <TouchableOpacity
        style={[styles.purchaseButton, (!selectedPackage || isPurchasing) && styles.purchaseButtonDisabled]}
        onPress={handlePurchase}
        disabled={!selectedPackage || isPurchasing}
      >
        <LinearGradient
          colors={[Colors.gradientPink, Colors.gradientPurple]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.purchaseButtonGradient}
        >
          {isPurchasing ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.purchaseButtonText}>Continue</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>

      {/* Restore Purchases */}
      <TouchableOpacity
        style={styles.restoreButton}
        onPress={handleRestore}
        disabled={isRestoring}
      >
        {isRestoring ? (
          <ActivityIndicator size="small" color={Colors.primary} />
        ) : (
          <Text style={[styles.restoreText, { color: Colors.primary }]}>
            Restore Purchases
          </Text>
        )}
      </TouchableOpacity>

      {/* Terms */}
      <Text style={[styles.termsText, { color: colors.textSecondary }]}>
        Payment will be charged to your Apple ID account. Subscription automatically renews unless cancelled at least 24 hours before the end of the current period.
      </Text>

      {/* Legal Links */}
      <View style={styles.legalLinks}>
        <TouchableOpacity onPress={() => Linking.openURL('https://public-c1zlwa17m-hello-2125s-projects.vercel.app/terms.html')}>
          <Text style={[styles.legalLink, { color: Colors.primary }]}>Terms of Use</Text>
        </TouchableOpacity>
        <Text style={[styles.legalDivider, { color: colors.textSecondary }]}>•</Text>
        <TouchableOpacity onPress={() => Linking.openURL('https://public-c1zlwa17m-hello-2125s-projects.vercel.app/privacy.html')}>
          <Text style={[styles.legalLink, { color: Colors.primary }]}>Privacy Policy</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

interface FeatureItemProps {
  icon: string;
  title: string;
  description: string;
  colors: any;
}

const FeatureItem: React.FC<FeatureItemProps> = ({ icon, title, description, colors }) => (
  <View style={styles.featureItem}>
    <View style={styles.featureIcon}>
      <Ionicons name={icon as any} size={24} color={Colors.primary} />
    </View>
    <View style={styles.featureText}>
      <Text style={[styles.featureTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>
        {description}
      </Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xl * 2,
  },
  header: {
    alignItems: 'center',
    paddingTop: Spacing.xl * 2,
    paddingHorizontal: Spacing.lg,
  },
  closeIcon: {
    position: 'absolute',
    top: Spacing.lg,
    right: Spacing.lg,
    padding: Spacing.sm,
    zIndex: 1,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.h1,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
    textAlign: 'center',
  },
  featuresContainer: {
    padding: Spacing.lg,
    marginTop: Spacing.lg,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${Colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    ...Typography.body,
    fontWeight: '600',
    marginBottom: 2,
  },
  featureDescription: {
    ...Typography.bodySmall,
  },
  packagesContainer: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.md,
  },
  packageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
    overflow: 'hidden',
  },
  packageCardSelected: {
    borderColor: Colors.primary,
  },
  savingsBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderBottomLeftRadius: BorderRadius.sm,
  },
  savingsText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  packageRadio: {
    marginRight: Spacing.md,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.gray300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: Colors.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  packageInfo: {
    flex: 1,
  },
  packageTitle: {
    ...Typography.body,
    fontWeight: '600',
    marginBottom: 2,
  },
  packagePrice: {
    ...Typography.bodySmall,
  },
  purchaseButton: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  purchaseButtonDisabled: {
    opacity: 0.6,
  },
  purchaseButtonGradient: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  purchaseButtonText: {
    ...Typography.body,
    color: 'white',
    fontWeight: '700',
  },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
  },
  restoreText: {
    ...Typography.bodySmall,
    fontWeight: '600',
  },
  termsText: {
    ...Typography.caption,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.md,
  },
  legalLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  legalLink: {
    ...Typography.bodySmall,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  legalDivider: {
    ...Typography.bodySmall,
  },
  proContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  proTitle: {
    ...Typography.h2,
    marginTop: Spacing.lg,
    textAlign: 'center',
  },
  proSubtitle: {
    ...Typography.body,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  closeButton: {
    marginTop: Spacing.xl,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
  },
  closeButtonText: {
    ...Typography.body,
    color: 'white',
    fontWeight: '600',
  },
});

export default Paywall;
