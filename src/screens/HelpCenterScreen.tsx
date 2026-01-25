import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography } from '../constants/theme';
import { useSettings } from '../context/SettingsContext';

interface HelpArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  icon: string;
}

interface HelpCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
}

const CATEGORIES: HelpCategory[] = [
  {
    id: 'getting-started',
    name: 'Getting Started',
    icon: 'rocket',
    color: Colors.primary,
    description: 'Learn the basics of Haven',
  },
  {
    id: 'profile',
    name: 'Your Profile',
    icon: 'person-circle',
    color: Colors.secondary,
    description: 'Customize your experience',
  },
  {
    id: 'matching',
    name: 'Matching & Connections',
    icon: 'heart',
    color: '#FF6B6B',
    description: 'Find your people',
  },
  {
    id: 'messaging',
    name: 'Messages & Chat',
    icon: 'chatbubbles',
    color: Colors.success,
    description: 'Stay connected',
  },
  {
    id: 'companions',
    name: 'AI Companions',
    icon: 'sparkles',
    color: '#9B59B6',
    description: 'Practice conversations',
  },
  {
    id: 'learning',
    name: 'Learning Hub',
    icon: 'school',
    color: '#3498DB',
    description: 'Build your skills',
  },
  {
    id: 'subscription',
    name: 'Subscription & Billing',
    icon: 'card',
    color: '#F39C12',
    description: 'Manage your plan',
  },
  {
    id: 'safety',
    name: 'Safety & Privacy',
    icon: 'shield-checkmark',
    color: '#1ABC9C',
    description: 'Stay safe online',
  },
];

const ARTICLES: HelpArticle[] = [
  // Getting Started
  {
    id: 'gs-1',
    title: 'Welcome to Haven',
    content: `Haven is a social connection app designed specifically for neurodivergent individuals. Whether you're autistic, have ADHD, or identify with other neurological differences, Haven provides a safe and understanding space to make genuine connections.

**What makes Haven different:**
• Designed by and for neurodivergent people
• Calm Mode to reduce sensory overload
• AI companions to practice conversations
• Learning Hub to build social skills
• A supportive community that gets you

**Your first steps:**
1. Complete your profile with photos and bio
2. Set your preferences for matching
3. Explore the community feed
4. Try chatting with an AI companion
5. Start matching with real people!`,
    category: 'getting-started',
    icon: 'heart',
  },
  {
    id: 'gs-2',
    title: 'Navigating the App',
    content: `Haven has five main tabs at the bottom of your screen:

**Community (People icon)**
See posts from other Haven members. Like, comment, and share your thoughts. This is a great place to connect with people who share your interests.

**Matches (Heart icon)**
Discover potential connections! Swipe right on profiles you like, left to pass. When two people both swipe right, it's a match!

**Classroom (Book icon)**
Access courses and lessons designed to help you build social skills, understand relationships, and gain confidence.

**Messages (Chat icon)**
All your conversations in one place - matches, connections, and AI companions.

**Profile (Your photo)**
Manage your settings, edit your profile, and customize your Haven experience.`,
    category: 'getting-started',
    icon: 'navigate',
  },
  {
    id: 'gs-3',
    title: 'Setting Up Your Profile',
    content: `A great profile helps you make meaningful connections. Here's how to set yours up:

**Profile Photo**
• Choose a clear, recent photo of yourself
• Smile! It makes you more approachable
• Avoid group photos for your main picture

**Bio**
• Be authentic - share what makes you, you
• Mention your interests and hobbies
• It's okay to share that you're neurodivergent
• Keep it positive and friendly

**Interests**
• Select interests that matter to you
• This helps us match you with similar people
• You can update these anytime

**Location**
• Your location helps find local connections
• You control who sees this information`,
    category: 'profile',
    icon: 'create',
  },
  // Profile
  {
    id: 'pr-1',
    title: 'Editing Your Profile',
    content: `To edit your profile:

1. Tap your profile picture in the bottom right
2. Tap "Edit" next to your profile card
3. Update your name, bio, photos, or location
4. Tap "Save" when you're done

**Tips:**
• Update your profile regularly to keep it fresh
• Add multiple photos to show different sides of you
• Your bio can be up to 500 characters`,
    category: 'profile',
    icon: 'create',
  },
  {
    id: 'pr-2',
    title: 'Privacy Settings',
    content: `Control who sees your information:

**Profile Privacy**
• Show Online Status - Let others see when you're active
• Show Last Active - Display when you were last online
• Appear in Searches - Control if others can find you

**Messaging Privacy**
• Message Requests - Approve messages from non-matches
• Read Receipts - Show when you've read messages

**Data Controls**
• Download your data anytime
• Delete your account if needed

Find these options in Settings > Privacy & Security.`,
    category: 'profile',
    icon: 'lock-closed',
  },
  // Matching
  {
    id: 'ma-1',
    title: 'How Matching Works',
    content: `Finding connections on Haven is easy:

**Swiping**
• Swipe RIGHT (or tap the heart) if you're interested
• Swipe LEFT (or tap X) to pass
• Take your time - there's no rush!

**Matching**
When two people both swipe right, it's a match! You'll be notified and can start chatting immediately.

**Who You'll See**
Haven shows you people based on:
• Your preferences (who you're looking to meet)
• Shared interests
• Location preferences
• Your goals (friendship, dating, practice)

**Tips for Success**
• Be yourself in your profile
• Swipe thoughtfully, not just on looks
• Read bios - shared interests matter!`,
    category: 'matching',
    icon: 'heart',
  },
  {
    id: 'ma-2',
    title: 'Starting Conversations',
    content: `Matched with someone? Here's how to start chatting:

**Opening Messages**
• Reference something from their profile
• Ask about a shared interest
• Keep it friendly and low-pressure
• Avoid generic "hey" messages

**Conversation Tips**
• Ask open-ended questions
• Share about yourself too
• It's okay if replies take time
• Be patient and understanding

**Example Openers**
• "I saw you're into [hobby] - what got you started?"
• "Your bio made me laugh! I also [shared experience]"
• "Fellow [interest] fan! What's your favorite [related thing]?"

Remember, the other person might be nervous too. Be kind and patient!`,
    category: 'matching',
    icon: 'chatbubble',
  },
  // Messaging
  {
    id: 'ms-1',
    title: 'Sending Messages',
    content: `Messaging on Haven is designed to be comfortable:

**Text Messages**
Type your message and tap send. You can use emojis to express yourself!

**Voice Messages**
Tap and hold the microphone to record. Great when typing feels like too much.

**Photos**
Share photos from your camera or gallery. Only share what you're comfortable with.

**Message Status**
• One check = sent
• Two checks = delivered
• Blue checks = read (if enabled)

**Taking Breaks**
It's okay to not reply immediately. Take your time, and don't feel pressured.`,
    category: 'messaging',
    icon: 'chatbubble-ellipses',
  },
  {
    id: 'ms-2',
    title: 'Managing Conversations',
    content: `Keep your messages organized:

**Archive Conversations**
Swipe left on a conversation to archive it. It won't delete - just moves out of sight.

**Delete Messages**
Long-press a message to delete it. This only removes it from your view.

**Block & Report**
If someone makes you uncomfortable:
1. Open the conversation
2. Tap the menu (three dots)
3. Select "Block" or "Report"

**Mute Notifications**
Swipe left on a conversation and tap the bell to mute notifications for that chat.`,
    category: 'messaging',
    icon: 'settings',
  },
  // AI Companions
  {
    id: 'ai-1',
    title: 'Meeting AI Companions',
    content: `AI Companions are friendly chat partners powered by AI:

**What They Offer**
• Practice conversations in a safe space
• Available 24/7 when you need to talk
• Different personalities to match your mood
• No judgment, just support

**How They Work**
AI Companions respond like real people but are clearly marked as AI. They're great for:
• Practicing social skills
• Working through anxious thoughts
• Casual conversation when you're lonely
• Preparing for real-life situations

**Moments**
AI chats use "moments" - credits included with your subscription:
• Pro: 1,000 moments/month
• Platinum: 8,000 moments/month
• You can also purchase additional moments`,
    category: 'companions',
    icon: 'sparkles',
  },
  {
    id: 'ai-2',
    title: 'Voice Calls with AI',
    content: `Have voice conversations with AI Companions:

**Starting a Call**
1. Open a conversation with an AI Companion
2. Tap the phone icon
3. Allow microphone access if prompted

**During the Call**
• Speak naturally - they understand conversational speech
• Pause to let them respond
• Tap the red button to end

**Moments Usage**
Voice calls use 100 moments per minute. Check your balance in the Store.

**Tips**
• Find a quiet place for better recognition
• Speak clearly but naturally
• It's okay to pause and think
• The AI will wait for you`,
    category: 'companions',
    icon: 'call',
  },
  // Learning Hub
  {
    id: 'lh-1',
    title: 'About the Learning Hub',
    content: `The Learning Hub helps you build social skills at your own pace:

**What's Included**
• Video lessons and interactive content
• Practice scenarios with AI
• Quizzes to test your knowledge
• Progress tracking and achievements

**Course Topics**
• Starting Conversations
• Reading Social Cues
• Building Friendships
• Dating Confidence
• Understanding Boundaries
• Managing Anxiety

**Your Progress**
• Earn XP as you complete lessons
• Unlock badges for achievements
• Track your learning streak
• Resume anytime - progress is saved`,
    category: 'learning',
    icon: 'school',
  },
  {
    id: 'lh-2',
    title: 'Audio Lessons',
    content: `Learn on the go with audio lessons:

**How They Work**
• Listen to scenario-based audio content
• Practice active listening skills
• Learn at your own pace

**Finding Audio Lessons**
1. Go to the Classroom tab
2. Tap "Audio Lessons"
3. Choose a scenario

**Tips**
• Use headphones for the best experience
• Listen in a comfortable environment
• Replay sections as needed
• Take notes if helpful`,
    category: 'learning',
    icon: 'headset',
  },
  // Subscription
  {
    id: 'sb-1',
    title: 'Plans & Pricing',
    content: `Haven offers two subscription plans:

**Pro - $14.99/month**
• 7-day free trial
• Community access
• All courses included
• Basic matching features
• 1,000 moments/month
• Standard support

**Platinum - $29.99/month**
• 7-day free trial
• Everything in Pro
• Unlimited messaging
• Priority matching
• 8,000 moments/month
• Exclusive AI companions
• Priority support

**Free Trial**
Both plans include a 7-day free trial. You won't be charged until your trial ends, and you can cancel anytime.`,
    category: 'subscription',
    icon: 'pricetag',
  },
  {
    id: 'sb-2',
    title: 'Managing Your Subscription',
    content: `Control your subscription through your device:

**Cancel Subscription**
• iOS: Settings > Apple ID > Subscriptions > Haven
• Android: Play Store > Subscriptions > Haven

**Change Plan**
Cancel your current plan and subscribe to the new one. Changes take effect at the next billing period.

**Restore Purchases**
If you reinstall Haven or get a new device:
1. Go to Store
2. Tap "Restore Purchases"
3. Sign in with your App Store/Play Store account

**Billing Questions**
For billing issues, contact:
• iOS: Apple Support
• Android: Google Play Support`,
    category: 'subscription',
    icon: 'settings',
  },
  // Safety
  {
    id: 'sf-1',
    title: 'Staying Safe Online',
    content: `Your safety is our priority:

**Protect Your Information**
• Never share financial information
• Don't share your address early on
• Be cautious with personal details
• Keep conversations in-app initially

**Recognizing Red Flags**
• Requests for money
• Pressure to move off the app quickly
• Inconsistent stories
• Refusal to video chat
• Love bombing (excessive affection early on)

**Trust Your Instincts**
If something feels wrong, it probably is. You can always:
• Block the person
• Report suspicious behavior
• Take a break from the conversation`,
    category: 'safety',
    icon: 'shield',
  },
  {
    id: 'sf-2',
    title: 'Meeting In Person',
    content: `When you're ready to meet someone:

**Before Meeting**
• Video chat first to verify they're real
• Tell a friend or family member your plans
• Share your location with someone you trust

**During the Meeting**
• Meet in a public place
• Arrange your own transportation
• Keep your phone charged
• Have a backup plan

**Trust Yourself**
• It's okay to leave if uncomfortable
• You don't owe anyone your time
• End the date whenever you want

**After Meeting**
• Let someone know you're safe
• Block if you felt uncomfortable
• Report serious concerns to Haven`,
    category: 'safety',
    icon: 'people',
  },
  {
    id: 'sf-3',
    title: 'Reporting & Blocking',
    content: `Keep Haven safe for everyone:

**Blocking Someone**
1. Open their profile or your chat
2. Tap the menu (three dots)
3. Select "Block"
4. They won't see your profile or contact you

**Reporting Someone**
1. Open their profile or chat
2. Tap the menu (three dots)
3. Select "Report"
4. Choose the reason
5. Add details if helpful

**What Happens Next**
• Reports are reviewed within 24 hours
• Serious violations result in immediate action
• You'll stay anonymous

**What to Report**
• Harassment or bullying
• Fake profiles
• Inappropriate content
• Scams or spam
• Safety concerns`,
    category: 'safety',
    icon: 'flag',
  },
];

const HelpCenterScreen = () => {
  const navigation = useNavigation();
  const { triggerHaptic } = useSettings();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);

  const filteredArticles = ARTICLES.filter((article) => {
    const matchesSearch =
      searchQuery === '' ||
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === null || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSelectCategory = (categoryId: string) => {
    triggerHaptic('light');
    setSelectedCategory(categoryId);
    setSelectedArticle(null);
  };

  const handleSelectArticle = (article: HelpArticle) => {
    triggerHaptic('light');
    setSelectedArticle(article);
  };

  const handleBack = () => {
    triggerHaptic('light');
    if (selectedArticle) {
      setSelectedArticle(null);
    } else if (selectedCategory) {
      setSelectedCategory(null);
    } else {
      navigation.goBack();
    }
  };

  const renderContent = (text: string) => {
    // Simple markdown-like rendering
    return text.split('\n').map((line, index) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return (
          <Text key={index} style={styles.contentHeading}>
            {line.slice(2, -2)}
          </Text>
        );
      }
      if (line.startsWith('• ')) {
        return (
          <View key={index} style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>{line.slice(2)}</Text>
          </View>
        );
      }
      if (line.match(/^\d+\. /)) {
        const [num, ...rest] = line.split('. ');
        return (
          <View key={index} style={styles.bulletPoint}>
            <Text style={styles.numberBullet}>{num}.</Text>
            <Text style={styles.bulletText}>{rest.join('. ')}</Text>
          </View>
        );
      }
      if (line === '') {
        return <View key={index} style={{ height: 12 }} />;
      }
      return (
        <Text key={index} style={styles.contentText}>
          {line}
        </Text>
      );
    });
  };

  // Article Detail View
  if (selectedArticle) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color={Colors.gray900} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {selectedArticle.title}
          </Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.articleContent} showsVerticalScrollIndicator={false}>
          <View style={styles.articleHeader}>
            <View style={[styles.articleIconContainer, { backgroundColor: `${Colors.primary}15` }]}>
              <Ionicons name={selectedArticle.icon as any} size={32} color={Colors.primary} />
            </View>
            <Text style={styles.articleTitle}>{selectedArticle.title}</Text>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>
                {CATEGORIES.find((c) => c.id === selectedArticle.category)?.name}
              </Text>
            </View>
          </View>

          <View style={styles.articleBody}>{renderContent(selectedArticle.content)}</View>

          {/* Helpful Section */}
          <View style={styles.helpfulSection}>
            <Text style={styles.helpfulTitle}>Was this helpful?</Text>
            <View style={styles.helpfulButtons}>
              <TouchableOpacity
                style={styles.helpfulButton}
                onPress={() => {
                  triggerHaptic('success');
                }}
              >
                <Ionicons name="thumbs-up-outline" size={20} color={Colors.success} />
                <Text style={[styles.helpfulButtonText, { color: Colors.success }]}>Yes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.helpfulButton}
                onPress={() => {
                  triggerHaptic('light');
                }}
              >
                <Ionicons name="thumbs-down-outline" size={20} color={Colors.gray500} />
                <Text style={styles.helpfulButtonText}>No</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Contact Support */}
          <TouchableOpacity
            style={styles.contactSupport}
            onPress={() => Linking.openURL('mailto:support@havenapp.com.au')}
          >
            <Ionicons name="mail-outline" size={24} color={Colors.primary} />
            <View style={styles.contactSupportText}>
              <Text style={styles.contactSupportTitle}>Still need help?</Text>
              <Text style={styles.contactSupportSubtitle}>Contact our support team</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.gray400} />
          </TouchableOpacity>

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Category Articles View
  if (selectedCategory) {
    const category = CATEGORIES.find((c) => c.id === selectedCategory);
    const categoryArticles = filteredArticles;

    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color={Colors.gray900} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{category?.name}</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.categoryHeaderCard}>
            <View style={[styles.categoryIconLarge, { backgroundColor: `${category?.color}15` }]}>
              <Ionicons name={category?.icon as any} size={32} color={category?.color} />
            </View>
            <Text style={styles.categoryDescription}>{category?.description}</Text>
          </View>

          <View style={styles.articlesList}>
            {categoryArticles.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="document-text-outline" size={48} color={Colors.gray300} />
                <Text style={styles.emptyStateText}>No articles found</Text>
              </View>
            ) : (
              categoryArticles.map((article) => (
                <TouchableOpacity
                  key={article.id}
                  style={styles.articleCard}
                  onPress={() => handleSelectArticle(article)}
                >
                  <View style={styles.articleCardIcon}>
                    <Ionicons name={article.icon as any} size={20} color={Colors.primary} />
                  </View>
                  <View style={styles.articleCardContent}>
                    <Text style={styles.articleCardTitle}>{article.title}</Text>
                    <Text style={styles.articleCardPreview} numberOfLines={2}>
                      {article.content.split('\n')[0]}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={Colors.gray400} />
                </TouchableOpacity>
              ))
            )}
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Main Categories View
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.gray900} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help Center</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={Colors.gray400} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for help..."
            placeholderTextColor={Colors.gray400}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={Colors.gray400} />
            </TouchableOpacity>
          )}
        </View>

        {/* Search Results */}
        {searchQuery.length > 0 ? (
          <View style={styles.searchResults}>
            <Text style={styles.sectionTitle}>
              {filteredArticles.length} result{filteredArticles.length !== 1 ? 's' : ''}
            </Text>
            {filteredArticles.map((article) => (
              <TouchableOpacity
                key={article.id}
                style={styles.articleCard}
                onPress={() => handleSelectArticle(article)}
              >
                <View style={styles.articleCardIcon}>
                  <Ionicons name={article.icon as any} size={20} color={Colors.primary} />
                </View>
                <View style={styles.articleCardContent}>
                  <Text style={styles.articleCardTitle}>{article.title}</Text>
                  <Text style={styles.articleCardPreview} numberOfLines={2}>
                    {article.content.split('\n')[0]}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.gray400} />
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <>
            {/* Welcome Card */}
            <View style={styles.welcomeCard}>
              <Text style={styles.welcomeTitle}>How can we help?</Text>
              <Text style={styles.welcomeSubtitle}>
                Browse categories below or search for specific topics
              </Text>
            </View>

            {/* Categories Grid */}
            <View style={styles.categoriesGrid}>
              {CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={styles.categoryCard}
                  onPress={() => handleSelectCategory(category.id)}
                >
                  <View style={[styles.categoryIcon, { backgroundColor: `${category.color}15` }]}>
                    <Ionicons name={category.icon as any} size={24} color={category.color} />
                  </View>
                  <Text style={styles.categoryName}>{category.name}</Text>
                  <Text style={styles.categoryDesc} numberOfLines={1}>
                    {category.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Popular Articles */}
            <View style={styles.popularSection}>
              <Text style={styles.sectionTitle}>Popular Articles</Text>
              {ARTICLES.slice(0, 4).map((article) => (
                <TouchableOpacity
                  key={article.id}
                  style={styles.articleCard}
                  onPress={() => handleSelectArticle(article)}
                >
                  <View style={styles.articleCardIcon}>
                    <Ionicons name={article.icon as any} size={20} color={Colors.primary} />
                  </View>
                  <View style={styles.articleCardContent}>
                    <Text style={styles.articleCardTitle}>{article.title}</Text>
                    <Text style={styles.articleCardCategory}>
                      {CATEGORIES.find((c) => c.id === article.category)?.name}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={Colors.gray400} />
                </TouchableOpacity>
              ))}
            </View>

            {/* Contact Section */}
            <View style={styles.contactSection}>
              <Text style={styles.contactTitle}>Can't find what you need?</Text>
              <TouchableOpacity
                style={styles.contactButton}
                onPress={() => Linking.openURL('mailto:support@havenapp.com.au')}
              >
                <Ionicons name="mail" size={20} color="white" />
                <Text style={styles.contactButtonText}>Contact Support</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.gray900,
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    ...Typography.body,
    color: Colors.gray900,
  },
  searchResults: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
  },
  welcomeCard: {
    backgroundColor: Colors.primary,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
  },
  welcomeTitle: {
    ...Typography.h2,
    color: 'white',
    marginBottom: Spacing.xs,
  },
  welcomeSubtitle: {
    ...Typography.body,
    color: 'rgba(255,255,255,0.8)',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },
  categoryCard: {
    width: '47%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    shadowColor: Colors.gray900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  categoryName: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.gray900,
    marginBottom: 4,
  },
  categoryDesc: {
    ...Typography.caption,
    color: Colors.gray500,
  },
  popularSection: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Colors.gray500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.md,
  },
  articleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  articleCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: `${Colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  articleCardContent: {
    flex: 1,
  },
  articleCardTitle: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.gray900,
  },
  articleCardCategory: {
    ...Typography.caption,
    color: Colors.gray500,
    marginTop: 2,
  },
  articleCardPreview: {
    ...Typography.caption,
    color: Colors.gray500,
    marginTop: 4,
  },
  contactSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    marginTop: Spacing.lg,
  },
  contactTitle: {
    ...Typography.body,
    color: Colors.gray600,
    marginBottom: Spacing.md,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
  },
  contactButtonText: {
    ...Typography.body,
    fontWeight: '600',
    color: 'white',
  },
  // Category Detail
  categoryHeaderCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  categoryIconLarge: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  categoryDescription: {
    ...Typography.body,
    color: Colors.gray600,
    textAlign: 'center',
  },
  articlesList: {
    paddingHorizontal: Spacing.lg,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyStateText: {
    ...Typography.body,
    color: Colors.gray500,
    marginTop: Spacing.md,
  },
  // Article Detail
  articleContent: {
    flex: 1,
  },
  articleHeader: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  articleIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  articleTitle: {
    ...Typography.h2,
    color: Colors.gray900,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  categoryBadge: {
    backgroundColor: `${Colors.primary}15`,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  categoryBadgeText: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.primary,
  },
  articleBody: {
    padding: Spacing.lg,
  },
  contentHeading: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.gray900,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  contentText: {
    ...Typography.body,
    color: Colors.gray700,
    lineHeight: 24,
  },
  bulletPoint: {
    flexDirection: 'row',
    marginBottom: Spacing.xs,
    paddingLeft: Spacing.sm,
  },
  bullet: {
    ...Typography.body,
    color: Colors.primary,
    marginRight: Spacing.sm,
    fontWeight: '700',
  },
  numberBullet: {
    ...Typography.body,
    color: Colors.primary,
    marginRight: Spacing.sm,
    fontWeight: '600',
    minWidth: 20,
  },
  bulletText: {
    ...Typography.body,
    color: Colors.gray700,
    flex: 1,
    lineHeight: 24,
  },
  helpfulSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
    marginHorizontal: Spacing.lg,
  },
  helpfulTitle: {
    ...Typography.body,
    color: Colors.gray600,
    marginBottom: Spacing.md,
  },
  helpfulButtons: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  helpfulButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.gray200,
    gap: Spacing.xs,
  },
  helpfulButtonText: {
    ...Typography.body,
    fontWeight: '500',
    color: Colors.gray500,
  },
  contactSupport: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  contactSupportText: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  contactSupportTitle: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.gray900,
  },
  contactSupportSubtitle: {
    ...Typography.caption,
    color: Colors.gray500,
  },
});

export default HelpCenterScreen;
