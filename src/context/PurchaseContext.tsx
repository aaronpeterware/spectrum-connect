import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as InAppPurchases from 'expo-in-app-purchases';
import purchaseService, {
  PRODUCT_IDS,
  MOMENT_AMOUNTS,
  SUBSCRIPTION_MOMENTS,
  PurchaseResult,
} from '../services/PurchaseService';

// Storage keys
const STORAGE_KEYS = {
  MOMENTS_BALANCE: '@spectrum_moments_balance',
  SUBSCRIPTION_TYPE: '@spectrum_subscription_type',
  SUBSCRIPTION_EXPIRY: '@spectrum_subscription_expiry',
};

// Subscription tiers
export type SubscriptionTier = 'free' | 'pro' | 'premium';

interface PurchaseContextType {
  // State
  momentsBalance: number;
  subscriptionTier: SubscriptionTier;
  isLoading: boolean;
  products: InAppPurchases.IAPItemDetails[];
  subscriptions: InAppPurchases.IAPItemDetails[];

  // Actions
  purchaseMoments: (productId: string) => Promise<PurchaseResult>;
  purchaseSubscription: (productId: string) => Promise<PurchaseResult>;
  restorePurchases: () => Promise<void>;
  useMoments: (amount: number) => Promise<boolean>;
  addMoments: (amount: number) => Promise<void>;
  refreshProducts: () => Promise<void>;
}

const PurchaseContext = createContext<PurchaseContextType | undefined>(undefined);

export const usePurchases = () => {
  const context = useContext(PurchaseContext);
  if (!context) {
    throw new Error('usePurchases must be used within a PurchaseProvider');
  }
  return context;
};

interface PurchaseProviderProps {
  children: ReactNode;
}

export const PurchaseProvider: React.FC<PurchaseProviderProps> = ({ children }) => {
  const [momentsBalance, setMomentsBalance] = useState(500); // Start with 500 free moments
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>('free');
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<InAppPurchases.IAPItemDetails[]>([]);
  const [subscriptions, setSubscriptions] = useState<InAppPurchases.IAPItemDetails[]>([]);

  // Load saved data on mount
  useEffect(() => {
    loadSavedData();
    initializePurchases();

    return () => {
      purchaseService.disconnect();
    };
  }, []);

  const loadSavedData = async () => {
    try {
      const [savedMoments, savedSubType] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.MOMENTS_BALANCE),
        AsyncStorage.getItem(STORAGE_KEYS.SUBSCRIPTION_TYPE),
      ]);

      if (savedMoments) {
        setMomentsBalance(parseInt(savedMoments, 10));
      }

      if (savedSubType) {
        setSubscriptionTier(savedSubType as SubscriptionTier);
      }
    } catch (error) {
      if (__DEV__) console.error('Error loading saved purchase data:', error);
    }
  };

  const initializePurchases = async () => {
    try {
      setIsLoading(true);
      // IAP only works in production builds, skip in dev/simulator
      const connected = await purchaseService.connect();
      if (connected) {
        await refreshProducts();

        // Check for active subscription
        const activeSub = await purchaseService.checkActiveSubscription();
        if (activeSub) {
          const tier = activeSub.includes('premium') ? 'premium' : 'pro';
          setSubscriptionTier(tier);
          await AsyncStorage.setItem(STORAGE_KEYS.SUBSCRIPTION_TYPE, tier);
        }
      }
    } catch (error) {
      // Silently fail - IAP not available in simulator/Expo Go
      if (__DEV__) console.log('IAP not available:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProducts = async () => {
    try {
      const [momentProducts, subProducts] = await Promise.all([
        purchaseService.getMomentBundles(),
        purchaseService.getSubscriptions(),
      ]);

      setProducts(momentProducts);
      setSubscriptions(subProducts);
    } catch (error) {
      if (__DEV__) console.error('Error refreshing products:', error);
    }
  };

  const saveMomentsBalance = async (balance: number) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.MOMENTS_BALANCE, balance.toString());
    } catch (error) {
      if (__DEV__) console.error('Error saving moments balance:', error);
    }
  };

  const purchaseMoments = useCallback(async (productId: string): Promise<PurchaseResult> => {
    setIsLoading(true);
    try {
      const result = await purchaseService.purchaseProduct(productId);

      if (result.success && result.moments) {
        // Use functional update to avoid race conditions
        setMomentsBalance(prev => {
          const newBalance = prev + result.moments!;
          saveMomentsBalance(newBalance);
          return newBalance;
        });
      }

      return result;
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const purchaseSubscription = useCallback(async (productId: string): Promise<PurchaseResult> => {
    setIsLoading(true);
    try {
      const result = await purchaseService.purchaseProduct(productId);

      if (result.success) {
        // Determine subscription tier
        const tier: SubscriptionTier = productId.includes('premium') ? 'premium' : 'pro';
        setSubscriptionTier(tier);
        await AsyncStorage.setItem(STORAGE_KEYS.SUBSCRIPTION_TYPE, tier);

        // Add monthly moments using functional update to avoid race conditions
        const monthlyMoments = SUBSCRIPTION_MOMENTS[productId] || 0;
        if (monthlyMoments > 0) {
          setMomentsBalance(prev => {
            const newBalance = prev + monthlyMoments;
            saveMomentsBalance(newBalance);
            return newBalance;
          });
        }
      }

      return result;
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const restorePurchases = useCallback(async () => {
    setIsLoading(true);
    try {
      const purchases = await purchaseService.restorePurchases();

      // Check for active subscription
      const subscriptionIds = [
        PRODUCT_IDS.SUB_PRO_MONTHLY,
        PRODUCT_IDS.SUB_PRO_QUARTERLY,
        PRODUCT_IDS.SUB_PRO_ANNUAL,
        PRODUCT_IDS.SUB_PREMIUM_MONTHLY,
        PRODUCT_IDS.SUB_PREMIUM_QUARTERLY,
        PRODUCT_IDS.SUB_PREMIUM_ANNUAL,
      ];

      const activeSub = purchases.find(p => subscriptionIds.includes(p.productId));

      if (activeSub) {
        const tier: SubscriptionTier = activeSub.productId.includes('premium') ? 'premium' : 'pro';
        setSubscriptionTier(tier);
        await AsyncStorage.setItem(STORAGE_KEYS.SUBSCRIPTION_TYPE, tier);
      }
    } catch (error) {
      if (__DEV__) console.error('Error restoring purchases:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const useMoments = useCallback(async (amount: number): Promise<boolean> => {
    // Use a ref to track whether we successfully deducted
    let success = false;

    setMomentsBalance(prev => {
      if (prev < amount) {
        return prev; // Not enough balance
      }
      success = true;
      const newBalance = prev - amount;
      saveMomentsBalance(newBalance);
      return newBalance;
    });

    return success;
  }, []);

  const addMoments = useCallback(async (amount: number) => {
    setMomentsBalance(prev => {
      const newBalance = prev + amount;
      saveMomentsBalance(newBalance);
      return newBalance;
    });
  }, []);

  const value: PurchaseContextType = {
    momentsBalance,
    subscriptionTier,
    isLoading,
    products,
    subscriptions,
    purchaseMoments,
    purchaseSubscription,
    restorePurchases,
    useMoments,
    addMoments,
    refreshProducts,
  };

  return (
    <PurchaseContext.Provider value={value}>
      {children}
    </PurchaseContext.Provider>
  );
};

export default PurchaseContext;
