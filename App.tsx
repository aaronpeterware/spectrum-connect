import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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

// Context
import { PostsProvider } from './src/context/PostsContext';
import { UserProvider, useUser } from './src/context/UserContext';
import { PurchaseProvider } from './src/context/PurchaseContext';

// Components
import ErrorBoundary from './src/components/ErrorBoundary';

// Theme
import { Colors } from './src/constants/theme';

export type RootStackParamList = {
  MainTabs: undefined;
  CompanionProfile: { companionId: string };
  Companion: { companionId: string };
  Call: { companionId: string };
  Chat: { conversationId: string; name: string; avatar?: string; isOnline?: boolean; companionId?: string };
  CreatePost: undefined;
  Store: undefined;
  Lesson: { moduleId: string; lessonId: string };
  PracticeExam: { examId: string };
  Matches: undefined;
  PostDetail: { postId: string };
  UserProfile: { userId: string; name: string; avatar?: string };
};

export type MainTabParamList = {
  Home: undefined;
  Companions: undefined;
  Classroom: undefined;
  Messages: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const MainTabs = () => {
  const { user } = useUser();

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
        name="Companions"
        component={CompanionsScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <View style={[styles.tabIconContainer, focused && styles.tabIconContainerActive]}>
              <Ionicons name={focused ? 'heart-circle' : 'heart-circle-outline'} size={24} color={color} />
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

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <UserProvider>
            <PurchaseProvider>
              <PostsProvider>
                <NavigationContainer>
            <Stack.Navigator
            screenOptions={{
              headerShown: false,
              animation: 'fade',
            }}
          >
            <Stack.Screen name="MainTabs" component={MainTabs} />
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
              </Stack.Navigator>
                </NavigationContainer>
              </PostsProvider>
            </PurchaseProvider>
          </UserProvider>
        </ErrorBoundary>
        <StatusBar style="auto" />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
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
});
