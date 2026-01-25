import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography } from '../constants/theme';
import { useSettings } from '../context/SettingsContext';

interface Section {
  id: string;
  title: string;
  content: string[];
}

const TERMS_SECTIONS: Section[] = [
  {
    id: 'acceptance',
    title: '1. Acceptance of Terms',
    content: [
      'By downloading, accessing, or using Haven ("the App"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use the App.',
      'We reserve the right to modify these Terms at any time. Continued use of the App after changes constitutes acceptance of the modified Terms.',
      'You must be at least 18 years old to use Haven. By using the App, you represent and warrant that you meet this age requirement.',
    ],
  },
  {
    id: 'description',
    title: '2. Service Description',
    content: [
      'Haven is a social connection platform designed specifically for neurodivergent individuals, including those with autism, ADHD, and other neurological differences.',
      'The App provides features including but not limited to: profile creation, matching with other users, messaging, community forums, educational content, and AI companion interactions.',
      'Haven is intended to facilitate genuine connections and friendships. It is not a substitute for professional mental health services or therapy.',
    ],
  },
  {
    id: 'account',
    title: '3. User Accounts',
    content: [
      'You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.',
      'You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate.',
      'You may not create multiple accounts, use another person\'s account, or transfer your account to anyone else.',
      'We reserve the right to suspend or terminate accounts that violate these Terms or engage in harmful behavior.',
    ],
  },
  {
    id: 'conduct',
    title: '4. User Conduct',
    content: [
      'You agree to treat all users with respect and dignity. Haven is a safe space, and we have zero tolerance for harassment, bullying, or discrimination.',
      'You will not post content that is: offensive, abusive, threatening, defamatory, obscene, or otherwise objectionable.',
      'You will not engage in: stalking, harassment, impersonation, fraud, or any illegal activities.',
      'You will not share personal information of others without their consent, including photos, contact details, or private conversations.',
      'You will not use the App for commercial purposes, advertising, or solicitation without our written consent.',
      'You will not attempt to circumvent any security features or exploit vulnerabilities in the App.',
    ],
  },
  {
    id: 'content',
    title: '5. User Content',
    content: [
      'You retain ownership of content you create and share on Haven ("User Content"). By posting content, you grant us a non-exclusive, worldwide, royalty-free license to use, display, and distribute your content within the App.',
      'You are solely responsible for your User Content and the consequences of posting it.',
      'We reserve the right to remove any content that violates these Terms or that we deem inappropriate, without prior notice.',
      'We do not endorse or guarantee the accuracy of any User Content posted by users.',
    ],
  },
  {
    id: 'ai',
    title: '6. AI Features',
    content: [
      'Haven includes AI-powered features including companion chat and practice conversations. These features are designed to provide support and practice, not professional advice.',
      'AI companions are clearly identified and are not real people. Conversations with AI companions are processed by our AI systems.',
      'Some user profiles may be AI-generated for testing purposes. These are marked internally and designed to facilitate positive interactions.',
      'You understand that AI responses are generated automatically and may not always be accurate or appropriate.',
    ],
  },
  {
    id: 'privacy',
    title: '7. Privacy',
    content: [
      'Your privacy is important to us. Please review our Privacy Policy, which explains how we collect, use, and protect your personal information.',
      'We implement industry-standard security measures to protect your data, but no system is completely secure.',
      'We will never sell your personal data to third parties for advertising purposes.',
      'You can request a copy of your data or request deletion of your account at any time through the App settings.',
    ],
  },
  {
    id: 'safety',
    title: '8. Safety Guidelines',
    content: [
      'While we strive to create a safe environment, we cannot guarantee the behavior of other users. Always exercise caution when interacting with people you meet online.',
      'Never share sensitive personal information (financial details, home address, workplace) with people you don\'t know well.',
      'If you decide to meet someone in person, always meet in a public place and tell someone you trust about your plans.',
      'Report any suspicious behavior, harassment, or safety concerns to our support team immediately.',
      'If you are in crisis or experiencing thoughts of self-harm, please contact emergency services or a mental health crisis line.',
    ],
  },
  {
    id: 'intellectual',
    title: '9. Intellectual Property',
    content: [
      'Haven and its original content, features, and functionality are owned by Haven Pty Ltd and are protected by international copyright, trademark, and other intellectual property laws.',
      'You may not copy, modify, distribute, sell, or lease any part of the App or its content without our explicit written permission.',
      'The Haven name, logo, and all related names, logos, and slogans are trademarks of Haven Pty Ltd.',
    ],
  },
  {
    id: 'disclaimer',
    title: '10. Disclaimer of Warranties',
    content: [
      'THE APP IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED.',
      'We do not guarantee that the App will be uninterrupted, secure, or error-free.',
      'We do not guarantee that you will find a match, make friends, or achieve any particular outcome from using the App.',
      'We are not responsible for the conduct of any user, whether online or offline.',
    ],
  },
  {
    id: 'limitation',
    title: '11. Limitation of Liability',
    content: [
      'TO THE MAXIMUM EXTENT PERMITTED BY LAW, HAVEN SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES.',
      'Our total liability for any claims arising from your use of the App shall not exceed the amount you paid us in the past twelve months, if any.',
      'Some jurisdictions do not allow limitation of liability, so these limitations may not apply to you.',
    ],
  },
  {
    id: 'termination',
    title: '12. Termination',
    content: [
      'You may terminate your account at any time by using the delete account feature in the App settings.',
      'We may suspend or terminate your access to the App at any time, with or without cause, and with or without notice.',
      'Upon termination, your right to use the App will immediately cease, but these Terms will survive to the extent necessary.',
    ],
  },
  {
    id: 'governing',
    title: '13. Governing Law',
    content: [
      'These Terms shall be governed by and construed in accordance with the laws of Australia, without regard to its conflict of law provisions.',
      'Any disputes arising from these Terms or your use of the App shall be resolved in the courts of New South Wales, Australia.',
      'If any provision of these Terms is found to be unenforceable, the remaining provisions will continue in effect.',
    ],
  },
  {
    id: 'contact',
    title: '14. Contact Us',
    content: [
      'If you have any questions about these Terms, please contact us at:',
      'Email: legal@havenapp.com.au',
      'Address: Haven Pty Ltd, Sydney, NSW, Australia',
      'We aim to respond to all inquiries within 5 business days.',
    ],
  },
];

const PRIVACY_POLICY_SECTIONS: Section[] = [
  {
    id: 'collection',
    title: '1. Information We Collect',
    content: [
      'Account Information: Name, email, date of birth, gender, location, profile photos, and bio.',
      'Usage Data: How you interact with the App, including features used, time spent, and preferences.',
      'Device Information: Device type, operating system, unique device identifiers, and IP address.',
      'Communications: Messages you send through the App (encrypted in transit and at rest).',
      'Optional Information: Interests, goals, diagnosis information (only if you choose to share).',
    ],
  },
  {
    id: 'use',
    title: '2. How We Use Your Information',
    content: [
      'To provide and maintain the App and its features.',
      'To match you with compatible users based on your preferences.',
      'To personalize your experience and show relevant content.',
      'To communicate with you about updates, features, and support.',
      'To ensure safety and security, and enforce our Terms of Service.',
      'To improve our services through aggregated, anonymized analytics.',
    ],
  },
  {
    id: 'sharing',
    title: '3. Information Sharing',
    content: [
      'We do NOT sell your personal data to third parties.',
      'We share information with service providers who help us operate the App (e.g., cloud hosting, analytics).',
      'We may share information if required by law or to protect the safety of users.',
      'If Haven is acquired or merged, your information may be transferred to the new owner.',
    ],
  },
  {
    id: 'security',
    title: '4. Data Security',
    content: [
      'We use industry-standard encryption for data in transit and at rest.',
      'We implement access controls and regular security audits.',
      'We limit employee access to personal data on a need-to-know basis.',
      'Despite our efforts, no system is 100% secure. We encourage you to use strong passwords.',
    ],
  },
  {
    id: 'rights',
    title: '5. Your Rights',
    content: [
      'Access: Request a copy of your personal data.',
      'Correction: Update or correct inaccurate information.',
      'Deletion: Request deletion of your account and data.',
      'Portability: Receive your data in a portable format.',
      'Opt-out: Disable certain data collection through App settings.',
    ],
  },
  {
    id: 'retention',
    title: '6. Data Retention',
    content: [
      'We retain your data while your account is active.',
      'After account deletion, we retain data for 30 days (grace period), then permanently delete it.',
      'Some data may be retained longer for legal compliance or legitimate business purposes.',
    ],
  },
];

const TermsOfServiceScreen = () => {
  const navigation = useNavigation();
  const { triggerHaptic } = useSettings();
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>('terms');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const toggleSection = (sectionId: string) => {
    triggerHaptic('light');
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const handleContactSupport = () => {
    triggerHaptic('light');
    Linking.openURL('mailto:support@havenapp.com.au');
  };

  const currentSections = activeTab === 'terms' ? TERMS_SECTIONS : PRIVACY_POLICY_SECTIONS;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.gray900} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Legal</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'terms' && styles.activeTab]}
          onPress={() => {
            triggerHaptic('selection');
            setActiveTab('terms');
          }}
        >
          <Text style={[styles.tabText, activeTab === 'terms' && styles.activeTabText]}>
            Terms of Service
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'privacy' && styles.activeTab]}
          onPress={() => {
            triggerHaptic('selection');
            setActiveTab('privacy');
          }}
        >
          <Text style={[styles.tabText, activeTab === 'privacy' && styles.activeTabText]}>
            Privacy Policy
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Last Updated */}
        <View style={styles.lastUpdated}>
          <Ionicons name="time-outline" size={16} color={Colors.gray500} />
          <Text style={styles.lastUpdatedText}>Last updated: January 1, 2026</Text>
        </View>

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <Ionicons name="document-text" size={24} color={Colors.primary} />
          <View style={styles.summaryContent}>
            <Text style={styles.summaryTitle}>
              {activeTab === 'terms' ? 'Terms Summary' : 'Privacy Summary'}
            </Text>
            <Text style={styles.summaryText}>
              {activeTab === 'terms'
                ? 'By using Haven, you agree to be respectful, keep your account secure, and follow our community guidelines. We\'re here to help you make genuine connections.'
                : 'We collect only the data needed to provide our services. We never sell your data. You control your privacy settings and can delete your data anytime.'}
            </Text>
          </View>
        </View>

        {/* Sections */}
        <View style={styles.sectionsContainer}>
          {currentSections.map((section) => (
            <View key={section.id} style={styles.sectionCard}>
              <TouchableOpacity
                style={styles.sectionHeader}
                onPress={() => toggleSection(section.id)}
              >
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <Ionicons
                  name={expandedSections.has(section.id) ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={Colors.gray500}
                />
              </TouchableOpacity>
              {expandedSections.has(section.id) && (
                <View style={styles.sectionContent}>
                  {section.content.map((paragraph, index) => (
                    <Text key={index} style={styles.paragraph}>
                      {paragraph}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Contact Card */}
        <View style={styles.contactCard}>
          <Ionicons name="help-circle" size={24} color={Colors.primary} />
          <View style={styles.contactContent}>
            <Text style={styles.contactTitle}>Questions?</Text>
            <Text style={styles.contactText}>
              If you have any questions about our terms or privacy practices, we're here to help.
            </Text>
            <TouchableOpacity style={styles.contactButton} onPress={handleContactSupport}>
              <Text style={styles.contactButtonText}>Contact Support</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Accept Banner */}
        <View style={styles.acceptBanner}>
          <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
          <Text style={styles.acceptText}>
            By using Haven, you accept these {activeTab === 'terms' ? 'terms' : 'privacy practices'}
          </Text>
        </View>

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
  },
  placeholder: {
    width: 40,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: Colors.primary,
  },
  tabText: {
    ...Typography.body,
    color: Colors.gray500,
  },
  activeTabText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  lastUpdated: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.xs,
  },
  lastUpdatedText: {
    ...Typography.caption,
    color: Colors.gray500,
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: `${Colors.primary}10`,
    marginHorizontal: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: `${Colors.primary}30`,
  },
  summaryContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  summaryTitle: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 4,
  },
  summaryText: {
    ...Typography.bodySmall,
    color: Colors.gray600,
    lineHeight: 20,
  },
  sectionsContainer: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.gray900,
    flex: 1,
    paddingRight: Spacing.md,
  },
  sectionContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
    paddingTop: Spacing.md,
  },
  paragraph: {
    ...Typography.bodySmall,
    color: Colors.gray600,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  contactCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
  },
  contactContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  contactTitle: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.gray900,
    marginBottom: 4,
  },
  contactText: {
    ...Typography.bodySmall,
    color: Colors.gray500,
    marginBottom: Spacing.md,
  },
  contactButton: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  contactButtonText: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: 'white',
  },
  acceptBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: `${Colors.success}15`,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  acceptText: {
    ...Typography.bodySmall,
    color: Colors.success,
    fontWeight: '500',
  },
});

export default TermsOfServiceScreen;
