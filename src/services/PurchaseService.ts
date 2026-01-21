import * as InAppPurchases from 'expo-in-app-purchases';
import { Platform } from 'react-native';

// Product IDs - these must match exactly what you create in App Store Connect
export const PRODUCT_IDS = {
  // Moment Bundles (Consumable)
  MOMENTS_QUICK: 'com.spectrumconnect.moments.quick',      // 1,800 moments - $5.99
  MOMENTS_CHAT: 'com.spectrumconnect.moments.chat',        // 4,000 moments - $11.99
  MOMENTS_STARTER: 'com.spectrumconnect.moments.starter',  // 10,000 moments - $19.99
  MOMENTS_HEART: 'com.spectrumconnect.moments.heart',      // 22,000 moments - $39.99
  MOMENTS_DEEP: 'com.spectrumconnect.moments.deep',        // 45,000 moments - $74.99
  MOMENTS_UNLIMITED: 'com.spectrumconnect.moments.unlimited', // 200,000 moments - $249.99

  // Subscriptions (Auto-Renewable)
  SUB_PRO_MONTHLY: 'com.spectrumconnect.pro.monthly',      // $14.99/month
  SUB_PRO_QUARTERLY: 'com.spectrumconnect.pro.quarterly',  // $12.99/month billed quarterly
  SUB_PRO_ANNUAL: 'com.spectrumconnect.pro.annual',        // $9.99/month billed annually
  SUB_PREMIUM_MONTHLY: 'com.spectrumconnect.premium.monthly',    // $29.99/month
  SUB_PREMIUM_QUARTERLY: 'com.spectrumconnect.premium.quarterly', // $24.99/month billed quarterly
  SUB_PREMIUM_ANNUAL: 'com.spectrumconnect.premium.annual',      // $19.99/month billed annually
};

// Moment amounts for each bundle
export const MOMENT_AMOUNTS: Record<string, number> = {
  [PRODUCT_IDS.MOMENTS_QUICK]: 1800,
  [PRODUCT_IDS.MOMENTS_CHAT]: 4000,
  [PRODUCT_IDS.MOMENTS_STARTER]: 10000,
  [PRODUCT_IDS.MOMENTS_HEART]: 22000,
  [PRODUCT_IDS.MOMENTS_DEEP]: 45000,
  [PRODUCT_IDS.MOMENTS_UNLIMITED]: 200000,
};

// Monthly moments for subscriptions
export const SUBSCRIPTION_MOMENTS: Record<string, number> = {
  [PRODUCT_IDS.SUB_PRO_MONTHLY]: 1000,
  [PRODUCT_IDS.SUB_PRO_QUARTERLY]: 1000,
  [PRODUCT_IDS.SUB_PRO_ANNUAL]: 1000,
  [PRODUCT_IDS.SUB_PREMIUM_MONTHLY]: 8000,
  [PRODUCT_IDS.SUB_PREMIUM_QUARTERLY]: 8000,
  [PRODUCT_IDS.SUB_PREMIUM_ANNUAL]: 8000,
};

export type PurchaseResult = {
  success: boolean;
  productId?: string;
  error?: string;
  moments?: number;
};

class PurchaseService {
  private isConnected = false;
  private purchaseListener: InAppPurchases.PurchaseListener | null = null;

  // Initialize the IAP connection
  async connect(): Promise<boolean> {
    if (this.isConnected) return true;

    try {
      // Check if IAP is available (won't work in Expo Go or simulator)
      await InAppPurchases.connectAsync();
      this.isConnected = true;
      if (__DEV__) console.log('IAP connected successfully');
      return true;
    } catch (error: any) {
      // Expected to fail in Expo Go / simulator
      if (__DEV__) console.log('IAP not available (expected in dev):', error?.message || error);
      return false;
    }
  }

  // Disconnect from IAP
  async disconnect(): Promise<void> {
    if (!this.isConnected) return;

    try {
      await InAppPurchases.disconnectAsync();
      this.isConnected = false;
      if (__DEV__) console.log('IAP disconnected');
    } catch (error) {
      if (__DEV__) console.error('Failed to disconnect from IAP:', error);
    }
  }

  // Get all available products
  async getProducts(): Promise<InAppPurchases.IAPItemDetails[]> {
    if (!this.isConnected) {
      const connected = await this.connect();
      if (!connected) return [];
    }

    try {
      const allProductIds = Object.values(PRODUCT_IDS);
      const { results, responseCode } = await InAppPurchases.getProductsAsync(allProductIds);

      if (responseCode === InAppPurchases.IAPResponseCode.OK) {
        return results || [];
      }

      if (__DEV__) console.log('Failed to get products, response code:', responseCode);
      return [];
    } catch (error) {
      if (__DEV__) console.log('Error getting products:', error);
      return [];
    }
  }

  // Get moment bundles only
  async getMomentBundles(): Promise<InAppPurchases.IAPItemDetails[]> {
    if (!this.isConnected) {
      const connected = await this.connect();
      if (!connected) return [];
    }

    const momentProductIds = [
      PRODUCT_IDS.MOMENTS_QUICK,
      PRODUCT_IDS.MOMENTS_CHAT,
      PRODUCT_IDS.MOMENTS_STARTER,
      PRODUCT_IDS.MOMENTS_HEART,
      PRODUCT_IDS.MOMENTS_DEEP,
      PRODUCT_IDS.MOMENTS_UNLIMITED,
    ];

    try {
      const { results, responseCode } = await InAppPurchases.getProductsAsync(momentProductIds);

      if (responseCode === InAppPurchases.IAPResponseCode.OK) {
        return results || [];
      }

      return [];
    } catch (error) {
      if (__DEV__) console.log('Error getting moment bundles:', error);
      return [];
    }
  }

  // Get subscriptions only
  async getSubscriptions(): Promise<InAppPurchases.IAPItemDetails[]> {
    if (!this.isConnected) {
      const connected = await this.connect();
      if (!connected) return [];
    }

    const subscriptionProductIds = [
      PRODUCT_IDS.SUB_PRO_MONTHLY,
      PRODUCT_IDS.SUB_PRO_QUARTERLY,
      PRODUCT_IDS.SUB_PRO_ANNUAL,
      PRODUCT_IDS.SUB_PREMIUM_MONTHLY,
      PRODUCT_IDS.SUB_PREMIUM_QUARTERLY,
      PRODUCT_IDS.SUB_PREMIUM_ANNUAL,
    ];

    try {
      const { results, responseCode } = await InAppPurchases.getProductsAsync(subscriptionProductIds);

      if (responseCode === InAppPurchases.IAPResponseCode.OK) {
        return results || [];
      }

      return [];
    } catch (error) {
      if (__DEV__) console.log('Error getting subscriptions:', error);
      return [];
    }
  }

  // Purchase a product
  async purchaseProduct(productId: string): Promise<PurchaseResult> {
    if (!this.isConnected) {
      const connected = await this.connect();
      if (!connected) {
        return { success: false, error: 'Store not available in simulator. Use a real device.' };
      }
    }

    return new Promise(async (resolve) => {
      try {
        // Set up purchase listener
        this.purchaseListener = InAppPurchases.setPurchaseListener(({ responseCode, results }) => {
          if (responseCode === InAppPurchases.IAPResponseCode.OK && results) {
            const purchase = results.find(r => r.productId === productId);

            if (purchase) {
              // Finish the transaction
              InAppPurchases.finishTransactionAsync(purchase, true);

              // Calculate moments if it's a moment bundle
              const moments = MOMENT_AMOUNTS[productId] || 0;

              resolve({
                success: true,
                productId: purchase.productId,
                moments,
              });
            } else {
              resolve({ success: false, error: 'Purchase not found in results' });
            }
          } else if (responseCode === InAppPurchases.IAPResponseCode.USER_CANCELED) {
            resolve({ success: false, error: 'Purchase cancelled' });
          } else {
            resolve({ success: false, error: `Purchase failed with code: ${responseCode}` });
          }
        });

        // Initiate the purchase
        await InAppPurchases.purchaseItemAsync(productId);
      } catch (error: any) {
        if (__DEV__) console.log('Purchase error:', error);
        resolve({ success: false, error: error.message || 'Store not available' });
      }
    });
  }

  // Restore purchases (for subscriptions)
  async restorePurchases(): Promise<InAppPurchases.InAppPurchase[]> {
    if (!this.isConnected) {
      const connected = await this.connect();
      if (!connected) return [];
    }

    return new Promise(async (resolve) => {
      try {
        this.purchaseListener = InAppPurchases.setPurchaseListener(({ responseCode, results }) => {
          if (responseCode === InAppPurchases.IAPResponseCode.OK) {
            // Finish any pending transactions
            results?.forEach(purchase => {
              InAppPurchases.finishTransactionAsync(purchase, true);
            });
            resolve(results || []);
          } else {
            resolve([]);
          }
        });

        await InAppPurchases.getPurchaseHistoryAsync();
      } catch (error) {
        if (__DEV__) console.log('Restore purchases error:', error);
        resolve([]);
      }
    });
  }

  // Check if user has active subscription
  async checkActiveSubscription(): Promise<string | null> {
    if (!this.isConnected) return null;

    try {
      const purchases = await this.restorePurchases();

      const subscriptionIds = [
        PRODUCT_IDS.SUB_PRO_MONTHLY,
        PRODUCT_IDS.SUB_PRO_QUARTERLY,
        PRODUCT_IDS.SUB_PRO_ANNUAL,
        PRODUCT_IDS.SUB_PREMIUM_MONTHLY,
        PRODUCT_IDS.SUB_PREMIUM_QUARTERLY,
        PRODUCT_IDS.SUB_PREMIUM_ANNUAL,
      ];

      const activeSubscription = purchases.find(p =>
        subscriptionIds.includes(p.productId) &&
        p.acknowledged
      );

      return activeSubscription?.productId || null;
    } catch (error) {
      if (__DEV__) console.log('Error checking subscription:', error);
      return null;
    }
  }
}

// Export singleton instance
export const purchaseService = new PurchaseService();
export default purchaseService;
