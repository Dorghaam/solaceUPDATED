import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Dimensions,
  Animated,
  ActivityIndicator,
  StatusBar,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { theme } from '../constants/theme';
import { hapticService } from '../services/hapticService';
import { supabase } from '../services/supabaseClient';
import { useUserStore } from '../store/userStore';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const TIMER_DURATION = 20 * 60; // 20 minutes in seconds
const QUOTE_ROTATION_INTERVAL = 5000; // 5 seconds

// Map urge types to quote categories
const URGE_CATEGORY_MAP: { [key: string]: string } = {
  'text_call': 'no_contact',
  'social_media': 'self_worth',
  'drive_by': 'letting_go',
  'contact_friends': 'boundaries',
  'old_photos': 'healing',
  'send_message': 'no_contact',
};

// Map urge types to personalized titles
const URGE_TITLE_MAP: { [key: string]: string } = {
  'text_call': 'Don\'t Text Him',
  'social_media': 'Stay Off His Socials',
  'drive_by': 'Don\'t Drive By',
  'contact_friends': 'Don\'t Contact His Friends',
  'old_photos': 'Don\'t Look at Old Photos',
  'send_message': 'Don\'t Send That Message',
};

// Distraction tasks for active coping
const DISTRACTION_TASKS = [
  {
    id: 'shake_stretch',
    title: 'Shake It Off',
    description: 'Shake your arms and body for 30 seconds',
    instruction: 'Shake your whole body! Let the tension go.',
    lottieFile: null, // Will be provided later
  },
  {
    id: 'gratitude',
    title: 'Gratitude Moment',
    description: 'Think of 3 things you\'re grateful for',
    instruction: 'Name 3 things you\'re grateful for right now.',
    lottieFile: null,
  },
  {
    id: 'deep_breathing',
    title: 'Deep Breaths',
    description: 'Take 5 slow, deep breaths',
    instruction: 'Breathe in for 4... hold for 4... out for 6...',
    lottieFile: null,
  },
  {
    id: 'power_pose',
    title: 'Power Pose',
    description: 'Stand tall with arms raised high',
    instruction: 'Stand strong! Arms up high like a champion.',
    lottieFile: null,
  },
  {
    id: 'write_feelings',
    title: 'Future Self',
    description: 'Think how you\'ll feel tomorrow if you don\'t text',
    instruction: 'Imagine tomorrow: "I\'m proud I didn\'t text him."',
    lottieFile: null,
  },
];

interface Quote {
  id: string;
  text: string;
  category?: string;
}

interface SOSCountdownScreenProps {
  visible: boolean;
  onClose: () => void;
  urgeType: string;
  onComplete: () => void;
}

export const SOSCountdownScreen: React.FC<SOSCountdownScreenProps> = ({
  visible,
  onClose,
  urgeType,
  onComplete,
}) => {
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const backgroundOpacity = useRef(new Animated.Value(0)).current;
  const quoteOpacity = useRef(new Animated.Value(1)).current;
  const breathingScale = useRef(new Animated.Value(1)).current;

  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION);
  const [isActive, setIsActive] = useState(false);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [isLoadingQuotes, setIsLoadingQuotes] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [activeTask, setActiveTask] = useState<string | null>(null);
  const [taskTimeLeft, setTaskTimeLeft] = useState(30);

  const { userName } = useUserStore();

  // Fetch quotes based on urge type
  const fetchQuotesForUrge = useCallback(async () => {
    try {
      setIsLoadingQuotes(true);
      
      const category = URGE_CATEGORY_MAP[urgeType] || 'general_healing';
      
      const { data, error } = await supabase
        .from('quotes')
        .select('id, text, category')
        .eq('category', category)
        .limit(50);

      if (error) {
        console.error('Error fetching SOS quotes:', error);
        // Fallback quotes
        setQuotes([
          { id: '1', text: 'This feeling will pass. You are stronger than your urges.' },
          { id: '2', text: 'Every moment you wait is a victory. You are healing.' },
          { id: '3', text: 'Your future self will thank you for choosing peace today.' },
        ]);
      } else if (data && data.length > 0) {
        // Shuffle quotes for variety
        const shuffledQuotes = [...data].sort(() => Math.random() - 0.5);
        setQuotes(shuffledQuotes);
      } else {
        // Default quotes if no data
        setQuotes([
          { id: '1', text: 'This feeling will pass. You are stronger than your urges.' },
          { id: '2', text: 'Every moment you wait is a victory. You are healing.' },
          { id: '3', text: 'Your future self will thank you for choosing peace today.' },
        ]);
      }
      
      setIsLoadingQuotes(false);
    } catch (error) {
      console.error('Failed to fetch SOS quotes:', error);
      setIsLoadingQuotes(false);
    }
  }, [urgeType]);

  // Animate screen in/out
  useEffect(() => {
    if (visible) {
      setIsActive(true);
      setTimeLeft(TIMER_DURATION);
      setIsCompleted(false);
      setCurrentQuoteIndex(0);
      
      fetchQuotesForUrge();
      
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(backgroundOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: screenHeight,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(backgroundOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  // Timer countdown
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(time => {
          if (time <= 1) {
            setIsActive(false);
            setIsCompleted(true);
            hapticService.success();
            onComplete();
            return 0;
          }
          return time - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft, onComplete]);

  // Task timer (30 seconds)
  useEffect(() => {
    let taskInterval: ReturnType<typeof setInterval> | null = null;
    
    if (activeTask && taskTimeLeft > 0) {
      taskInterval = setInterval(() => {
        setTaskTimeLeft(time => {
          if (time <= 1) {
            setActiveTask(null);
            hapticService.success();
            return 30; // Reset for next task
          }
          return time - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (taskInterval) clearInterval(taskInterval);
    };
  }, [activeTask, taskTimeLeft]);

  // Quote rotation
  useEffect(() => {
    if (!isActive || quotes.length === 0) return;
    
    const interval = setInterval(() => {
      // Fade out current quote
      Animated.timing(quoteOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        // Change quote
        setCurrentQuoteIndex(prev => (prev + 1) % quotes.length);
        
        // Fade in new quote
        Animated.timing(quoteOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }, QUOTE_ROTATION_INTERVAL);
    
    return () => clearInterval(interval);
  }, [isActive, quotes.length]);

  // Breathing animation
  useEffect(() => {
    if (!isActive) return;
    
    const breathingAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(breathingScale, {
          toValue: 1.1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(breathingScale, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    );
    
    breathingAnimation.start();
    
    return () => breathingAnimation.stop();
  }, [isActive]);

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleClose = () => {
    hapticService.light();
    setIsActive(false);
    onClose();
  };

  // Get personalized title based on urge type and user name
  const getPersonalizedTitle = () => {
    const baseTitle = URGE_TITLE_MAP[urgeType] || 'Stay Strong';
    const name = userName || 'Beautiful';
    return `${name}, ${baseTitle}`;
  };

  // Handle starting a distraction task
  const startTask = (taskId: string) => {
    hapticService.light();
    setActiveTask(taskId);
    setTaskTimeLeft(30);
  };

  // Handle stopping a task
  const stopTask = () => {
    hapticService.light();
    setActiveTask(null);
    setTaskTimeLeft(30);
  };

  // Get current active task details
  const getCurrentTask = () => {
    return DISTRACTION_TASKS.find(task => task.id === activeTask);
  };

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <Animated.View 
        style={[
          styles.background,
          { opacity: backgroundOpacity }
        ]}
      >
        <LinearGradient
          colors={['#1a1a2e', '#16213e', '#0f3460']}
          style={styles.gradient}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.content,
          { transform: [{ translateY: slideAnim }] }
        ]}
      >
        {/* Header - Close Button Only */}
        <View style={styles.header}>
          <Pressable
            style={styles.closeButton}
            onPress={handleClose}
          >
            <Ionicons name="close" size={24} color="white" />
          </Pressable>
        </View>

        {/* Scrollable Content */}
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={styles.headerTitle}>{getPersonalizedTitle()}</Text>
          </View>

          {/* Timer Display */}
          <View style={styles.timerContainer}>
            <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
            <Text style={styles.timerSubtitle}>
              {isCompleted ? 'You did it!' : 'Keep going...'}
            </Text>
          </View>

          {/* Breathing Animation */}
          <View style={styles.breathingContainer}>
            <Animated.View
              style={[
                styles.breathingCircle,
                { transform: [{ scale: breathingScale }] }
              ]}
            >
              <LottieView
                source={require('../assets/hearts-flourish-animation.json')}
                autoPlay
                loop
                style={styles.breathingAnimation}
              />
            </Animated.View>
          </View>

          {/* Quote Display */}
          <View style={styles.quoteContainer}>
            {isLoadingQuotes ? (
              <ActivityIndicator size="small" color="white" />
            ) : quotes.length > 0 ? (
              <Animated.View style={{ opacity: quoteOpacity }}>
                <Text style={styles.quoteText}>
                  "{quotes[currentQuoteIndex]?.text}"
                </Text>
              </Animated.View>
            ) : (
              <Text style={styles.quoteText}>
                "This feeling will pass. You are stronger than your urges."
              </Text>
            )}
          </View>

          {/* Distraction Tasks Section */}
          {!isCompleted && (
            <>
              {activeTask ? (
                /* Active Task Display */
                <View style={styles.activeTaskContainer}>
                  <Text style={styles.activeTaskTitle}>
                    {getCurrentTask()?.title}
                  </Text>
                  <Text style={styles.activeTaskInstruction}>
                    {getCurrentTask()?.instruction}
                  </Text>
                  <View style={styles.taskTimerContainer}>
                    <Text style={styles.taskTimer}>{taskTimeLeft}s</Text>
                  </View>
                  <Pressable
                    style={styles.stopTaskButton}
                    onPress={stopTask}
                  >
                    <Text style={styles.stopTaskButtonText}>Stop Task</Text>
                  </Pressable>
                </View>
              ) : (
                /* Task Cards Carousel */
                <View style={styles.tasksContainer}>
                  <Text style={styles.tasksTitle}>Try a quick distraction:</Text>
                  <View style={styles.taskCards}>
                    {DISTRACTION_TASKS.map((task) => (
                      <Pressable
                        key={task.id}
                        style={styles.taskCard}
                        onPress={() => startTask(task.id)}
                      >
                        <Text style={styles.taskCardTitle}>{task.title}</Text>
                        <Text style={styles.taskCardDescription}>
                          {task.description}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}
            </>
          )}

          {/* Completion State */}
          {isCompleted && (
            <View style={styles.completionContainer}>
              <Text style={styles.completionText}>
                🌟 Urge Surfed! You chose healing over hurt.
              </Text>
              <Pressable
                style={styles.completionButton}
                onPress={handleClose}
              >
                <Text style={styles.completionButtonText}>Continue</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: 60,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingLeft: 20,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  timerText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'Inter_24pt-Bold',
  },
  timerSubtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 10,
  },
  breathingContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  breathingCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  breathingAnimation: {
    width: 100,
    height: 100,
  },
  quoteContainer: {
    minHeight: 80,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  quoteText: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    lineHeight: 26,
    fontFamily: 'Inter_18pt-Regular',
  },
  completionContainer: {
    alignItems: 'center',
    marginTop: 30,
  },
  completionText: {
    fontSize: 20,
    color: 'white',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'Inter_18pt-Medium',
  },
  completionButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
  },
  completionButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Distraction Tasks Styles
  tasksContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  tasksTitle: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    marginBottom: 15,
    fontFamily: 'Inter_18pt-Medium',
  },
  taskCards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  taskCard: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
  },
  taskCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
    textAlign: 'center',
  },
  taskCardDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 16,
  },
  // Active Task Styles
  activeTaskContainer: {
    marginTop: 20,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    alignItems: 'center',
    marginHorizontal: 20,
  },
  activeTaskTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
    textAlign: 'center',
  },
  activeTaskInstruction: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  taskTimerContainer: {
    marginBottom: 20,
  },
  taskTimer: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.primary,
    textAlign: 'center',
  },
  stopTaskButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  stopTaskButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 