import { Platform, NativeModules } from 'react-native';

// Check if RevenueCat native module is available
const isRevenueCatAvailable = (): boolean => {
  try {
    // Check if the native module exists
    const hasNativeModule = NativeModules.RNPurchases != null;
    return hasNativeModule;
  } catch {
    return false;
  }
};

// Lazy import to prevent NativeEventEmitter crash
let Purchases: any = null;
let LOG_LEVEL: any = null;

const loadPurchases = () => {
  if (Purchases === null && isRevenueCatAvailable()) {
    try {
      const module = require('react-native-purchases');
      Purchases = module.default;
      LOG_LEVEL = module.LOG_LEVEL;
    } catch (error) {
      console.warn('[RevenueCat] Failed to load module:', error);
    }
  }
  return Purchases;
};

// Type aliases for when native module isn't available
export type PurchasesPackage = any;
export type CustomerInfo = any;
export type PurchasesOfferings = any;

// RevenueCat API Keys
const REVENUECAT_API_KEY = 'test_sUsFmXiGpkJipukVUtStGeHcHqH';

// Entitlement identifier
export const ENTITLEMENT_ID = 'Haven Pro';

// Product identifiers
export const PRODUCT_IDS = {
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
  LIFETIME: 'lifetime',
} as const;

export type ProductId = typeof PRODUCT_IDS[keyof typeof PRODUCT_IDS];

// Mock customer info for when RevenueCat is unavailable
const mockCustomerInfo: any = {
  entitlements: { active: {} },
  activeSubscriptions: [],
  allPurchasedProductIdentifiers: [],
  latestExpirationDate: null,
  firstSeen: new Date().toISOString(),
  originalAppUserId: 'mock_user',
  requestDate: new Date().toISOString(),
  managementURL: null,
  originalPurchaseDate: null,
  nonSubscriptionTransactions: [],
};

/**
 * Initialize RevenueCat SDK
 * Call this once when the app starts
 */
export async function initializeRevenueCat(userId?: string): Promise<void> {
  const purchases = loadPurchases();

  if (!purchases) {
    console.warn('[RevenueCat] Native module not available - purchases will be mocked');
    return;
  }

  try {
    // Enable debug logs in development
    if (__DEV__ && LOG_LEVEL) {
      purchases.setLogLevel(LOG_LEVEL.DEBUG);
    }

    // Configure RevenueCat
    await purchases.configure({
      apiKey: REVENUECAT_API_KEY,
      appUserID: userId,
    });

    console.log('[RevenueCat] Initialized successfully');
  } catch (error) {
    console.error('[RevenueCat] Initialization error:', error);
    // Don't throw - allow app to continue without purchases
  }
}

/**
 * Log in a user to RevenueCat
 */
export async function loginUser(userId: string): Promise<any> {
  const purchases = loadPurchases();

  if (!purchases) {
    console.warn('[RevenueCat] Native module not available');
    return mockCustomerInfo;
  }

  try {
    const { customerInfo } = await purchases.logIn(userId);
    console.log('[RevenueCat] User logged in:', userId);
    return customerInfo;
  } catch (error) {
    console.error('[RevenueCat] Login error:', error);
    throw error;
  }
}

/**
 * Log out the current user
 */
export async function logoutUser(): Promise<any> {
  const purchases = loadPurchases();

  if (!purchases) {
    console.warn('[RevenueCat] Native module not available');
    return mockCustomerInfo;
  }

  try {
    const customerInfo = await purchases.logOut();
    console.log('[RevenueCat] User logged out');
    return customerInfo;
  } catch (error) {
    console.error('[RevenueCat] Logout error:', error);
    throw error;
  }
}

/**
 * Get current customer info
 */
export async function getCustomerInfo(): Promise<any> {
  const purchases = loadPurchases();

  if (!purchases) {
    console.warn('[RevenueCat] Native module not available - returning mock');
    return mockCustomerInfo;
  }

  try {
    const customerInfo = await purchases.getCustomerInfo();
    return customerInfo;
  } catch (error) {
    console.error('[RevenueCat] Error getting customer info:', error);
    return mockCustomerInfo;
  }
}

/**
 * Check if user has Haven Pro entitlement
 */
export async function checkHavenProAccess(): Promise<boolean> {
  const purchases = loadPurchases();

  if (!purchases) {
    console.warn('[RevenueCat] Native module not available');
    return false;
  }

  try {
    const customerInfo = await purchases.getCustomerInfo();
    const hasAccess = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
    console.log('[RevenueCat] Haven Pro access:', hasAccess);
    return hasAccess;
  } catch (error) {
    console.error('[RevenueCat] Error checking entitlement:', error);
    return false;
  }
}

/**
 * Get available offerings (products)
 */
export async function getOfferings(): Promise<any | null> {
  const purchases = loadPurchases();

  if (!purchases) {
    console.warn('[RevenueCat] Native module not available');
    return null;
  }

  try {
    const offerings = await purchases.getOfferings();

    if (offerings.current) {
      console.log('[RevenueCat] Current offering:', offerings.current.identifier);
      console.log('[RevenueCat] Available packages:', offerings.current.availablePackages.map((p: any) => p.identifier));
    }

    return offerings;
  } catch (error) {
    console.error('[RevenueCat] Error getting offerings:', error);
    return null;
  }
}

/**
 * Purchase a package
 */
export async function purchasePackage(pkg: any): Promise<{
  success: boolean;
  customerInfo?: any;
  error?: string;
}> {
  const purchases = loadPurchases();

  if (!purchases) {
    console.warn('[RevenueCat] Native module not available');
    return { success: false, error: 'Purchases not available in this environment' };
  }

  try {
    const { customerInfo } = await purchases.purchasePackage(pkg);

    const hasAccess = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;

    console.log('[RevenueCat] Purchase completed, Haven Pro access:', hasAccess);

    return {
      success: hasAccess,
      customerInfo,
    };
  } catch (error: any) {
    // Handle user cancellation
    if (error.userCancelled) {
      console.log('[RevenueCat] User cancelled purchase');
      return {
        success: false,
        error: 'Purchase cancelled',
      };
    }

    console.error('[RevenueCat] Purchase error:', error);
    return {
      success: false,
      error: error.message || 'Purchase failed',
    };
  }
}

/**
 * Restore purchases
 */
export async function restorePurchases(): Promise<{
  success: boolean;
  hasProAccess: boolean;
  customerInfo?: any;
  error?: string;
}> {
  const purchases = loadPurchases();

  if (!purchases) {
    console.warn('[RevenueCat] Native module not available');
    return { success: false, hasProAccess: false, error: 'Purchases not available in this environment' };
  }

  try {
    const customerInfo = await purchases.restorePurchases();
    const hasProAccess = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;

    console.log('[RevenueCat] Purchases restored, Haven Pro access:', hasProAccess);

    return {
      success: true,
      hasProAccess,
      customerInfo,
    };
  } catch (error: any) {
    console.error('[RevenueCat] Restore error:', error);
    return {
      success: false,
      hasProAccess: false,
      error: error.message || 'Restore failed',
    };
  }
}

/**
 * Get subscription management URL
 */
export async function getManagementURL(): Promise<string | null> {
  const purchases = loadPurchases();

  if (!purchases) {
    console.warn('[RevenueCat] Native module not available');
    return null;
  }

  try {
    const customerInfo = await purchases.getCustomerInfo();
    return customerInfo.managementURL;
  } catch (error) {
    console.error('[RevenueCat] Error getting management URL:', error);
    return null;
  }
}

/**
 * Add listener for customer info updates
 */
export function addCustomerInfoUpdateListener(
  callback: (info: any) => void
): () => void {
  const purchases = loadPurchases();

  if (!purchases) {
    console.warn('[RevenueCat] Native module not available - listener not attached');
    return () => {};
  }

  try {
    purchases.addCustomerInfoUpdateListener(callback);
  } catch (error) {
    console.error('[RevenueCat] Error adding listener:', error);
  }

  // RevenueCat SDK doesn't provide a way to remove individual listeners
  return () => {};
}
