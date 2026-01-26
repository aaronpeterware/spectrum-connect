import 'react-native-gesture-handler';
import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet, Image, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ElevenLabsProvider } from '@elevenlabs/react-native';

// Notification Service
import {
  registerForPushNotifications,
  savePushToken,
  setupNotificationListeners,
  setNavigationRef,
  getLastNotificationResponse,
  handleNotificationResponse,
} from './src/services/notificationService';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import CompanionScreen from './src/screens/CompanionScreen';
import CompanionProfileScreen from './src/screens/CompanionProfileScreen';
import CompanionsScreen from './src/screens/CompanionsScreen';
import CommunityScreen from './src/screens/CommunityScreen';
import MatchesScreen from './src/screens/MatchesScreen';
import MessagesScreen from './src/screens/MessagesScreen';
import ChatScreen from './src/screens/ChatScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import StoreScreen from './src/screens/StoreScreen';
import ClassroomScreen from './src/screens/ClassroomScreen';
import LessonScreen from './src/screens/LessonScreen';
import PracticeExamScreen from './src/screens/PracticeExamScreen';
import CreatePostScreen from './src/screens/CreatePostScreen';
import CallScreen from './src/screens/CallScreen';
import PostDetailScreen from './src/screens/PostDetailScreen';
import UserProfileScreen from './src/screens/UserProfileScreen';
import AudioLessonsScreen from './src/screens/AudioLessonsScreen';
import AudioLessonScreen from './src/screens/AudioLessonScreen';
import PrivacySecurityScreen from './src/screens/PrivacySecurityScreen';
import TermsOfServiceScreen from './src/screens/TermsOfServiceScreen';
import HelpSupportScreen from './src/screens/HelpSupportScreen';
import HelpCenterScreen from './src/screens/HelpCenterScreen';

// Onboarding Screens
import {
  OnboardingWelcomeScreen,
  OnboardingPhotoScreen,
  OnboardingBasicsScreen,
    OnboardingGoalsScreen,
  OnboardingInterestsScreen,
  OnboardingCompleteScreen,
} from './src/screens/onboarding';

// Context
import { PostsProvider } from './src/context/PostsContext';
import { UserProvider, useUser } from './src/context/UserContext';
import { PurchaseProvider } from './src/context/PurchaseContext';
import { OnboardingProvider, useOnboarding } from './src/context/OnboardingContext';
import { SettingsProvider } from './src/context/SettingsContext';
import { ThemeProvider } from './src/context/ThemeContext';

// Components
import ErrorBoundary from './src/components/ErrorBoundary';

// Theme
import { Colors } from './src/constants/theme';

export type RootStackParamList = {
  Onboarding: undefined;
  MainTabs: undefined;
  Companions: undefined;
  CompanionProfile: { companionId: string };
  Companion: { companionId: string };
  Call: { companionId: string };
  Chat: {
    conversationId: string;
    name: string;
    avatar?: string;
    isOnline?: boolean;
    companionId?: string;
    recipientId?: string;
    isFakeUser?: boolean;
  };
  CreatePost: undefined;
  Store: undefined;
  Lesson: { moduleId: string; lessonId: string };
  PracticeExam: { examId: string };
  Matches: undefined;
  PostDetail: { postId: string };
  UserProfile: { userId: string; name: string; avatar?: string };
  AudioLessons: undefined;
  AudioLesson: { scenarioId: string };
  PrivacySecurity: undefined;
  TermsOfService: undefined;
  HelpSupport: undefined;
  HelpCenter: undefined;
};

export type OnboardingStackParamList = {
  Welcome: undefined;
  Photo: undefined;
  Basics: undefined;
  Goals: undefined;
  Interests: undefined;
  Complete: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Matches: undefined;
  Classroom: undefined;
  Messages: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const OnboardingStack = createNativeStackNavigator<OnboardingStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Onboarding Flow Navigator
const OnboardingNavigator: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const { currentStep } = useOnboarding();

  // Map step number to screen
  const getScreenForStep = () => {
    switch (currentStep) {
      case 0: return 'Welcome';
      case 1: return 'Photo';
      case 2: return 'Basics';
      case 3: return 'Goals';
      case 4: return 'Interests';
      case 5: return 'Complete';
      default: return 'Welcome';
    }
  };

  return (
    <OnboardingStack.Navigator
      screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
      initialRouteName={getScreenForStep()}
    >
      <OnboardingStack.Screen name="Welcome" component={OnboardingWelcomeScreen} />
      <OnboardingStack.Screen name="Photo" component={OnboardingPhotoScreen} />
      <OnboardingStack.Screen name="Basics" component={OnboardingBasicsScreen} />
      <OnboardingStack.Screen name="Goals" component={OnboardingGoalsScreen} />
      <OnboardingStack.Screen name="Interests" component={OnboardingInterestsScreen} />
      <OnboardingStack.Screen name="Complete">
        {() => <OnboardingCompleteScreen onComplete={onComplete} />}
      </OnboardingStack.Screen>
    </OnboardingStack.Navigator>
  );
};

const MainTabs = () => {
  const { user, unreadCount, unreadMatches } = useUser();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.gray400,
      }}
    >
      <Tab.Screen
        name="Home"
        component={CommunityScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <View style={[styles.tabIconContainer, focused && styles.tabIconContainerActive]}>
              <Ionicons name={focused ? 'people' : 'people-outline'} size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Matches"
        component={MatchesScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <View style={[styles.tabIconContainer, focused && styles.tabIconContainerActive]}>
              <Ionicons name={focused ? 'search' : 'search-outline'} size={24} color={color} />
              {unreadMatches > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unreadMatches > 99 ? '99+' : unreadMatches}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Classroom"
        component={ClassroomScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <View style={[styles.tabIconContainer, focused && styles.tabIconContainerActive]}>
              <Ionicons name={focused ? 'book' : 'book-outline'} size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Messages"
        component={MessagesScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <View style={[styles.tabIconContainer, focused && styles.tabIconContainerActive]}>
              <Ionicons name={focused ? 'chatbubbles' : 'chatbubbles-outline'} size={24} color={color} />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={[styles.profileTabContainer, focused && styles.profileTabContainerActive]}>
              <Image
                source={{ uri: user.profileImage }}
                style={styles.profileTabImage}
              />
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// Main app navigation with conditional onboarding
const AppNavigator = () => {
  const { isLoaded, onboardingCompleted, setOnboardingCompleted } = useUser();
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);
  const notificationListenerCleanup = useRef<(() => void) | null>(null);

  // Initialize notifications when app loads
  useEffect(() => {
    const initializeNotifications = async () => {
      // Register for push notifications
      const token = await registerForPushNotifications();
      if (token) {
        // Save token to backend
        await savePushToken(token);
      }

      // Set up notification listeners
      notificationListenerCleanup.current = setupNotificationListeners();

      // Handle notification that opened the app
      const lastResponse = await getLastNotificationResponse();
      if (lastResponse && navigationRef.current) {
        handleNotificationResponse(lastResponse);
      }
    };

    if (isLoaded && onboardingCompleted) {
      initializeNotifications();
    }

    // Cleanup on unmount
    return () => {
      if (notificationListenerCleanup.current) {
        notificationListenerCleanup.current();
      }
    };
  }, [isLoaded, onboardingCompleted]);

  // Update navigation ref for notification handling
  useEffect(() => {
    if (navigationRef.current) {
      setNavigationRef(navigationRef.current);
    }
  }, [navigationRef.current]);

  // Show loading screen while checking onboarding status
  if (!isLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const handleOnboardingComplete = () => {
    setOnboardingCompleted(true);
  };

  return (
    <NavigationContainer ref={navigationRef}>
      {!onboardingCompleted ? (
        <OnboardingProvider>
          <OnboardingNavigator onComplete={handleOnboardingComplete} />
        </OnboardingProvider>
      ) : (
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            animation: 'fade',
          }}
        >
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen
            name="Companions"
            component={CompanionsScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="CompanionProfile"
            component={CompanionProfileScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="Companion"
            component={CompanionScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="Chat"
            component={ChatScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="CreatePost"
            component={CreatePostScreen}
            options={{ animation: 'slide_from_bottom', presentation: 'modal' }}
          />
          <Stack.Screen
            name="Matches"
            component={MatchesScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="Store"
            component={StoreScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="Call"
            component={CallScreen}
            options={{ animation: 'fade' }}
          />
          <Stack.Screen
            name="Lesson"
            component={LessonScreen}
            options={{ animation: 'slide_from_bottom', gestureEnabled: false }}
          />
          <Stack.Screen
            name="PracticeExam"
            component={PracticeExamScreen}
            options={{ animation: 'slide_from_bottom', gestureEnabled: false }}
          />
          <Stack.Screen
            name="PostDetail"
            component={PostDetailScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="UserProfile"
            component={UserProfileScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="AudioLessons"
            component={AudioLessonsScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="AudioLesson"
            component={AudioLessonScreen}
            options={{ animation: 'slide_from_bottom', gestureEnabled: false }}
          />
          <Stack.Screen
            name="PrivacySecurity"
            component={PrivacySecurityScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="TermsOfService"
            component={TermsOfServiceScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="HelpSupport"
            component={HelpSupportScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="HelpCenter"
            component={HelpCenterScreen}
            options={{ animation: 'slide_from_right' }}
          />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ElevenLabsProvider>
        <SafeAreaProvider>
          <ErrorBoundary>
            <UserProvider>
              <SettingsProvider>
                <ThemeProvider>
                  <PurchaseProvider>
                    <PostsProvider>
                      <AppNavigator />
                    </PostsProvider>
                  </PurchaseProvider>
                </ThemeProvider>
              </SettingsProvider>
            </UserProvider>
          </ErrorBoundary>
        </SafeAreaProvider>
      </ElevenLabsProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  tabBar: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
    height: 80,
    paddingBottom: 20,
    paddingTop: 10,
  },
  tabIconContainer: {
    width: 48,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconContainerActive: {
    backgroundColor: `${Colors.primary}15`,
  },
  profileTabContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
  },
  profileTabContainerActive: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  profileTabImage: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  badgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700',
  },
});
