import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography } from '../constants/theme';
import { AUDIO_MODULES, AudioModule, AudioScenario } from '../data/audioLessonData';
import { ProgressStorage, UserProgress } from './ClassroomScreen';

const { width } = Dimensions.get('window');

const AudioLessonsScreen = () => {
  const navigation = useNavigation<any>();
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [expandedModule, setExpandedModule] = useState<string | null>(AUDIO_MODULES[0]?.id);

  useEffect(() => {
    loadProgress();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadProgress();
    });
    return unsubscribe;
  }, [navigation]);

  const loadProgress = async () => {
    const savedProgress = await ProgressStorage.getProgress();
    setProgress(savedProgress);
  };

  const getScenarioProgress = (scenarioId: string) => {
    return progress?.lessonsCompleted.find(l => l.lessonId === scenarioId);
  };

  const getModuleCompletionCount = (module: AudioModule) => {
    if (!progress) return 0;
    return module.scenarios.filter(s =>
      progress.lessonsCompleted.some(l => l.lessonId === s.id && l.completed)
    ).length;
  };

  const navigateToScenario = (scenarioId: string) => {
    navigation.navigate('AudioLesson', { scenarioId });
  };

  const renderScenarioCard = (scenario: AudioScenario, moduleColor: string) => {
    const scenarioProgress = getScenarioProgress(scenario.id);
    const isCompleted = scenarioProgress?.completed;

    return (
      <TouchableOpacity
        key={scenario.id}
        style={[styles.scenarioCard, isCompleted && styles.scenarioCompleted]}
        onPress={() => navigateToScenario(scenario.id)}
        activeOpacity={0.7}
      >
        <View style={styles.scenarioLeft}>
          <View style={[
            styles.scenarioIcon,
            { backgroundColor: isCompleted ? Colors.success : moduleColor }
          ]}>
            {isCompleted ? (
              <Ionicons name="checkmark" size={20} color="white" />
            ) : (
              <Ionicons name="headset" size={20} color="white" />
            )}
          </View>
        </View>

        <View style={styles.scenarioContent}>
          <View style={styles.scenarioHeader}>
            <Text style={styles.scenarioTitle}>{scenario.title}</Text>
            <View style={[
              styles.difficultyBadge,
              scenario.difficulty === 'beginner' && styles.difficultyBeginner,
              scenario.difficulty === 'intermediate' && styles.difficultyIntermediate,
              scenario.difficulty === 'advanced' && styles.difficultyAdvanced,
            ]}>
              <Text style={styles.difficultyText}>{scenario.difficulty}</Text>
            </View>
          </View>

          <Text style={styles.scenarioDescription} numberOfLines={2}>
            {scenario.description}
          </Text>

          <View style={styles.scenarioMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={14} color={Colors.gray400} />
              <Text style={styles.metaText}>{scenario.duration}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="help-circle-outline" size={14} color={Colors.gray400} />
              <Text style={styles.metaText}>{scenario.questions.length} questions</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="star-outline" size={14} color="#FFD700" />
              <Text style={[styles.metaText, { color: '#FFD700' }]}>{scenario.xpReward} XP</Text>
            </View>
          </View>

          {scenarioProgress?.bestScore !== undefined && scenarioProgress.bestScore > 0 && (
            <View style={styles.scoreContainer}>
              <Text style={styles.scoreText}>Best: {scenarioProgress.bestScore}%</Text>
            </View>
          )}
        </View>

        <Ionicons name="chevron-forward" size={20} color={Colors.gray500} />
      </TouchableOpacity>
    );
  };

  const renderModule = (module: AudioModule) => {
    const isExpanded = expandedModule === module.id;
    const completedCount = getModuleCompletionCount(module);
    const totalCount = module.scenarios.length;

    return (
      <View key={module.id} style={styles.moduleContainer}>
        <TouchableOpacity
          style={styles.moduleHeader}
          onPress={() => setExpandedModule(isExpanded ? null : module.id)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[module.color, `${module.color}CC`]}
            style={styles.moduleGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.moduleIconContainer}>
              <Ionicons name={module.icon as any} size={28} color="white" />
            </View>

            <View style={styles.moduleInfo}>
              <Text style={styles.moduleTitle}>{module.title}</Text>
              <Text style={styles.moduleDescription}>{module.description}</Text>
              <View style={styles.moduleProgress}>
                <View style={styles.progressBarBg}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${(completedCount / totalCount) * 100}%` }
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {completedCount}/{totalCount} completed
                </Text>
              </View>
            </View>

            <Ionicons
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={24}
              color="white"
            />
          </LinearGradient>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.scenariosContainer}>
            {module.scenarios.map(scenario => renderScenarioCard(scenario, module.color))}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Audio Lessons</Text>
        <View style={styles.xpBadge}>
          <Ionicons name="star" size={16} color="#FFD700" />
          <Text style={styles.xpText}>{progress?.totalXP || 0} XP</Text>
        </View>
      </View>

      {/* Intro Card */}
      <View style={styles.introCard}>
        <View style={styles.introIconContainer}>
          <Ionicons name="ear" size={32} color={Colors.primary} />
        </View>
        <View style={styles.introContent}>
          <Text style={styles.introTitle}>Listen & Learn</Text>
          <Text style={styles.introText}>
            Hear real conversations and practice identifying social cues, tone, and body language signals.
          </Text>
        </View>
      </View>

      {/* Modules */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {AUDIO_MODULES.map(module => renderModule(module))}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A2E',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerTitle: {
    ...Typography.h2,
    color: 'white',
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  xpText: {
    color: '#FFD700',
    fontWeight: '600',
    marginLeft: 4,
  },
  introCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
  },
  introIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  introContent: {
    flex: 1,
  },
  introTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  introText: {
    color: Colors.gray400,
    fontSize: 13,
    lineHeight: 18,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  moduleContainer: {
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  moduleHeader: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  moduleGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  moduleIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  moduleInfo: {
    flex: 1,
  },
  moduleTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  moduleDescription: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
    marginTop: 2,
  },
  moduleProgress: {
    marginTop: Spacing.sm,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 2,
  },
  progressText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
    marginTop: 4,
  },
  scenariosContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: Spacing.md,
    marginTop: -BorderRadius.xl,
    paddingTop: BorderRadius.xl + Spacing.md,
    borderBottomLeftRadius: BorderRadius.xl,
    borderBottomRightRadius: BorderRadius.xl,
  },
  scenarioCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  scenarioCompleted: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  scenarioLeft: {
    marginRight: Spacing.md,
  },
  scenarioIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scenarioContent: {
    flex: 1,
  },
  scenarioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  scenarioTitle: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  difficultyBeginner: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
  },
  difficultyIntermediate: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
  },
  difficultyAdvanced: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  difficultyText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  scenarioDescription: {
    color: Colors.gray400,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: Spacing.sm,
  },
  scenarioMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: Colors.gray400,
    fontSize: 12,
  },
  scoreContainer: {
    marginTop: 6,
  },
  scoreText: {
    color: Colors.success,
    fontSize: 12,
    fontWeight: '500',
  },
});

export default AudioLessonsScreen;
