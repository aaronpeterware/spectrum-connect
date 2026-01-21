import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, BorderRadius, Typography } from '../constants/theme';
import MenuModal from '../components/MenuModal';
import { usePurchases } from '../context/PurchaseContext';
import { PRODUCT_IDS } from '../services/PurchaseService';

const { width } = Dimensions.get('window');

// Featured moment bundles (on sale) - linked to App Store product IDs
const featuredBundles = [
  {
    id: 'starter',
    productId: PRODUCT_IDS.MOMENTS_STARTER,
    name: 'Starter Pack',
    moments: 10000,
    price: 19.99,
    originalPrice: 24.99,
    savings: 20,
    icon: 'flash',
    gradient: [Colors.gradientPink, Colors.gradientPurple] as const,
  },
  {
    id: 'heart',
    productId: PRODUCT_IDS.MOMENTS_HEART,
    name: 'Heart to Heart',
    moments: 22000,
    price: 39.99,
    originalPrice: 56.99,
    savings: 30,
    icon: 'heart',
    gradient: [Colors.gradientPurple, Colors.gradientBlue] as const,
  },
  {
    id: 'deep',
    productId: PRODUCT_IDS.MOMENTS_DEEP,
    name: 'Deep Dive',
    moments: 45000,
    price: 74.99,
    originalPrice: 124.99,
    savings: 40,
    icon: 'water',
    gradient: [Colors.gradientBlue, Colors.gradientMint] as const,
  },
  {
    id: 'unlimited',
    productId: PRODUCT_IDS.MOMENTS_UNLIMITED,
    name: 'Unlimited',
    moments: 200000,
    price: 249.99,
    originalPrice: 499.99,
    savings: 50,
    icon: 'infinite',
    gradient: ['#FFD700', '#FFA500'] as const,
    featured: true,
  },
];

// Standard moment bundles - linked to App Store product IDs
const standardBundles = [
  {
    id: 'quick',
    productId: PRODUCT_IDS.MOMENTS_QUICK,
    name: 'Quick Chat',
    moments: 1800,
    price: 5.99,
    icon: 'chatbubble',
  },
  {
    id: 'chat',
    productId: PRODUCT_IDS.MOMENTS_CHAT,
    name: 'Chat Pack',
    moments: 4000,
    price: 11.99,
    icon: 'chatbubbles',
  },
];

// Subscription plans - linked to App Store product IDs
const subscriptionPlans = [
  {
    id: 'pro',
    productId: PRODUCT_IDS.SUB_PRO_MONTHLY,
    name: 'Pro',
    price: 14.99,
    period: 'month',
    tier: 'pro' as const,
    features: [
      'Community access',
      'Dating tips & advice',
      'All courses included',
      '100 responses/day',
      '1,000 moments/month',
      'Voice calls',
    ],
  },
  {
    id: 'premium',
    productId: PRODUCT_IDS.SUB_PREMIUM_MONTHLY,
    name: 'Premium',
    price: 29.99,
    period: 'month',
    tier: 'premium' as const,
    features: [
      'Everything in Pro',
      'Unlimited messaging',
      'Priority voice calls',
      '8,000 moments/month',
      'Exclusive companions',
      'Priority support',
    ],
    recommended: true,
  },
];

type TabType = 'moments' | 'subscribe';

const StoreScreen = () => {
  const navigation = useNavigation();
  const [menuVisible, setMenuVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('moments');
  const [isPurchasing, setIsPurchasing] = useState(false);

  const {
    momentsBalance,
    subscriptionTier,
    isLoading,
    purchaseMoments,
    purchaseSubscription,
    restorePurchases,
  } = usePurchases();

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  const handlePurchaseMoments = async (productId: string, bundleName: string) => {
    setIsPurchasing(true);
    try {
      const result = await purchaseMoments(productId);
      if (result.success) {
        Alert.alert(
          'Purchase Successful!',
          `You've added ${formatNumber(result.moments || 0)} moments to your balance.`,
          [{ text: 'OK' }]
        );
      } else if (result.error !== 'Purchase cancelled') {
        Alert.alert('Purchase Failed', result.error || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsPurchasing(false);
    }
  };

  const handlePurchaseSubscription = async (productId: string, planName: string) => {
    setIsPurchasing(true);
    try {
      const result = await purchaseSubscription(productId);
      if (result.success) {
        Alert.alert(
          'Subscription Activated!',
          `Welcome to ${planName}! Your subscription is now active.`,
          [{ text: 'OK' }]
        );
      } else if (result.error !== 'Purchase cancelled') {
        Alert.alert('Subscription Failed', result.error || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestorePurchases = async () => {
    setIsPurchasing(true);
    try {
      await restorePurchases();
      Alert.alert('Restore Complete', 'Your purchases have been restored.');
    } catch (error) {
      Alert.alert('Error', 'Failed to restore purchases. Please try again.');
    } finally {
      setIsPurchasing(false);
    }
  };

  const renderMomentsTab = () => (
    <>
      {/* Featured Bundles */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured</Text>
          <View style={styles.saleBadge}>
            <Text style={styles.saleBadgeText}>SALE</Text>
          </View>
        </View>

        <View style={styles.bundlesGrid}>
          {featuredBundles.map((bundle) => (
            <TouchableOpacity
              key={bundle.id}
              style={[styles.bundleCard, bundle.featured && styles.bundleCardFeatured]}
              onPress={() => handlePurchaseMoments(bundle.productId, bundle.name)}
              disabled={isPurchasing}
            >
              {bundle.featured && (
                <View style={styles.megaBadge}>
                  <Text style={styles.megaBadgeText}>MEGA</Text>
                </View>
              )}
              <LinearGradient
                colors={bundle.gradient}
                style={styles.bundleIcon}
              >
                <Ionicons name={bundle.icon as any} size={24} color="white" />
              </LinearGradient>
              <Text style={styles.bundleName}>{bundle.name}</Text>
              <Text style={styles.bundleMoments}>{formatNumber(bundle.moments)} moments</Text>
              <View style={styles.priceContainer}>
                <Text style={styles.bundlePrice}>${bundle.price}</Text>
                {bundle.originalPrice && (
                  <Text style={styles.originalPrice}>${bundle.originalPrice}</Text>
                )}
              </View>
              <View style={styles.savingsBadge}>
                <Text style={styles.savingsText}>Save {bundle.savings}%</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Standard Bundles */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Standard</Text>

        <View style={styles.standardBundles}>
          {standardBundles.map((bundle) => (
            <TouchableOpacity
              key={bundle.id}
              style={styles.standardBundleCard}
              onPress={() => handlePurchaseMoments(bundle.productId, bundle.name)}
              disabled={isPurchasing}
            >
              <View style={styles.standardBundleLeft}>
                <View style={styles.standardBundleIcon}>
                  <Ionicons name={bundle.icon as any} size={20} color={Colors.primary} />
                </View>
                <View>
                  <Text style={styles.standardBundleName}>{bundle.name}</Text>
                  <Text style={styles.standardBundleMoments}>{formatNumber(bundle.moments)} moments</Text>
                </View>
              </View>
              <View style={styles.standardBundleRight}>
                <Text style={styles.standardBundlePrice}>${bundle.price}</Text>
                <Ionicons name="chevron-forward" size={20} color={Colors.gray400} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <Ionicons name="information-circle" size={24} color={Colors.primary} />
        <View style={styles.infoContent}>
          <Text style={styles.infoTitle}>What are moments?</Text>
          <Text style={styles.infoText}>
            Moments are used for AI companion conversations. Voice calls use 100 moments per minute.
          </Text>
        </View>
      </View>
    </>
  );

  const renderSubscribeTab = () => {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Choose Your Plan</Text>

        <View style={styles.subscriptionContainer}>
          {subscriptionPlans.map((sub) => {
            const isCurrentPlan = subscriptionTier === sub.tier;
            return (
              <View
                key={sub.id}
                style={[
                  styles.subscriptionCard,
                  sub.recommended && styles.subscriptionCardRecommended,
                  isCurrentPlan && styles.subscriptionCardCurrent,
                ]}
              >
                {sub.recommended && !isCurrentPlan && (
                  <LinearGradient
                    colors={[Colors.gradientPurple, Colors.gradientBlue]}
                    style={styles.recommendedBadge}
                  >
                    <Text style={styles.recommendedText}>BEST VALUE</Text>
                  </LinearGradient>
                )}
                {isCurrentPlan && (
                  <View style={styles.currentBadge}>
                    <Text style={styles.currentBadgeText}>CURRENT PLAN</Text>
                  </View>
                )}

                <Text style={styles.subName}>{sub.name}</Text>
                <View style={styles.priceRow}>
                  <Text style={styles.subPrice}>${sub.price}</Text>
                  <Text style={styles.subPeriod}>/{sub.period}</Text>
                </View>

                <View style={styles.featuresList}>
                  {sub.features.map((feature, index) => (
                    <View key={index} style={styles.featureRow}>
                      <Ionicons
                        name="checkmark-circle"
                        size={18}
                        color={sub.recommended ? Colors.primary : Colors.success}
                      />
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  style={[
                    styles.subscribeButton,
                    sub.recommended && styles.subscribeButtonPrimary,
                    isCurrentPlan && styles.subscribeButtonDisabled,
                  ]}
                  disabled={isCurrentPlan || isPurchasing}
                  onPress={() => handlePurchaseSubscription(sub.productId, sub.name)}
                >
                  <Text
                    style={[
                      styles.subscribeButtonText,
                      sub.recommended && styles.subscribeButtonTextPrimary,
                    ]}
                  >
                    {isCurrentPlan ? 'Current Plan' : 'Subscribe'}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {/* Restore Purchases Button */}
        <TouchableOpacity
          style={styles.restoreButton}
          onPress={handleRestorePurchases}
          disabled={isPurchasing}
        >
          <Text style={styles.restoreButtonText}>Restore Purchases</Text>
        </TouchableOpacity>

        {/* Billing Info */}
        <View style={styles.billingInfo}>
          <Text style={styles.billingTitle}>Billing Options</Text>
          <Text style={styles.billingText}>
            Save up to 33% with annual billing. Cancel anytime.
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <MenuModal visible={menuVisible} onClose={() => setMenuVisible(false)} />

      {/* Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.gray900} />
        </TouchableOpacity>
        <View style={styles.logoContainer}>
          <Text style={styles.logoTextSpectrum}>Spectrum</Text>
          <Text style={styles.logoTextConnect}>Connect</Text>
        </View>
        <TouchableOpacity style={styles.menuButton} onPress={() => setMenuVisible(true)}>
          <Ionicons name="menu" size={24} color={Colors.gray900} />
        </TouchableOpacity>
      </View>

      {/* Balance Card */}
      <View style={styles.balanceContainer}>
        <LinearGradient
          colors={[Colors.gradientPurple, Colors.gradientBlue]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.balanceCard}
        >
          <View style={styles.balanceLeft}>
            <Text style={styles.balanceLabel}>Your Balance</Text>
            <Text style={styles.balanceAmount}>{formatNumber(momentsBalance)} moments</Text>
          </View>
          <View style={styles.balanceIcon}>
            <Ionicons name="wallet" size={32} color="white" />
          </View>
        </LinearGradient>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'moments' && styles.tabActive]}
          onPress={() => setActiveTab('moments')}
        >
          <Ionicons
            name="chatbubbles"
            size={18}
            color={activeTab === 'moments' ? Colors.primary : Colors.gray500}
          />
          <Text style={[styles.tabText, activeTab === 'moments' && styles.tabTextActive]}>
            Moments
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'subscribe' && styles.tabActive]}
          onPress={() => setActiveTab('subscribe')}
        >
          <Ionicons
            name="star"
            size={18}
            color={activeTab === 'subscribe' ? Colors.primary : Colors.gray500}
          />
          <Text style={[styles.tabText, activeTab === 'subscribe' && styles.tabTextActive]}>
            Subscribe
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {activeTab === 'moments' ? renderMomentsTab() : renderSubscribeTab()}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Loading Overlay */}
      {isPurchasing && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Processing...</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray50,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  logoTextSpectrum: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.gray900,
  },
  logoTextConnect: {
    fontSize: 18,
    fontWeight: '300',
    color: Colors.primary,
    fontStyle: 'italic',
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  balanceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
  },
  balanceLeft: {},
  balanceLabel: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
  },
  balanceIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surface,
    gap: Spacing.xs,
  },
  tabActive: {
    backgroundColor: `${Colors.primary}15`,
  },
  tabText: {
    ...Typography.body,
    fontWeight: '500',
    color: Colors.gray500,
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.gray900,
  },
  saleBadge: {
    backgroundColor: Colors.error,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  saleBadgeText: {
    ...Typography.caption,
    color: 'white',
    fontWeight: '700',
    fontSize: 10,
  },
  bundlesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  bundleCard: {
    width: (width - Spacing.lg * 2 - Spacing.md) / 2,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    shadowColor: Colors.gray900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  bundleCardFeatured: {
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  megaBadge: {
    position: 'absolute',
    top: -10,
    right: Spacing.md,
    backgroundColor: '#FFD700',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  megaBadgeText: {
    ...Typography.caption,
    color: '#000',
    fontWeight: '700',
    fontSize: 10,
  },
  bundleIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  bundleName: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.gray900,
  },
  bundleMoments: {
    ...Typography.caption,
    color: Colors.gray500,
    marginTop: 2,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  bundlePrice: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
  },
  originalPrice: {
    ...Typography.caption,
    color: Colors.gray400,
    textDecorationLine: 'line-through',
  },
  savingsBadge: {
    backgroundColor: `${Colors.success}15`,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    alignSelf: 'flex-start',
    marginTop: Spacing.xs,
  },
  savingsText: {
    ...Typography.caption,
    color: Colors.success,
    fontWeight: '600',
    fontSize: 11,
  },
  standardBundles: {
    gap: Spacing.sm,
  },
  standardBundleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    shadowColor: Colors.gray900,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  standardBundleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  standardBundleIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: `${Colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  standardBundleName: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.gray900,
  },
  standardBundleMoments: {
    ...Typography.caption,
    color: Colors.gray500,
  },
  standardBundleRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  standardBundlePrice: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.primary,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: `${Colors.primary}10`,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.gray900,
    marginBottom: 4,
  },
  infoText: {
    ...Typography.bodySmall,
    color: Colors.gray600,
    lineHeight: 20,
  },
  subscriptionContainer: {
    gap: Spacing.lg,
  },
  subscriptionCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.gray200,
    shadowColor: Colors.gray900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  subscriptionCardRecommended: {
    borderColor: Colors.primary,
  },
  subscriptionCardCurrent: {
    borderColor: Colors.success,
    backgroundColor: `${Colors.success}08`,
  },
  recommendedBadge: {
    position: 'absolute',
    top: -12,
    left: '50%',
    transform: [{ translateX: -50 }],
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  recommendedText: {
    ...Typography.caption,
    color: 'white',
    fontWeight: '700',
    fontSize: 11,
  },
  currentBadge: {
    position: 'absolute',
    top: -10,
    left: '50%',
    transform: [{ translateX: -55 }],
    backgroundColor: Colors.gray500,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  currentBadgeText: {
    ...Typography.caption,
    color: 'white',
    fontWeight: '600',
    fontSize: 10,
  },
  subName: {
    ...Typography.h3,
    color: Colors.gray900,
    marginTop: Spacing.sm,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: Spacing.xs,
  },
  subPrice: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.gray900,
  },
  subPeriod: {
    ...Typography.body,
    color: Colors.gray500,
    marginLeft: 4,
  },
  featuresList: {
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  featureText: {
    ...Typography.body,
    color: Colors.gray700,
  },
  subscribeButton: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    backgroundColor: Colors.gray100,
  },
  subscribeButtonPrimary: {
    backgroundColor: Colors.primary,
  },
  subscribeButtonDisabled: {
    backgroundColor: Colors.gray200,
  },
  subscribeButtonText: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.gray700,
  },
  subscribeButtonTextPrimary: {
    color: 'white',
  },
  billingInfo: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginTop: Spacing.lg,
  },
  billingTitle: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.gray900,
    marginBottom: 4,
  },
  billingText: {
    ...Typography.bodySmall,
    color: Colors.gray500,
  },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    marginTop: Spacing.lg,
  },
  restoreButtonText: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '500',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    shadowColor: Colors.gray900,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.gray700,
    marginTop: Spacing.md,
  },
});

export default StoreScreen;
