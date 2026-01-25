import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Linking,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography } from '../constants/theme';
import { useSettings } from '../context/SettingsContext';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const FAQS: FAQ[] = [
  // Getting Started
  {
    id: '1',
    question: 'What is Haven?',
    answer: 'Haven is a social connection app designed specifically for neurodivergent individuals, including those with autism, ADHD, and other neurological differences. Our goal is to help you make genuine connections in a safe, understanding environment.',
    category: 'Getting Started',
  },
  {
    id: '2',
    question: 'How much does Haven cost?',
    answer: 'Haven offers a 7-day free trial so you can explore all features risk-free! After your trial, choose from two plans: Pro at $14.99/month includes community access, all courses, basic matching, and 1,000 moments for AI companion chats. Platinum at $29.99/month gives you everything in Pro plus unlimited messaging, priority matching, 8,000 moments/month, exclusive AI companions, and priority support. Cancel anytime.',
    category: 'Getting Started',
  },
  {
    id: '3',
    question: 'How does matching work?',
    answer: 'We match you with others based on your interests, goals, and preferences. Swipe right on profiles you like and left on those you want to pass. When two people both swipe right on each other, it\'s a match and you can start chatting!',
    category: 'Getting Started',
  },
  // Account & Profile
  {
    id: '4',
    question: 'How do I edit my profile?',
    answer: 'Go to Settings (gear icon), then tap "Edit" next to your profile card. You can update your name, bio, location, and profile photo from there.',
    category: 'Account & Profile',
  },
  {
    id: '5',
    question: 'Can I change my email address?',
    answer: 'Yes, you can update your email in Settings > Edit Profile. You\'ll need to verify your new email address before the change takes effect.',
    category: 'Account & Profile',
  },
  {
    id: '6',
    question: 'How do I delete my account?',
    answer: 'Go to Settings > Privacy & Security > Delete Account. You\'ll have 30 days to reactivate your account before it\'s permanently deleted.',
    category: 'Account & Profile',
  },
  // Messaging
  {
    id: '7',
    question: 'Why can\'t I message someone?',
    answer: 'You can only message people you\'ve matched with. If you\'ve matched but can\'t send messages, try restarting the app or checking your internet connection.',
    category: 'Messaging',
  },
  {
    id: '8',
    question: 'Are my messages private?',
    answer: 'Yes! Your messages are encrypted and private between you and the person you\'re chatting with. Haven staff can only access messages if reported for safety reasons.',
    category: 'Messaging',
  },
  {
    id: '9',
    question: 'What are AI Companions?',
    answer: 'AI Companions are friendly chat partners powered by AI. They\'re great for practicing conversations, getting support, or just chatting when you need someone to talk to. They\'re clearly marked as AI and are not real people.',
    category: 'Messaging',
  },
  // Safety
  {
    id: '10',
    question: 'How do I report someone?',
    answer: 'Tap the three dots (...) on their profile or in your chat, then select "Report". Choose the reason and provide any details. Our team reviews all reports within 24 hours.',
    category: 'Safety',
  },
  {
    id: '11',
    question: 'How do I block someone?',
    answer: 'Tap the three dots (...) on their profile or in your chat, then select "Block". They won\'t be able to see your profile or contact you.',
    category: 'Safety',
  },
  {
    id: '12',
    question: 'What should I do if I feel unsafe?',
    answer: 'Your safety is our priority. Block and report the user immediately. If you\'re meeting someone in person, always meet in public and tell someone where you\'ll be. If you\'re in immediate danger, contact emergency services.',
    category: 'Safety',
  },
  // Learning Hub
  {
    id: '13',
    question: 'What is the Learning Hub?',
    answer: 'The Learning Hub offers courses designed to help you build social skills, understand relationships, and gain confidence. You earn XP and badges as you progress!',
    category: 'Learning Hub',
  },
  {
    id: '14',
    question: 'Is my learning progress saved?',
    answer: 'Yes! Your progress is automatically saved to your account and synced across devices. You can pick up right where you left off.',
    category: 'Learning Hub',
  },
  // Subscription & Billing
  {
    id: '15',
    question: 'What\'s included in the free trial?',
    answer: 'Your 7-day free trial gives you full access to all Haven features! You can explore the community, try AI companions, browse potential matches, and access all courses. No payment is taken during your trial, and you can cancel anytime before it ends.',
    category: 'Subscription & Billing',
  },
  {
    id: '16',
    question: 'What\'s the difference between Pro and Platinum?',
    answer: 'Pro ($14.99/month) includes community access, all courses, basic matching features, 1,000 moments/month for AI companions, and standard support. Platinum ($29.99/month) includes everything in Pro plus unlimited messaging, priority matching, 8,000 moments/month, exclusive AI companions, and priority support.',
    category: 'Subscription & Billing',
  },
  {
    id: '17',
    question: 'How do I cancel my subscription?',
    answer: 'You can cancel your subscription anytime through your device\'s app store settings. On iOS, go to Settings > Apple ID > Subscriptions > Haven. On Android, go to Google Play Store > Subscriptions > Haven. Your access continues until the end of your billing period.',
    category: 'Subscription & Billing',
  },
  {
    id: '18',
    question: 'What are moments?',
    answer: 'Moments are credits used for AI companion conversations. Text messages use a small amount of moments, while voice calls use 100 moments per minute. You get a monthly allowance with your subscription (1,000 for Pro, 8,000 for Platinum) or can purchase additional moment packs.',
    category: 'Subscription & Billing',
  },
  // Accessibility
  {
    id: '19',
    question: 'What is Calm Mode?',
    answer: 'Calm Mode reduces visual stimulation by using softer colors and slower animations. It\'s designed to be easier on sensory processing. Enable it in Settings > Accessibility.',
    category: 'Accessibility',
  },
  {
    id: '20',
    question: 'Can I turn off haptic feedback?',
    answer: 'Yes! Go to Settings > Accessibility and toggle off "Haptic Feedback" to disable vibrations throughout the app.',
    category: 'Accessibility',
  },
];

const CATEGORIES = ['All', 'Getting Started', 'Account & Profile', 'Messaging', 'Safety', 'Learning Hub', 'Subscription & Billing', 'Accessibility'];

const CRISIS_RESOURCES = [
  {
    name: 'Lifeline Australia',
    phone: '13 11 14',
    description: '24/7 crisis support and suicide prevention',
  },
  {
    name: 'Beyond Blue',
    phone: '1300 22 4636',
    description: 'Mental health support and information',
  },
  {
    name: 'Autism Connect',
    phone: '1300 308 699',
    description: 'Autism-specific support line',
  },
];

const HelpSupportScreen = () => {
  const navigation = useNavigation();
  const { triggerHaptic } = useSettings();

  const [activeCategory, setActiveCategory] = useState('All');
  const [expandedFaqs, setExpandedFaqs] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [contactModalVisible, setContactModalVisible] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'bug' | 'feature' | 'other'>('other');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackEmail, setFeedbackEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleFaq = (faqId: string) => {
    triggerHaptic('light');
    setExpandedFaqs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(faqId)) {
        newSet.delete(faqId);
      } else {
        newSet.add(faqId);
      }
      return newSet;
    });
  };

  const filteredFaqs = FAQS.filter(faq => {
    const matchesCategory = activeCategory === 'All' || faq.category === activeCategory;
    const matchesSearch = searchQuery === '' ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleSubmitFeedback = async () => {
    if (!feedbackMessage.trim()) {
      Alert.alert('Error', 'Please enter your message');
      return;
    }

    setIsSubmitting(true);
    triggerHaptic('light');

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setContactModalVisible(false);
      setFeedbackMessage('');
      setFeedbackEmail('');
      triggerHaptic('success');
      Alert.alert(
        'Thank You!',
        'Your message has been sent. Our support team will get back to you within 48 hours.',
        [{ text: 'OK' }]
      );
    }, 1500);
  };

  const handleCallCrisisLine = (phone: string) => {
    triggerHaptic('medium');
    Alert.alert(
      'Call Crisis Line',
      `This will call ${phone}. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call', onPress: () => Linking.openURL(`tel:${phone}`) },
      ]
    );
  };

  const handleEmailSupport = () => {
    triggerHaptic('light');
    Linking.openURL('mailto:support@havenapp.com.au?subject=Haven Support Request');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.gray900} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
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

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => setContactModalVisible(true)}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: `${Colors.primary}15` }]}>
              <Ionicons name="chatbubble-ellipses" size={24} color={Colors.primary} />
            </View>
            <Text style={styles.quickActionText}>Contact Us</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickAction} onPress={handleEmailSupport}>
            <View style={[styles.quickActionIcon, { backgroundColor: `${Colors.success}15` }]}>
              <Ionicons name="mail" size={24} color={Colors.success} />
            </View>
            <Text style={styles.quickActionText}>Email Support</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => {
              triggerHaptic('light');
              (navigation as any).navigate('HelpCenter');
            }}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: `${Colors.secondary}15` }]}>
              <Ionicons name="book" size={24} color={Colors.secondary} />
            </View>
            <Text style={styles.quickActionText}>Help Center</Text>
          </TouchableOpacity>
        </View>

        {/* FAQ Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          {CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category}
              style={[styles.categoryPill, activeCategory === category && styles.categoryPillActive]}
              onPress={() => {
                triggerHaptic('selection');
                setActiveCategory(category);
              }}
            >
              <Text
                style={[
                  styles.categoryPillText,
                  activeCategory === category && styles.categoryPillTextActive,
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* FAQs */}
        <View style={styles.faqSection}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          {filteredFaqs.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="search" size={48} color={Colors.gray300} />
              <Text style={styles.emptyStateText}>No results found</Text>
              <Text style={styles.emptyStateSubtext}>Try a different search term</Text>
            </View>
          ) : (
            filteredFaqs.map((faq) => (
              <View key={faq.id} style={styles.faqCard}>
                <TouchableOpacity style={styles.faqHeader} onPress={() => toggleFaq(faq.id)}>
                  <Text style={styles.faqQuestion}>{faq.question}</Text>
                  <Ionicons
                    name={expandedFaqs.has(faq.id) ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={Colors.gray500}
                  />
                </TouchableOpacity>
                {expandedFaqs.has(faq.id) && (
                  <View style={styles.faqContent}>
                    <Text style={styles.faqAnswer}>{faq.answer}</Text>
                    <View style={styles.faqMeta}>
                      <View style={styles.categoryTag}>
                        <Text style={styles.categoryTagText}>{faq.category}</Text>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            ))
          )}
        </View>

        {/* Crisis Resources */}
        <View style={styles.crisisSection}>
          <View style={styles.crisisHeader}>
            <Ionicons name="heart" size={24} color={Colors.error} />
            <Text style={styles.crisisTitle}>Need Immediate Support?</Text>
          </View>
          <Text style={styles.crisisSubtitle}>
            If you're in crisis or need urgent support, please reach out to these services:
          </Text>

          {CRISIS_RESOURCES.map((resource, index) => (
            <TouchableOpacity
              key={index}
              style={styles.crisisCard}
              onPress={() => handleCallCrisisLine(resource.phone)}
            >
              <View style={styles.crisisInfo}>
                <Text style={styles.crisisName}>{resource.name}</Text>
                <Text style={styles.crisisDescription}>{resource.description}</Text>
              </View>
              <View style={styles.crisisPhone}>
                <Ionicons name="call" size={20} color={Colors.primary} />
                <Text style={styles.crisisPhoneText}>{resource.phone}</Text>
              </View>
            </TouchableOpacity>
          ))}

          <View style={styles.emergencyNote}>
            <Ionicons name="warning" size={20} color={Colors.warning} />
            <Text style={styles.emergencyText}>
              In an emergency, call 000 (Australia) or your local emergency services.
            </Text>
          </View>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appVersion}>Haven v1.0.0</Text>
          <Text style={styles.appCopyright}>Made with love for the neurodivergent community</Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Contact Modal */}
      <Modal
        visible={contactModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setContactModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setContactModalVisible(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Contact Support</Text>
            <TouchableOpacity onPress={handleSubmitFeedback} disabled={isSubmitting}>
              {isSubmitting ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <Text style={styles.sendText}>Send</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Feedback Type */}
            <Text style={styles.inputLabel}>What can we help with?</Text>
            <View style={styles.feedbackTypes}>
              {[
                { key: 'bug', label: 'Report a Bug', icon: 'bug' },
                { key: 'feature', label: 'Feature Request', icon: 'bulb' },
                { key: 'other', label: 'Other', icon: 'chatbubble' },
              ].map((type) => (
                <TouchableOpacity
                  key={type.key}
                  style={[
                    styles.feedbackTypeButton,
                    feedbackType === type.key && styles.feedbackTypeButtonActive,
                  ]}
                  onPress={() => {
                    triggerHaptic('selection');
                    setFeedbackType(type.key as any);
                  }}
                >
                  <Ionicons
                    name={type.icon as any}
                    size={20}
                    color={feedbackType === type.key ? Colors.primary : Colors.gray500}
                  />
                  <Text
                    style={[
                      styles.feedbackTypeText,
                      feedbackType === type.key && styles.feedbackTypeTextActive,
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Email */}
            <View style={styles.formSection}>
              <Text style={styles.inputLabel}>Your Email (optional)</Text>
              <TextInput
                style={styles.input}
                value={feedbackEmail}
                onChangeText={setFeedbackEmail}
                placeholder="For us to reply to you"
                placeholderTextColor={Colors.gray400}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Message */}
            <View style={styles.formSection}>
              <Text style={styles.inputLabel}>Message</Text>
              <TextInput
                style={[styles.input, styles.messageInput]}
                value={feedbackMessage}
                onChangeText={setFeedbackMessage}
                placeholder="Please describe your issue or feedback..."
                placeholderTextColor={Colors.gray400}
                multiline
                textAlignVertical="top"
              />
            </View>

            {/* Info */}
            <View style={styles.feedbackInfo}>
              <Ionicons name="information-circle" size={20} color={Colors.primary} />
              <Text style={styles.feedbackInfoText}>
                Our support team typically responds within 48 hours. For urgent matters, please use the crisis resources on the Help page.
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  quickAction: {
    alignItems: 'center',
    flex: 1,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  quickActionText: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.gray700,
    textAlign: 'center',
  },
  categoriesContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  categoryPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.gray200,
    marginRight: Spacing.sm,
  },
  categoryPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryPillText: {
    ...Typography.bodySmall,
    color: Colors.gray600,
  },
  categoryPillTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  faqSection: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.md,
  },
  sectionTitle: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Colors.gray500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyStateText: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.gray500,
    marginTop: Spacing.md,
  },
  emptyStateSubtext: {
    ...Typography.bodySmall,
    color: Colors.gray400,
    marginTop: Spacing.xs,
  },
  faqCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
  },
  faqQuestion: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.gray900,
    flex: 1,
    paddingRight: Spacing.md,
  },
  faqContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
    paddingTop: Spacing.md,
  },
  faqAnswer: {
    ...Typography.body,
    color: Colors.gray600,
    lineHeight: 24,
  },
  faqMeta: {
    flexDirection: 'row',
    marginTop: Spacing.md,
  },
  categoryTag: {
    backgroundColor: `${Colors.primary}15`,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  categoryTagText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '500',
  },
  crisisSection: {
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: `${Colors.error}30`,
  },
  crisisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  crisisTitle: {
    ...Typography.h3,
    color: Colors.error,
  },
  crisisSubtitle: {
    ...Typography.bodySmall,
    color: Colors.gray600,
    marginBottom: Spacing.lg,
  },
  crisisCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray50,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  crisisInfo: {
    flex: 1,
  },
  crisisName: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.gray900,
  },
  crisisDescription: {
    ...Typography.caption,
    color: Colors.gray500,
    marginTop: 2,
  },
  crisisPhone: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.primary}15`,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  crisisPhoneText: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.primary,
  },
  emergencyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: `${Colors.warning}15`,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  emergencyText: {
    ...Typography.bodySmall,
    color: Colors.gray700,
    flex: 1,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  appVersion: {
    ...Typography.caption,
    color: Colors.gray400,
  },
  appCopyright: {
    ...Typography.caption,
    color: Colors.gray400,
    marginTop: 4,
    fontStyle: 'italic',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.gray50,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  modalTitle: {
    ...Typography.h3,
    color: Colors.gray900,
  },
  cancelText: {
    ...Typography.body,
    color: Colors.gray500,
  },
  sendText: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.primary,
  },
  modalContent: {
    flex: 1,
    padding: Spacing.lg,
  },
  inputLabel: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Colors.gray700,
    marginBottom: Spacing.sm,
  },
  feedbackTypes: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  feedbackTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.gray200,
    gap: Spacing.xs,
  },
  feedbackTypeButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}10`,
  },
  feedbackTypeText: {
    ...Typography.caption,
    fontWeight: '500',
    color: Colors.gray500,
  },
  feedbackTypeTextActive: {
    color: Colors.primary,
  },
  formSection: {
    marginBottom: Spacing.lg,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.gray200,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    ...Typography.body,
    color: Colors.gray900,
  },
  messageInput: {
    minHeight: 150,
    paddingTop: Spacing.md,
  },
  feedbackInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: `${Colors.primary}10`,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  feedbackInfoText: {
    ...Typography.bodySmall,
    color: Colors.gray600,
    flex: 1,
    lineHeight: 20,
  },
});

export default HelpSupportScreen;
