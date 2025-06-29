import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Dimensions,
  Animated,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { theme } from '../constants/theme';
import { useUserStore } from '../store/userStore';
import { saveAffirmationToDatabase, updateAffirmationInDatabase, getAffirmationById } from '../services/affirmationsService';
import * as Haptics from 'expo-haptics';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface AddAffirmationScreenProps {
  visible: boolean;
  onClose: () => void;
  editingId?: string;
  onSave?: () => void; // Callback to refresh the list
}

export const AddAffirmationScreen: React.FC<AddAffirmationScreenProps> = ({
  visible,
  onClose,
  editingId,
  onSave,
}) => {
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const backgroundOpacity = useRef(new Animated.Value(0)).current;
  const panY = useRef(new Animated.Value(0)).current;

  const [affirmationText, setAffirmationText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  
  const { supabaseUser } = useUserStore();

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

      // Load affirmation for editing if editingId is provided
      if (editingId && supabaseUser?.id) {
        setIsEditing(true);
        loadAffirmationForEditing();
      } else {
        setIsEditing(false);
        setAffirmationText('');
      }
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
  }, [visible, editingId, supabaseUser?.id]);

  const loadAffirmationForEditing = async () => {
    try {
      if (!supabaseUser?.id || !editingId) return;
      
      const affirmation = await getAffirmationById(supabaseUser.id, editingId);
      if (affirmation) {
        setAffirmationText(affirmation.text);
      }
    } catch (error) {
      console.error('Error loading affirmation for editing:', error);
    }
  };

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

  const handleSaveAffirmation = async () => {
    if (!affirmationText.trim()) return;
    if (!supabaseUser?.id) {
      console.error('User not authenticated');
      return;
    }

    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      if (isEditing && editingId) {
        await updateAffirmationInDatabase(
          supabaseUser.id,
          editingId,
          affirmationText.trim()
        );
      } else {
        await saveAffirmationToDatabase(
          supabaseUser.id,
          affirmationText.trim()
        );
      }
      
      // Call the onSave callback to refresh the list
      if (onSave) {
        onSave();
      }
      
      // Close the modal
      handleClose();
    } catch (error) {
      console.error('Error saving affirmation:', error);
      // Could add error toast/alert here
    } finally {
      setIsLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <Animated.View
        style={[
          styles.background,
          { opacity: backgroundOpacity }
        ]}
      >
        <Pressable 
          style={styles.backgroundTouchable} 
          onPress={handleClose}
        />
      </Animated.View>
      
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
              <Pressable style={styles.cancelButton} onPress={handleClose}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <View style={styles.titleContainer}>
                <Text style={styles.headerTitle}>
                  {isEditing ? 'Edit Affirmation' : 'Add Quotes'}
                </Text>
              </View>
              <Pressable 
                style={[
                  styles.saveButton,
                  { opacity: !affirmationText.trim() || isLoading ? 0.5 : 1 }
                ]} 
                onPress={handleSaveAffirmation}
                disabled={!affirmationText.trim() || isLoading}
              >
                <Text style={styles.saveText}>
                  {isLoading ? 'Saving...' : 'Save'}
                </Text>
              </Pressable>
            </View>

            {/* Content */}
            <KeyboardAvoidingView 
              style={styles.keyboardAvoidingView}
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
              <ScrollView 
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
              >
                {/* Subtitle */}
                <Text style={styles.subtitle}>
                  {isEditing 
                    ? 'Update your personal affirmation below.'
                    : 'Add your own quote. It will only be visible to you.'
                  }
                </Text>

                {/* Text Input */}
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.textInput}
                    value={affirmationText}
                    onChangeText={setAffirmationText}
                    placeholder="Success doesn't come from what you do occasionally, it comes from what you do consistently..."
                    placeholderTextColor={theme.colors.textSecondary}
                    multiline
                    textAlignVertical="top"
                    maxLength={500}
                    returnKeyType="done"
                    blurOnSubmit={true}
                    autoFocus={false}
                  />
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
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
    zIndex: 3000, // Higher than MyAffirmationsScreen
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
  cancelButton: {
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
  cancelText: {
    fontSize: theme.typography.fontSizes.m,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: 20,
    color: theme.colors.text,
  },
  saveButton: {
    position: 'absolute',
    top: -10,
    right: 0,
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  saveText: {
    fontSize: theme.typography.fontSizes.m,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.primary,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.l,
    flexGrow: 1,
  },
  subtitle: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: theme.spacing.xl,
  },
  inputContainer: {
    flex: 1,
  },
  textInput: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.l,
    paddingHorizontal: theme.spacing.l,
    paddingVertical: theme.spacing.l,
    fontSize: theme.typography.fontSizes.m,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text,
    minHeight: 200,
    shadowColor: theme.colors.black,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
}); 