import { Platform, NativeModules, AppState, AppStateStatus } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';

// Check if Mixpanel native module is available
const isMixpanelAvailable = (): boolean => {
  try {
    const hasNativeModule = NativeModules.MixpanelReactNative != null;
    return hasNativeModule;
  } catch {
    return false;
  }
};

// Lazy import to prevent crashes when native module isn't available
let Mixpanel: any = null;

const loadMixpanel = () => {
  if (Mixpanel === null && isMixpanelAvailable()) {
    try {
      const module = require('mixpanel-react-native');
      Mixpanel = module.Mixpanel;
    } catch (error) {
      console.warn('[Analytics] Failed to load Mixpanel module:', error);
    }
  }
  return Mixpanel;
};

// Mixpanel project token
const MIXPANEL_TOKEN = '0ba6bd275e95b8b1c2dc08946f2cdf39';

// Singleton instance
let mixpanelInstance: any = null;
let isInitialized = false;
let useHttpFallback = false;

// User identification for HTTP fallback
let currentUserId: string | null = null;
let currentDistinctId: string | null = null;
let superProperties: Record<string, any> = {};

// Session tracking
let sessionStartTime: number | null = null;
let onboardingStartTime: number | null = null;
let currentScreen: string | null = null;
let previousScreen: string | null = null;
let paywallOpenTime: number | null = null;

// App state tracking for background/foreground
let lastBackgroundTime: number | null = null;

// Generate a unique device ID for anonymous tracking
const generateDeviceId = (): string => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 15);
  return `${Platform.OS}_${timestamp}_${randomStr}`;
};

// HTTP fallback for tracking when native module isn't available
const trackViaHttp = async (eventName: string, properties?: Record<string, any>): Promise<void> => {
  try {
    const distinctId = currentDistinctId || currentUserId || generateDeviceId();

    const eventData = {
      event: eventName,
      properties: {
        token: MIXPANEL_TOKEN,
        distinct_id: distinctId,
        time: Math.floor(Date.now() / 1000),
        $insert_id: `${Date.now()}_${Math.random().toString(36).substring(7)}`,
        ...superProperties,
        ...properties,
        mp_lib: 'react-native-http',
      },
    };

    const base64Data = btoa(JSON.stringify([eventData]));

    const response = await fetch(`https://api.mixpanel.com/track?ip=1&verbose=1`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `data=${encodeURIComponent(base64Data)}`,
    });

    const result = await response.json();

    if (__DEV__) {
      console.log('[Analytics] HTTP Track:', eventName, result.status === 1 ? '✓' : '✗');
    }
  } catch (error) {
    console.error('[Analytics] HTTP track error:', error);
  }
};

// HTTP fallback for identifying users
const identifyViaHttp = async (userId: string, userProperties?: Record<string, any>): Promise<void> => {
  try {
    currentUserId = userId;
    currentDistinctId = userId;

    // Create alias if needed (link anonymous to user ID)
    const aliasData = {
      event: '$create_alias',
      properties: {
        token: MIXPANEL_TOKEN,
        distinct_id: userId,
        alias: currentDistinctId,
      },
    };

    // Set user profile
    if (userProperties) {
      const profileData = {
        $token: MIXPANEL_TOKEN,
        $distinct_id: userId,
        $set: {
          ...userProperties,
          $name: userProperties.name,
          $email: userProperties.email,
        },
      };

      const base64Data = btoa(JSON.stringify([profileData]));

      await fetch('https://api.mixpanel.com/engage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `data=${encodeURIComponent(base64Data)}`,
      });
    }

    if (__DEV__) {
      console.log('[Analytics] HTTP Identify:', userId);
    }
  } catch (error) {
    console.error('[Analytics] HTTP identify error:', error);
  }
};

/**
 * Initialize Mixpanel analytics
 * Call this once when the app starts
 */
export async function initAnalytics(): Promise<void> {
  if (isInitialized) {
    console.log('[Analytics] Already initialized');
    return;
  }

  // Generate a distinct ID for this device
  currentDistinctId = generateDeviceId();

  const MixpanelClass = loadMixpanel();

  if (!MixpanelClass) {
    console.log('[Analytics] Native module not available - using HTTP fallback');
    useHttpFallback = true;
    isInitialized = true;
    sessionStartTime = Date.now();

    // Set default super properties
    superProperties = {
      platform: Platform.OS,
      app_version: Constants.expoConfig?.version || '1.0.0',
      device_brand: Device.brand || 'unknown',
      device_model: Device.modelName || 'unknown',
      os_version: Device.osVersion || 'unknown',
    };

    // Track that analytics was initialized via HTTP
    await trackViaHttp('$mp_init', { method: 'http_fallback' });
    return;
  }

  try {
    mixpanelInstance = new MixpanelClass(MIXPANEL_TOKEN, true);
    await mixpanelInstance.init();

    // Set super properties that will be sent with every event
    mixpanelInstance.registerSuperProperties({
      platform: Platform.OS,
      app_version: Constants.expoConfig?.version || '1.0.0',
      build_number: Constants.expoConfig?.ios?.buildNumber || Constants.expoConfig?.android?.versionCode || '1',
    });

    isInitialized = true;
    sessionStartTime = Date.now();

    console.log('[Analytics] Mixpanel initialized successfully (native)');
  } catch (error) {
    console.error('[Analytics] Native init error, falling back to HTTP:', error);
    useHttpFallback = true;
    isInitialized = true;
    sessionStartTime = Date.now();
  }
}

/**
 * Identify a user with their unique ID and properties
 */
export function identify(userId: string, userProperties?: Record<string, any>): void {
  if (useHttpFallback) {
    identifyViaHttp(userId, userProperties);
    return;
  }

  if (!mixpanelInstance) {
    console.log('[Analytics] Not initialized, cannot identify');
    return;
  }

  try {
    mixpanelInstance.identify(userId);

    if (userProperties) {
      mixpanelInstance.getPeople().set(userProperties);
    }

    console.log('[Analytics] User identified:', userId);
  } catch (error) {
    console.error('[Analytics] Identify error:', error);
  }
}

/**
 * Set user profile properties
 */
export function setUserProperties(properties: Record<string, any>): void {
  if (useHttpFallback) {
    if (currentUserId) {
      identifyViaHttp(currentUserId, properties);
    }
    return;
  }

  if (!mixpanelInstance) {
    console.log('[Analytics] Not initialized, cannot set user properties');
    return;
  }

  try {
    mixpanelInstance.getPeople().set(properties);
  } catch (error) {
    console.error('[Analytics] setUserProperties error:', error);
  }
}

/**
 * Track a custom event
 */
export function track(eventName: string, properties?: Record<string, any>): void {
  const enhancedProperties = {
    ...properties,
    timestamp: new Date().toISOString(),
  };

  if (useHttpFallback) {
    trackViaHttp(eventName, enhancedProperties);
    return;
  }

  if (!mixpanelInstance) {
    console.log('[Analytics] Not initialized, cannot track:', eventName);
    return;
  }

  try {
    mixpanelInstance.track(eventName, enhancedProperties);

    if (__DEV__) {
      console.log('[Analytics] Tracked:', eventName, enhancedProperties);
    }
  } catch (error) {
    console.error('[Analytics] Track error:', error);
  }
}

/**
 * Track screen views with previous screen context
 */
export function trackScreen(screenName: string, properties?: Record<string, any>): void {
  previousScreen = currentScreen;
  currentScreen = screenName;

  track('screen_viewed', {
    screen_name: screenName,
    previous_screen: previousScreen,
    ...properties,
  });
}

/**
 * Reset analytics (call on logout)
 */
export function resetAnalytics(): void {
  if (useHttpFallback) {
    currentUserId = null;
    currentDistinctId = generateDeviceId();
    currentScreen = null;
    previousScreen = null;
    console.log('[Analytics] Reset complete (HTTP)');
    return;
  }

  if (!mixpanelInstance) {
    console.log('[Analytics] Not initialized, cannot reset');
    return;
  }

  try {
    mixpanelInstance.reset();
    currentScreen = null;
    previousScreen = null;
    console.log('[Analytics] Reset complete');
  } catch (error) {
    console.error('[Analytics] Reset error:', error);
  }
}

// ============================================
// APP LIFECYCLE EVENTS
// ============================================

/**
 * Track app opened event
 */
export function trackAppOpened(source?: string): void {
  sessionStartTime = Date.now();

  track('app_opened', {
    source: source || 'direct',
    version: Constants.expoConfig?.version || '1.0.0',
    platform: Platform.OS,
  });
}

/**
 * Track app backgrounded
 */
export function trackAppBackgrounded(): void {
  lastBackgroundTime = Date.now();
  const sessionDuration = sessionStartTime ? (Date.now() - sessionStartTime) / 1000 : 0;

  track('app_backgrounded', {
    session_duration: Math.round(sessionDuration),
  });
}

/**
 * Track app foregrounded
 */
export function trackAppForegrounded(): void {
  const timeInBackground = lastBackgroundTime ? (Date.now() - lastBackgroundTime) / 1000 : 0;
  sessionStartTime = Date.now();

  track('app_foregrounded', {
    time_in_background: Math.round(timeInBackground),
  });
}

/**
 * Setup app state listener for background/foreground tracking
 */
export function setupAppStateTracking(): () => void {
  let appState = AppState.currentState;

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (appState.match(/inactive|background/) && nextAppState === 'active') {
      trackAppForegrounded();
    } else if (appState === 'active' && nextAppState.match(/inactive|background/)) {
      trackAppBackgrounded();
    }
    appState = nextAppState;
  };

  const subscription = AppState.addEventListener('change', handleAppStateChange);

  return () => {
    subscription.remove();
  };
}

// ============================================
// ONBOARDING EVENTS
// ============================================

/**
 * Track onboarding started
 */
export function trackOnboardingStarted(): void {
  onboardingStartTime = Date.now();

  track('onboarding_started', {
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track terms accepted
 */
export function trackTermsAccepted(): void {
  track('onboarding_terms_accepted');
}

/**
 * Track photo added during onboarding
 */
export function trackPhotoAdded(photoCount: number, source: 'camera' | 'library'): void {
  track('onboarding_photo_added', {
    photo_count: photoCount,
    source,
  });
}

/**
 * Track photo removed during onboarding
 */
export function trackPhotoRemoved(remainingCount: number): void {
  track('onboarding_photo_removed', {
    remaining_count: remainingCount,
  });
}

/**
 * Track main photo set
 */
export function trackMainPhotoSet(index: number): void {
  track('onboarding_main_photo_set', {
    index,
  });
}

/**
 * Track photo step completed
 */
export function trackPhotoCompleted(totalPhotos: number): void {
  track('onboarding_photo_completed', {
    total_photos: totalPhotos,
  });
}

/**
 * Track basics completed
 */
export function trackBasicsCompleted(name: string, age: number | null, location: string): void {
  track('onboarding_basics_completed', {
    name_length: name.length,
    age,
    location,
  });
}

/**
 * Track goals selected
 */
export function trackGoalsSelected(goals: string[]): void {
  track('onboarding_goals_selected', {
    goals,
    count: goals.length,
  });
}

/**
 * Track interests selected
 */
export function trackInterestsSelected(interests: string[], categories: string[]): void {
  track('onboarding_interests_selected', {
    interests,
    count: interests.length,
    categories,
  });
}

/**
 * Track onboarding completed
 */
export function trackOnboardingCompleted(): void {
  const totalDuration = onboardingStartTime
    ? (Date.now() - onboardingStartTime) / 1000
    : 0;

  track('onboarding_completed', {
    total_duration_seconds: Math.round(totalDuration),
  });
}

/**
 * Track onboarding step back
 */
export function trackOnboardingStepBack(fromStep: number, toStep: number): void {
  track('onboarding_step_back', {
    from_step: fromStep,
    to_step: toStep,
  });
}

/**
 * Track onboarding error
 */
export function trackOnboardingError(step: number, errorType: string, errorMessage: string): void {
  track('onboarding_error', {
    step,
    error_type: errorType,
    error_message: errorMessage,
  });
}

// ============================================
// PAYWALL & PURCHASE EVENTS
// ============================================

/**
 * Track paywall viewed
 */
export function trackPaywallViewed(source: 'onboarding' | 'store' | 'feature_gate', offeringsCount: number): void {
  paywallOpenTime = Date.now();

  track('paywall_viewed', {
    source,
    offerings_count: offeringsCount,
  });
}

/**
 * Track plan selected on paywall
 */
export function trackPlanSelected(planType: string, price: string): void {
  track('paywall_plan_selected', {
    plan_type: planType,
    price,
  });
}

/**
 * Track purchase initiated
 */
export function trackPurchaseInitiated(planType: string, price: string): void {
  track('purchase_initiated', {
    plan_type: planType,
    price,
  });
}

/**
 * Track purchase completed
 */
export function trackPurchaseCompleted(planType: string, price: string, transactionId?: string): void {
  track('purchase_completed', {
    plan_type: planType,
    price,
    transaction_id: transactionId,
  });

  // Also set user property
  setUserProperties({
    is_pro_user: true,
    subscription_type: planType,
    subscription_date: new Date().toISOString(),
  });
}

/**
 * Track purchase failed
 */
export function trackPurchaseFailed(planType: string, errorCode: string, errorMessage: string): void {
  track('purchase_failed', {
    plan_type: planType,
    error_code: errorCode,
    error_message: errorMessage,
  });
}

/**
 * Track purchase cancelled
 */
export function trackPurchaseCancelled(planType: string): void {
  track('purchase_cancelled', {
    plan_type: planType,
  });
}

/**
 * Track purchases restored
 */
export function trackPurchaseRestored(planType: string): void {
  track('purchase_restored', {
    plan_type: planType,
  });
}

/**
 * Track paywall dismissed
 */
export function trackPaywallDismissed(source: string): void {
  const timeOnPaywall = paywallOpenTime
    ? (Date.now() - paywallOpenTime) / 1000
    : 0;

  track('paywall_dismissed', {
    source,
    time_on_paywall: Math.round(timeOnPaywall),
  });
}

// ============================================
// CORE APP EVENTS
// ============================================

/**
 * Track message sent
 */
export function trackMessageSent(conversationId: string, messageLength: number): void {
  track('message_sent', {
    conversation_id: conversationId,
    message_length: messageLength,
  });
}

/**
 * Track match viewed
 */
export function trackMatchViewed(matchId: string): void {
  track('match_viewed', {
    match_id: matchId,
  });
}

/**
 * Track match messaged (starting chat with match)
 */
export function trackMatchMessaged(matchId: string): void {
  track('match_messaged', {
    match_id: matchId,
  });
}

/**
 * Track post created
 */
export function trackPostCreated(hasImage: boolean, textLength: number): void {
  track('post_created', {
    has_image: hasImage,
    text_length: textLength,
  });
}

/**
 * Track post liked
 */
export function trackPostLiked(postId: string): void {
  track('post_liked', {
    post_id: postId,
  });
}

/**
 * Track companion chat started
 */
export function trackCompanionChatStarted(companionId: string): void {
  track('companion_chat_started', {
    companion_id: companionId,
  });
}

/**
 * Track companion call started
 */
export function trackCompanionCallStarted(companionId: string): void {
  track('companion_call_started', {
    companion_id: companionId,
  });
}

/**
 * Track companion call ended
 */
export function trackCompanionCallEnded(companionId: string, durationSeconds: number): void {
  track('companion_call_ended', {
    companion_id: companionId,
    duration_seconds: durationSeconds,
  });
}

/**
 * Track lesson started
 */
export function trackLessonStarted(lessonId: string, moduleId: string): void {
  track('lesson_started', {
    lesson_id: lessonId,
    module_id: moduleId,
  });
}

/**
 * Track lesson completed
 */
export function trackLessonCompleted(lessonId: string, durationSeconds: number, score?: number): void {
  track('lesson_completed', {
    lesson_id: lessonId,
    duration: durationSeconds,
    score,
  });
}

/**
 * Track settings changed
 */
export function trackSettingsChanged(settingName: string, newValue: any): void {
  track('settings_changed', {
    setting_name: settingName,
    new_value: typeof newValue === 'object' ? JSON.stringify(newValue) : newValue,
  });
}

/**
 * Track feedback submitted
 */
export function trackFeedbackSubmitted(category: string, rating: number | null): void {
  track('feedback_submitted', {
    category,
    rating,
  });
}

// ============================================
// ERROR EVENTS
// ============================================

/**
 * Track general error
 */
export function trackError(screen: string, errorType: string, errorMessage: string, stack?: string): void {
  track('error_occurred', {
    screen,
    error_type: errorType,
    error_message: errorMessage,
    stack: stack?.substring(0, 500), // Limit stack trace length
  });
}

/**
 * Track API error
 */
export function trackApiError(endpoint: string, statusCode: number, error: string): void {
  track('api_error', {
    endpoint,
    status_code: statusCode,
    error,
  });
}

/**
 * Track permission denied
 */
export function trackPermissionDenied(permissionType: 'camera' | 'photo_library' | 'notifications' | 'microphone'): void {
  track('permission_denied', {
    permission_type: permissionType,
  });
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get current session duration in seconds
 */
export function getSessionDuration(): number {
  return sessionStartTime ? Math.round((Date.now() - sessionStartTime) / 1000) : 0;
}

/**
 * Get onboarding duration in seconds
 */
export function getOnboardingDuration(): number {
  return onboardingStartTime ? Math.round((Date.now() - onboardingStartTime) / 1000) : 0;
}

/**
 * Flush events (force send to Mixpanel)
 */
export function flushEvents(): void {
  if (useHttpFallback) {
    // HTTP requests are sent immediately, no flush needed
    return;
  }

  if (!mixpanelInstance) {
    return;
  }

  try {
    mixpanelInstance.flush();
  } catch (error) {
    console.error('[Analytics] Flush error:', error);
  }
}

export default {
  initAnalytics,
  identify,
  setUserProperties,
  track,
  trackScreen,
  resetAnalytics,
  // App lifecycle
  trackAppOpened,
  trackAppBackgrounded,
  trackAppForegrounded,
  setupAppStateTracking,
  // Onboarding
  trackOnboardingStarted,
  trackTermsAccepted,
  trackPhotoAdded,
  trackPhotoRemoved,
  trackMainPhotoSet,
  trackPhotoCompleted,
  trackBasicsCompleted,
  trackGoalsSelected,
  trackInterestsSelected,
  trackOnboardingCompleted,
  trackOnboardingStepBack,
  trackOnboardingError,
  // Paywall & Purchases
  trackPaywallViewed,
  trackPlanSelected,
  trackPurchaseInitiated,
  trackPurchaseCompleted,
  trackPurchaseFailed,
  trackPurchaseCancelled,
  trackPurchaseRestored,
  trackPaywallDismissed,
  // Core App
  trackMessageSent,
  trackMatchViewed,
  trackMatchMessaged,
  trackPostCreated,
  trackPostLiked,
  trackCompanionChatStarted,
  trackCompanionCallStarted,
  trackCompanionCallEnded,
  trackLessonStarted,
  trackLessonCompleted,
  trackSettingsChanged,
  trackFeedbackSubmitted,
  // Errors
  trackError,
  trackApiError,
  trackPermissionDenied,
  // Utilities
  getSessionDuration,
  getOnboardingDuration,
  flushEvents,
};
