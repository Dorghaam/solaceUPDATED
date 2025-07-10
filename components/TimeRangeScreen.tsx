import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Dimensions,
  Animated,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { theme } from '../constants/theme';
import { useUserStore } from '../store/userStore';
import * as Haptics from 'expo-haptics';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface TimeRangeScreenProps {
  visible: boolean;
  onClose: () => void;
  onSave: (timeRange: { startHour: number; startMinute: number; endHour: number; endMinute: number }) => void;
}

export const TimeRangeScreen: React.FC<TimeRangeScreenProps> = ({
  visible,
  onClose,
  onSave,
}) => {
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const backgroundOpacity = useRef(new Animated.Value(0)).current;
  const panY = useRef(new Animated.Value(0)).current;

  const { subscriptionTier, notificationSettings } = useUserStore();
  
  // Initialize with current settings or defaults
  const [startHour, setStartHour] = useState(notificationSettings?.customTimeRange?.startHour || 9);
  const [startMinute, setStartMinute] = useState(notificationSettings?.customTimeRange?.startMinute || 0);
  const [endHour, setEndHour] = useState(notificationSettings?.customTimeRange?.endHour || 22);
  const [endMinute, setEndMinute] = useState(notificationSettings?.customTimeRange?.endMinute || 0);

  useEffect(() => {
    if (visible) {
      // Reset pan gesture and slide up animation
      panY.setValue(0);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(backgroundOpacity, {
          toValue: 0.5,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Slide down animation
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: screenHeight,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(backgroundOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: screenHeight,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(backgroundOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const handlePanGesture = Animated.event([{ nativeEvent: { translationY: panY } }], {
    useNativeDriver: true,
  });

  const handlePanStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationY, velocityY } = event.nativeEvent;
      if (translationY > 150 || velocityY > 1000) {
        handleClose();
      } else {
        Animated.spring(panY, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    }
  };

  const formatTime = (hour: number, minute: number) => {
    const formattedHour = hour.toString().padStart(2, '0');
    const formattedMinute = minute.toString().padStart(2, '0');
    return `${formattedHour}:${formattedMinute}`;
  };

  const adjustTime = (type: 'start' | 'end', field: 'hour' | 'minute', direction: 'increase' | 'decrease') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (type === 'start') {
      if (field === 'hour') {
        if (direction === 'increase' && startHour < 23) {
          setStartHour(startHour + 1);
        } else if (direction === 'decrease' && startHour > 0) {
          setStartHour(startHour - 1);
        }
      } else {
        if (direction === 'increase' && startMinute < 59) {
          setStartMinute(startMinute + 15);
        } else if (direction === 'decrease' && startMinute > 0) {
          setStartMinute(startMinute - 15);
        }
      }
    } else {
      if (field === 'hour') {
        if (direction === 'increase' && endHour < 23) {
          setEndHour(endHour + 1);
        } else if (direction === 'decrease' && endHour > 0) {
          setEndHour(endHour - 1);
        }
      } else {
        if (direction === 'increase' && endMinute < 59) {
          setEndMinute(endMinute + 15);
        } else if (direction === 'decrease' && endMinute > 0) {
          setEndMinute(endMinute - 15);
        }
      }
    }
  };

  const validateAndSave = () => {
    const startTimeInMinutes = startHour * 60 + startMinute;
    const endTimeInMinutes = endHour * 60 + endMinute;
    
    if (startTimeInMinutes >= endTimeInMinutes) {
      Alert.alert(
        'Invalid Time Range',
        'End time must be after start time.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    const timeDifferenceInHours = (endTimeInMinutes - startTimeInMinutes) / 60;
    if (timeDifferenceInHours < 1) {
      Alert.alert(
        'Invalid Time Range',
        'Time range must be at least 1 hour.',
        [{ text: 'OK' }]
      );
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSave({ startHour, startMinute, endHour, endMinute });
    handleClose();
  };

  const resetToDefault = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStartHour(9);
    setStartMinute(0);
    setEndHour(22);
    setEndMinute(0);
  };

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <Animated.View
        style={[
          styles.backgroundOverlay,
          {
            opacity: backgroundOpacity,
          },
        ]}
      >
        <Pressable style={styles.backgroundOverlay} onPress={handleClose} />
      </Animated.View>

      <PanGestureHandler
        onGestureEvent={handlePanGesture}
        onHandlerStateChange={handlePanStateChange}
      >
        <Animated.View
          style={[
            styles.container,
            {
              transform: [
                { translateY: slideAnim },
                { translateY: panY },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={[theme.colors.lightPink.lightest, theme.colors.lightPink.light]}
            style={styles.gradient}
          >
            {/* Handle Bar */}
            <View style={styles.handleBar} />
            
            {/* Header */}
            <View style={styles.header}>
              <Pressable onPress={handleClose}>
                <Text style={styles.doneButton}>Done</Text>
              </Pressable>
            </View>

            {/* Scrollable Content */}
            <ScrollView 
              style={styles.scrollContainer}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Title */}
              <Text style={styles.title}>Custom Time Range</Text>
              <Text style={styles.subtitle}>Set when you want to receive reminders</Text>

              {/* Time Controls */}
              <View style={styles.timeControlsContainer}>
                
                {/* Start Time */}
                <View style={styles.timeRow}>
                  <Text style={styles.timeLabel}>Start at</Text>
                  <View style={styles.timeControls}>
                    <Pressable 
                      style={styles.timeButton}
                      onPress={() => adjustTime('start', 'hour', 'decrease')}
                    >
                      <Ionicons name="remove" size={20} color="white" />
                    </Pressable>
                    <Text style={styles.timeDisplay}>{formatTime(startHour, startMinute)}</Text>
                    <Pressable 
                      style={styles.timeButton}
                      onPress={() => adjustTime('start', 'hour', 'increase')}
                    >
                      <Ionicons name="add" size={20} color="white" />
                    </Pressable>
                  </View>
                </View>

                {/* End Time */}
                <View style={styles.timeRow}>
                  <Text style={styles.timeLabel}>End at</Text>
                  <View style={styles.timeControls}>
                    <Pressable 
                      style={styles.timeButton}
                      onPress={() => adjustTime('end', 'hour', 'decrease')}
                    >
                      <Ionicons name="remove" size={20} color="white" />
                    </Pressable>
                    <Text style={styles.timeDisplay}>{formatTime(endHour, endMinute)}</Text>
                    <Pressable 
                      style={styles.timeButton}
                      onPress={() => adjustTime('end', 'hour', 'increase')}
                    >
                      <Ionicons name="add" size={20} color="white" />
                    </Pressable>
                  </View>
                </View>

              </View>

              {/* Time Range Preview */}
              <View style={styles.previewContainer}>
                <Text style={styles.previewTitle}>Active Hours</Text>
                <Text style={styles.previewText}>
                  {formatTime(startHour, startMinute)} - {formatTime(endHour, endMinute)}
                </Text>
                <Text style={styles.previewSubtext}>
                  {Math.round(((endHour * 60 + endMinute) - (startHour * 60 + startMinute)) / 60)} hours daily
                </Text>
              </View>
            </ScrollView>

            {/* Action Buttons - Fixed at bottom */}
            <View style={styles.buttonContainer}>
              <Pressable 
                style={styles.resetButton}
                onPress={resetToDefault}
              >
                <Text style={styles.resetButtonText}>Reset to Default</Text>
              </Pressable>
              
              <Pressable 
                style={styles.saveButton}
                onPress={validateAndSave}
              >
                <Text style={styles.saveButtonText}>Save Time Range</Text>
              </Pressable>
            </View>

          </LinearGradient>
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  backgroundOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'black',
  },
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: screenHeight * 0.75,
    maxHeight: 650,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    padding: 20,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: theme.colors.text,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
    opacity: 0.3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 20,
  },
  doneButton: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: 40,
  },
  timeControlsContainer: {
    marginBottom: 30,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
    paddingHorizontal: 10,
  },
  timeLabel: {
    fontSize: 18,
    color: theme.colors.text,
    fontWeight: '500',
  },
  timeControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  timeDisplay: {
    fontSize: 20,
    color: theme.colors.text,
    fontWeight: '600',
    minWidth: 60,
    textAlign: 'center',
  },
  previewContainer: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
    alignItems: 'center',
  },
  previewTitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  previewText: {
    fontSize: 24,
    color: theme.colors.text,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  previewSubtext: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
    paddingTop: 20,
    paddingBottom: 30,
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  resetButton: {
    flex: 1,
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  resetButtonText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
}); 