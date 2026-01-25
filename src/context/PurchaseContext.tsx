import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  initializeRevenueCat,
  loginUser,
  logoutUser,
  getCustomerInfo,
  checkHavenProAccess,
  getOfferings,
  purchasePackage,
  restorePurchases as restoreRevenueCatPurchases,
  addCustomerInfoUpdateListener,
  ENTITLEMENT_ID,
  PRODUCT_IDS,
} from '../services/revenueCatService';

// Use any for RevenueCat types since native module may not be available
type PurchasesPackage = any;
type CustomerInfo = any;
type PurchasesOfferings = any;

// Storage keys
const STORAGE_KEYS = {
  MOMENTS_BALANCE: '@haven_moments_balance',
  LAST_RENEWAL_CHECK: '@haven_last_renewal_check',
};

interface PurchaseContextType {
  // State
  momentsBalance: number;
  isProUser: boolean;
  isLoading: boolean;
  offerings: PurchasesOfferings | null;
  customerInfo: CustomerInfo | null;

  // Actions
  purchaseProduct: (pkg: PurchasesPackage) => Promise<{ success: boolean; error?: string }>;
  restorePurchases: () => Promise<{ success: boolean; hasProAccess: boolean; error?: string }>;
  useMoments: (amount: number) => Promise<boolean>;
  addMoments: (amount: number) => Promise<void>;
  refreshOfferings: () => Promise<void>;
  checkProAccess: () => Promise<boolean>;

  // Voice call tracking
  trackVoiceCallUsage: (durationSeconds: number) => Promise<{ success: boolean; momentsUsed: number; newBalance: number }>;
  trackChatUsage: () => Promise<{ success: boolean; newBalance: number }>;
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
  const [isProUser, setIsProUser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);

  // Initialize RevenueCat and load saved data
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const initialize = async () => {
      try {
        // Load saved moments balance
        const savedMoments = await AsyncStorage.getItem(STORAGE_KEYS.MOMENTS_BALANCE);
        if (savedMoments) {
          setMomentsBalance(parseInt(savedMoments, 10));
        }

        // Initialize RevenueCat
        await initializeRevenueCat();

        // Get current customer info
        const info = await getCustomerInfo();
        setCustomerInfo(info);

        // Check pro access
        const hasProAccess = info.entitlements.active[ENTITLEMENT_ID] !== undefined;
        setIsProUser(hasProAccess);

        // Load offerings
        const availableOfferings = await getOfferings();
        setOfferings(availableOfferings);

        // Listen for customer info updates
        unsubscribe = addCustomerInfoUpdateListener((updatedInfo) => {
          setCustomerInfo(updatedInfo);
          const hasAccess = updatedInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
          setIsProUser(hasAccess);
          console.log('[PurchaseContext] Customer info updated, Pro access:', hasAccess);
        });
      } catch (error) {
        console.error('[PurchaseContext] Initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initialize();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const saveMomentsBalance = async (balance: number) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.MOMENTS_BALANCE, balance.toString());
    } catch (error) {
      console.error('[PurchaseContext] Error saving moments balance:', error);
    }
  };

  const refreshOfferings = useCallback(async () => {
    try {
      const availableOfferings = await getOfferings();
      setOfferings(availableOfferings);
    } catch (error) {
      console.error('[PurchaseContext] Error refreshing offerings:', error);
    }
  }, []);

  const checkProAccess = useCallback(async (): Promise<boolean> => {
    try {
      const hasAccess = await checkHavenProAccess();
      setIsProUser(hasAccess);
      return hasAccess;
    } catch (error) {
      console.error('[PurchaseContext] Error checking pro access:', error);
      return false;
    }
  }, []);

  const purchaseProduct = useCallback(async (pkg: PurchasesPackage): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const result = await purchasePackage(pkg);

      if (result.success && result.customerInfo) {
        setCustomerInfo(result.customerInfo);
        const hasAccess = result.customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
        setIsProUser(hasAccess);

        // Add bonus moments for subscribers
        if (hasAccess) {
          const bonusMoments = 1000; // Bonus moments for becoming Pro
          setMomentsBalance(prev => {
            const newBalance = prev + bonusMoments;
            saveMomentsBalance(newBalance);
            return newBalance;
          });
        }
      }

      return {
        success: result.success,
        error: result.error,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Purchase failed',
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const restorePurchases = useCallback(async (): Promise<{ success: boolean; hasProAccess: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const result = await restoreRevenueCatPurchases();

      if (result.success && result.customerInfo) {
        setCustomerInfo(result.customerInfo);
        setIsProUser(result.hasProAccess);
      }

      return {
        success: result.success,
        hasProAccess: result.hasProAccess,
        error: result.error,
      };
    } catch (error: any) {
      return {
        success: false,
        hasProAccess: false,
        error: error.message || 'Restore failed',
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const useMoments = useCallback(async (amount: number): Promise<boolean> => {
    // Pro users have unlimited moments
    if (isProUser) {
      return true;
    }

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
  }, [isProUser]);

  const addMoments = useCallback(async (amount: number) => {
    setMomentsBalance(prev => {
      const newBalance = prev + amount;
      saveMomentsBalance(newBalance);
      return newBalance;
    });
  }, []);

  // Track voice call usage - 100 moments per minute (free for Pro users)
  const trackVoiceCallUsage = useCallback(async (durationSeconds: number): Promise<{ success: boolean; momentsUsed: number; newBalance: number }> => {
    // Pro users get unlimited voice calls
    if (isProUser) {
      return { success: true, momentsUsed: 0, newBalance: momentsBalance };
    }

    const minutes = Math.ceil(durationSeconds / 60);
    const momentsToDeduct = minutes * 100; // 100 moments per minute

    return new Promise((resolve) => {
      setMomentsBalance(prev => {
        const newBalance = Math.max(0, prev - momentsToDeduct);
        saveMomentsBalance(newBalance);
        resolve({ success: true, momentsUsed: momentsToDeduct, newBalance });
        return newBalance;
      });
    });
  }, [isProUser, momentsBalance]);

  // Track chat usage - 1 moment per response (free for Pro users)
  const trackChatUsage = useCallback(async (): Promise<{ success: boolean; newBalance: number }> => {
    // Pro users get unlimited chat
    if (isProUser) {
      return { success: true, newBalance: momentsBalance };
    }

    const momentsToDeduct = 1;

    return new Promise((resolve) => {
      setMomentsBalance(prev => {
        if (prev < momentsToDeduct) {
          resolve({ success: false, newBalance: prev });
          return prev;
        }

        const newBalance = prev - momentsToDeduct;
        saveMomentsBalance(newBalance);
        resolve({ success: true, newBalance });
        return newBalance;
      });
    });
  }, [isProUser, momentsBalance]);

  const value: PurchaseContextType = {
    momentsBalance,
    isProUser,
    isLoading,
    offerings,
    customerInfo,
    purchaseProduct,
    restorePurchases,
    useMoments,
    addMoments,
    refreshOfferings,
    checkProAccess,
    trackVoiceCallUsage,
    trackChatUsage,
  };

  return (
    <PurchaseContext.Provider value={value}>
      {children}
    </PurchaseContext.Provider>
  );
};

export default PurchaseContext;
