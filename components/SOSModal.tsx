import React, { useRef, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Dimensions,
  Animated,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { theme } from '../constants/theme';
import { hapticService } from '../services/hapticService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const URGE_OPTIONS = [
  { 
    id: 'text_call', 
    title: 'Text or call him',
    icon: 'call',
    color: '#F48FB1',
    gradient: ['#F48FB1', '#F8BBD9']
  },
  { 
    id: 'social_media', 
    title: 'Check his Instagram/social media',
    icon: 'logo-instagram',
    color: '#F48FB1',
    gradient: ['#F48FB1', '#F8BBD9']
  },
  { 
    id: 'drive_by', 
    title: 'Drive by his place',
    icon: 'car',
    color: '#F48FB1',
    gradient: ['#F48FB1', '#F8BBD9']
  },
  { 
    id: 'contact_friends', 
    title: 'Contact his friends',
    icon: 'people',
    color: '#F48FB1',
    gradient: ['#F48FB1', '#F8BBD9']
  },
  { 
    id: 'old_photos', 
    title: 'Look through old photos',
    icon: 'images',
    color: '#F48FB1',
    gradient: ['#F48FB1', '#F8BBD9']
  },
  { 
    id: 'send_message', 
    title: 'Send him a message',
    icon: 'chatbubble',
    color: '#F48FB1',
    gradient: ['#F48FB1', '#F8BBD9']
  },
];

interface SOSModalProps {
  visible: boolean;
  onClose: () => void;
  onUrgeSelect: (urgeId: string) => void;
}

export const SOSModal: React.FC<SOSModalProps> = ({
  visible,
  onClose,
  onUrgeSelect,
}) => {
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const backgroundOpacity = useRef(new Animated.Value(0)).current;
  const panY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Reset pan gesture and slide up animation
      panY.setValue(0);
      slideAnim.setValue(screenHeight);
      backgroundOpacity.setValue(0);
      
      requestAnimationFrame(() => {
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 280,
            useNativeDriver: true,
          }),
          Animated.timing(backgroundOpacity, {
            toValue: 0.5,
            duration: 280,
            useNativeDriver: true,
          }),
        ]).start();
      });
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

  const handleUrgePress = useCallback((urgeId: string) => {
    hapticService.light();
    
    // Trigger slide down animation, then call onUrgeSelect
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
      onUrgeSelect(urgeId);
    });
  }, [onUrgeSelect, slideAnim, backgroundOpacity]);

  const handleClose = useCallback(() => {
    hapticService.light();
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
  }, [onClose, slideAnim, backgroundOpacity]);

  const handlePanGestureEvent = Animated.event(
    [{ nativeEvent: { translationY: panY } }],
    { useNativeDriver: true }
  );

  const handlePanStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationY, velocityY } = event.nativeEvent;
      
      if (translationY > 100 || velocityY > 800) {
        handleClose();
      } else {
        Animated.spring(panY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }).start();
      }
    }
  };

  const renderUrgeOption = ({ item, index }: { item: typeof URGE_OPTIONS[0], index: number }) => (
    <View style={styles.urgeOptionContainer}>
      <Pressable
        style={({ pressed }) => [
          styles.urgeOption,
          { 
            opacity: pressed ? 0.8 : 1, 
            transform: [{ scale: pressed ? 0.96 : 1 }] 
          }
        ]}
        onPress={() => handleUrgePress(item.id)}
      >
        <LinearGradient
          colors={item.gradient as [string, string]}
          style={styles.urgeOptionGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.urgeOptionContent}>
            <View style={styles.iconContainer}>
              <Ionicons 
                name={item.icon as any} 
                size={28} 
                color="white" 
              />
            </View>
            <Text style={styles.urgeOptionText}>{item.title}</Text>
            <View style={styles.chevronContainer}>
              <Ionicons 
                name="chevron-forward" 
                size={20} 
                color="rgba(255, 255, 255, 0.8)" 
              />
            </View>
          </View>
        </LinearGradient>
      </Pressable>
    </View>
  );

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.overlay}>
      {/* Background overlay */}
      <Animated.View 
        style={[
          styles.background,
          { opacity: backgroundOpacity }
        ]}
      >
        <Pressable style={styles.backgroundTouchable} onPress={handleClose} />
      </Animated.View>

      {/* Modal content */}
      <PanGestureHandler
        onGestureEvent={handlePanGestureEvent}
        onHandlerStateChange={handlePanStateChange}
      >
        <Animated.View
          style={[
            styles.modal,
            { 
              transform: [
                { translateY: slideAnim },
                { translateY: panY }
              ] 
            }
          ]}
        >
          <LinearGradient
            colors={['#FFE4E6', '#FFF1F2', '#FFFFFF']}
            style={styles.modalContent}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          >
            {/* Drag handle */}
            <View style={styles.dragHandle} />
            
            {/* Header */}
            <View style={styles.header}>
              <Pressable style={styles.cancelButton} onPress={handleClose}>
                <View style={styles.cancelButtonBackground}>
                  <Ionicons name="close" size={20} color="#666" />
                </View>
              </Pressable>
              <View style={styles.titleContainer}>
                <View style={styles.headerIconContainer}>
                  <Ionicons name="shield-checkmark" size={32} color={theme.colors.primary} />
                </View>
                <Text style={styles.headerTitle}>No Contact Guardian</Text>
                <Text style={styles.headerSubtitle}>We're here to help you stay strong</Text>
              </View>
            </View>

            {/* Content */}
            <View style={styles.content}>
              <Text style={styles.questionText}>What are you feeling the urge to do?</Text>
              
              <FlatList 
                data={URGE_OPTIONS}
                keyExtractor={(item) => item.id}
                renderItem={renderUrgeOption}
                contentContainerStyle={styles.optionsList}
                showsVerticalScrollIndicator={false}
              />
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
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
  },
  backgroundTouchable: {
    flex: 1,
  },
  modal: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  modalContent: {
    flex: 1,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  dragHandle: {
    width: 50,
    height: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 16,
    marginBottom: 12,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.m,
    paddingTop: 24,
    paddingBottom: theme.spacing.l,
    position: 'relative',
  },
  cancelButton: {
    position: 'absolute',
    top: 12,
    right: 16,
    zIndex: 1,
  },
  cancelButtonBackground: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  titleContainer: {
    alignItems: 'center',
  },
  headerIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(244, 143, 177, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.m,
  },
  questionText: {
    fontSize: 22,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 24,
  },
  optionsList: {
    paddingBottom: 40,
  },
  urgeOptionContainer: {
    marginBottom: 16,
  },
  urgeOption: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  urgeOptionGradient: {
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  urgeOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  urgeOptionText: {
    fontSize: 17,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: 'white',
    flex: 1,
    lineHeight: 22,
  },
  chevronContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 