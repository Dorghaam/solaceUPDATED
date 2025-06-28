import React, { useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Dimensions,
  Animated,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { theme } from '../constants/theme';
import { useUserStore } from '@/store/userStore';
import * as Haptics from 'expo-haptics';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const SUPPORT_EMAIL = 'logicttp@gmail.com';

interface ContactSupportScreenProps {
  visible: boolean;
  onClose: () => void;
}

export const ContactSupportScreen: React.FC<ContactSupportScreenProps> = ({
  visible,
  onClose,
}) => {
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const backgroundOpacity = useRef(new Animated.Value(0)).current;
  const panY = useRef(new Animated.Value(0)).current;
  
  const { supabaseUser, userName } = useUserStore();

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

  const handlePress = async (type: 'feature' | 'support') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const subject = type === 'feature' 
      ? `Feature Request from Solace User`
      : `Support Request from Solace User`;
      
    const body = `
      ---
      *Please describe your request above this line.*
      
      App Version: 1.0.11
      User Name: ${userName || 'Not Provided'}
      User ID: ${supabaseUser?.id || 'Not Logged In'}
    `;

    const url = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          'Could Not Open Email App', 
          'Please ensure you have an email client configured on your device to send your request.'
        );
      }
    } catch (error) {
      console.error("Failed to open mailto link:", error);
      Alert.alert('Error', 'An unexpected error occurred.');
    }
  };

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
            colors={[theme.colors.lightPink.lightest, theme.colors.lightPink.light]}
            style={styles.modalContent}
          >
            {/* Drag handle */}
            <View style={styles.dragHandle} />
            
            {/* Header */}
            <View style={styles.header}>
              <Pressable style={styles.doneButton} onPress={handleClose}>
                <Text style={styles.doneText}>Done</Text>
              </Pressable>
              <View style={styles.titleContainer}>
                <Text style={styles.headerTitle}>Contact & Support</Text>
              </View>
            </View>

            {/* Content */}
            <View style={styles.content}>
              <Text style={styles.title}>How can we help?</Text>
              <Text style={styles.subtitle}>
                Your feedback is important for improving Solace. Please choose an option below.
              </Text>
              
              <Pressable style={styles.button} onPress={() => handlePress('feature')}>
                <Ionicons name="bulb-outline" size={24} color="white" />
                <Text style={styles.buttonText}>Request a Feature</Text>
              </Pressable>

              <Pressable style={styles.button} onPress={() => handlePress('support')}>
                <Ionicons name="help-circle-outline" size={24} color="white" />
                <Text style={styles.buttonText}>Get Support</Text>
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
    zIndex: 2000, // Higher than settings modal
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
    top: 50,
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  modalContent: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.m,
    paddingTop: 20,
    paddingBottom: theme.spacing.m,
    position: 'relative',
  },
  doneButton: {
    position: 'absolute',
    top: -10,
    left: 0,
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  doneText: {
    fontSize: theme.typography.fontSizes.m,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text,
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: theme.typography.fontSizes.l,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.text,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 48,
    paddingHorizontal: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 12,
  },
}); 