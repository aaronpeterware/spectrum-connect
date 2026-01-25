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
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, BorderRadius, Typography } from '../constants/theme';
import MenuModal from '../components/MenuModal';
import Paywall from '../components/Paywall';
import CustomerCenter from '../components/CustomerCenter';
import { usePurchases } from '../context/PurchaseContext';
import { useTheme } from '../hooks/useTheme';

const { width } = Dimensions.get('window');

type TabType = 'moments' | 'subscribe';

const StoreScreen = () => {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();
  const [menuVisible, setMenuVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('subscribe');
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showCustomerCenter, setShowCustomerCenter] = useState(false);

  const {
    momentsBalance,
    isProUser,
    isLoading,
    offerings,
    purchaseProduct,
    restorePurchases,
  } = usePurchases();

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  const handleRestorePurchases = async () => {
    setIsPurchasing(true);
    try {
      const result = await restorePurchases();
      if (result.hasProAccess) {
        Alert.alert('Restore Complete', 'Your Haven Pro subscription has been restored.');
      } else {
        Alert.alert('No Purchases Found', 'We couldn\'t find any previous purchases to restore.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to restore purchases. Please try again.');
    } finally {
      setIsPurchasing(false);
    }
  };

  const renderMomentsTab = () => (
    <>
      {/* Pro Benefits Card */}
      {!isProUser && (
        <TouchableOpacity
          style={styles.proBenefitsCard}
          onPress={() => setShowPaywall(true)}
        >
          <LinearGradient
            colors={[Colors.gradientPink, Colors.gradientPurple]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.proBenefitsGradient}
          >
            <View style={styles.proBenefitsContent}>
              <View style={styles.proBenefitsIcon}>
                <Ionicons name="star" size={24} color="white" />
              </View>
              <View style={styles.proBenefitsText}>
                <Text style={styles.proBenefitsTitle}>Upgrade to Haven Pro</Text>
                <Text style={styles.proBenefitsSubtitle}>
                  Unlimited calls, messages, and more
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="white" />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Info Card */}
      <View style={[styles.infoCard, { backgroundColor: colors.cardBackground }]}>
        <Ionicons name="information-circle" size={24} color={Colors.primary} />
        <View style={styles.infoContent}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>About Moments</Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Moments are used for AI companion conversations. Voice calls use 100 moments per minute, chat uses 1 moment per message.
            {isProUser ? ' As a Haven Pro member, you have unlimited moments!' : ''}
          </Text>
        </View>
      </View>

      {/* Usage Stats */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Usage</Text>
        <View style={[styles.usageCard, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.usageRow}>
            <View style={styles.usageItem}>
              <View style={[styles.usageIcon, { backgroundColor: `${Colors.primary}15` }]}>
                <Ionicons name="call" size={20} color={Colors.primary} />
              </View>
              <Text style={[styles.usageLabel, { color: colors.textSecondary }]}>Voice Calls</Text>
              <Text style={[styles.usageValue, { color: colors.text }]}>
                {isProUser ? 'Unlimited' : '100/min'}
              </Text>
            </View>
            <View style={styles.usageItem}>
              <View style={[styles.usageIcon, { backgroundColor: `${Colors.primary}15` }]}>
                <Ionicons name="chatbubble" size={20} color={Colors.primary} />
              </View>
              <Text style={[styles.usageLabel, { color: colors.textSecondary }]}>Chat</Text>
              <Text style={[styles.usageValue, { color: colors.text }]}>
                {isProUser ? 'Unlimited' : '1/msg'}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </>
  );

  const renderSubscribeTab = () => {
    if (isProUser) {
      return (
        <View style={styles.section}>
          {/* Pro Status Card */}
          <View style={[styles.proStatusCard, { backgroundColor: colors.cardBackground }]}>
            <LinearGradient
              colors={[Colors.gradientPink, Colors.gradientPurple]}
              style={styles.proStatusIcon}
            >
              <Ionicons name="checkmark" size={32} color="white" />
            </LinearGradient>
            <Text style={[styles.proStatusTitle, { color: colors.text }]}>
              You're a Haven Pro member!
            </Text>
            <Text style={[styles.proStatusSubtitle, { color: colors.textSecondary }]}>
              Enjoy unlimited access to all Haven features.
            </Text>
            <TouchableOpacity
              style={styles.manageButton}
              onPress={() => setShowCustomerCenter(true)}
            >
              <Text style={styles.manageButtonText}>Manage Subscription</Text>
            </TouchableOpacity>
          </View>

          {/* Pro Features */}
          <Text style={[styles.sectionTitle, { color: colors.text, marginTop: Spacing.xl }]}>
            Your Benefits
          </Text>
          <View style={[styles.featuresCard, { backgroundColor: colors.cardBackground }]}>
            <FeatureItem icon="infinite" title="Unlimited Voice Calls" colors={colors} />
            <FeatureItem icon="chatbubbles" title="Unlimited Chat Messages" colors={colors} />
            <FeatureItem icon="people" title="All 20 AI Companions" colors={colors} />
            <FeatureItem icon="sparkles" title="Priority Features" colors={colors} />
          </View>
        </View>
      );
    }

    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Choose Your Plan</Text>

        {/* Plans from RevenueCat */}
        {offerings?.current?.availablePackages.map((pkg) => {
          const isYearly = pkg.packageType === 'ANNUAL';
          const isLifetime = pkg.packageType === 'LIFETIME';

          return (
            <TouchableOpacity
              key={pkg.identifier}
              style={[
                styles.planCard,
                { backgroundColor: colors.cardBackground },
                isYearly && styles.planCardRecommended,
              ]}
              onPress={() => setShowPaywall(true)}
            >
              {isYearly && (
                <View style={styles.recommendedBadge}>
                  <Text style={styles.recommendedText}>BEST VALUE</Text>
                </View>
              )}
              {isLifetime && (
                <View style={[styles.recommendedBadge, { backgroundColor: '#FFD700' }]}>
                  <Text style={[styles.recommendedText, { color: '#000' }]}>LIFETIME</Text>
                </View>
              )}
              <View style={styles.planHeader}>
                <Text style={[styles.planTitle, { color: colors.text }]}>
                  {pkg.product.title || 'Haven Pro'}
                </Text>
                <Text style={[styles.planPrice, { color: Colors.primary }]}>
                  {pkg.product.priceString}
                </Text>
              </View>
              <Text style={[styles.planDescription, { color: colors.textSecondary }]}>
                {pkg.product.description || 'Unlimited access to all features'}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* CTA Button */}
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => setShowPaywall(true)}
        >
          <LinearGradient
            colors={[Colors.gradientPink, Colors.gradientPurple]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaButtonGradient}
          >
            <Text style={styles.ctaButtonText}>View All Plans</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Restore Purchases */}
        <TouchableOpacity
          style={styles.restoreButton}
          onPress={handleRestorePurchases}
          disabled={isPurchasing}
        >
          {isPurchasing ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Text style={styles.restoreButtonText}>Restore Purchases</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <MenuModal visible={menuVisible} onClose={() => setMenuVisible(false)} />

      {/* Paywall Modal */}
      <Modal
        visible={showPaywall}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <Paywall
          onClose={() => setShowPaywall(false)}
          onPurchaseComplete={() => setShowPaywall(false)}
        />
      </Modal>

      {/* Customer Center Modal */}
      <Modal
        visible={showCustomerCenter}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <CustomerCenter onClose={() => setShowCustomerCenter(false)} />
        </SafeAreaView>
      </Modal>

      {/* Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.cardBackground }]} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.logoContainer}>
          <Text style={[styles.logoTextSpectrum, { color: colors.text }]}>Haven</Text>
        </View>
        <TouchableOpacity style={[styles.menuButton, { backgroundColor: colors.cardBackground }]} onPress={() => setMenuVisible(true)}>
          <Ionicons name="menu" size={24} color={colors.text} />
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
            <Text style={styles.balanceAmount}>
              {isProUser ? 'Unlimited' : `${formatNumber(momentsBalance)} moments`}
            </Text>
            {isProUser && (
              <View style={styles.proBadge}>
                <Ionicons name="star" size={12} color="white" />
                <Text style={styles.proBadgeText}>PRO</Text>
              </View>
            )}
          </View>
          <View style={styles.balanceIcon}>
            <Ionicons name={isProUser ? 'infinite' : 'wallet'} size={32} color="white" />
          </View>
        </LinearGradient>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, { backgroundColor: colors.cardBackground }, activeTab === 'moments' && styles.tabActive]}
          onPress={() => setActiveTab('moments')}
        >
          <Ionicons
            name="chatbubbles"
            size={18}
            color={activeTab === 'moments' ? Colors.primary : colors.textSecondary}
          />
          <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === 'moments' && styles.tabTextActive]}>
            Moments
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, { backgroundColor: colors.cardBackground }, activeTab === 'subscribe' && styles.tabActive]}
          onPress={() => setActiveTab('subscribe')}
        >
          <Ionicons
            name="star"
            size={18}
            color={activeTab === 'subscribe' ? Colors.primary : colors.textSecondary}
          />
          <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === 'subscribe' && styles.tabTextActive]}>
            Haven Pro
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {activeTab === 'moments' ? renderMomentsTab() : renderSubscribeTab()}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Loading Overlay */}
      {(isPurchasing || isLoading) && (
        <View style={styles.loadingOverlay}>
          <View style={[styles.loadingContainer, { backgroundColor: colors.cardBackground }]}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={[styles.loadingText, { color: colors.text }]}>Processing...</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

interface FeatureItemProps {
  icon: string;
  title: string;
  colors: any;
}

const FeatureItem: React.FC<FeatureItemProps> = ({ icon, title, colors }) => (
  <View style={styles.featureItem}>
    <Ionicons name={icon as any} size={20} color={Colors.primary} />
    <Text style={[styles.featureText, { color: colors.text }]}>{title}</Text>
    <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
  </View>
);

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
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.xs,
    gap: 4,
  },
  proBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
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
    paddingHorizontal: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.gray900,
    marginBottom: Spacing.md,
  },
  proBenefitsCard: {
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  proBenefitsGradient: {
    padding: Spacing.lg,
  },
  proBenefitsContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  proBenefitsIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  proBenefitsText: {
    flex: 1,
  },
  proBenefitsTitle: {
    ...Typography.body,
    fontWeight: '700',
    color: 'white',
  },
  proBenefitsSubtitle: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
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
  usageCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
  },
  usageRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  usageItem: {
    alignItems: 'center',
  },
  usageIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  usageLabel: {
    ...Typography.caption,
    marginBottom: 2,
  },
  usageValue: {
    ...Typography.body,
    fontWeight: '700',
  },
  proStatusCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  proStatusIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  proStatusTitle: {
    ...Typography.h2,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  proStatusSubtitle: {
    ...Typography.body,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  manageButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
  },
  manageButtonText: {
    ...Typography.body,
    color: 'white',
    fontWeight: '600',
  },
  featuresCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.md,
  },
  featureText: {
    ...Typography.body,
    flex: 1,
  },
  planCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  planCardRecommended: {
    borderColor: Colors.primary,
  },
  recommendedBadge: {
    position: 'absolute',
    top: -10,
    right: Spacing.md,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  recommendedText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  planTitle: {
    ...Typography.body,
    fontWeight: '700',
  },
  planPrice: {
    ...Typography.h3,
    fontWeight: '700',
  },
  planDescription: {
    ...Typography.bodySmall,
  },
  ctaButton: {
    marginTop: Spacing.md,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  ctaButtonGradient: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  ctaButtonText: {
    ...Typography.body,
    color: 'white',
    fontWeight: '700',
  },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    marginTop: Spacing.md,
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
