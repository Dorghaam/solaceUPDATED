import React, { useState, useEffect } from 'react';
import { StyleSheet, SafeAreaView, View, Text, Pressable, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { useUserStore } from '../../store/userStore';
import { saveAffirmationToDatabase, updateAffirmationInDatabase, getAffirmationById } from '../../services/affirmationsService';
import * as Haptics from 'expo-haptics';

export default function AddAffirmationPage() {
  const [affirmationText, setAffirmationText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  
  const { supabaseUser } = useUserStore();
  const params = useLocalSearchParams();
  const editingId = params.id as string;

  // Load existing affirmation if editing
  useEffect(() => {
    if (editingId && supabaseUser?.id) {
      setIsEditing(true);
      loadAffirmationForEditing();
    }
  }, [editingId, supabaseUser?.id]);

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
      
      // Navigate back to my affirmations list
      router.back();
    } catch (error) {
      console.error('Error saving affirmation:', error);
      // Could add error toast/alert here
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={[theme.colors.lightPink.lightest, theme.colors.lightPink.light, theme.colors.lightPink.medium]}
      style={styles.backgroundGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView 
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.container}>
            {/* Back Button */}
            <View style={styles.headerRow}>
              <Pressable
                style={({ pressed }) => [
                  styles.backButton,
                  { opacity: pressed ? 0.7 : 1 }
                ]}
                onPress={() => router.back()}
              >
                <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
              </Pressable>
            </View>

            {/* Header Text */}
            <View style={styles.headerSection}>
              <Text style={styles.title}>
                {isEditing ? 'Edit Your Affirmation' : 'Add Quotes'}
              </Text>
              <Text style={styles.subtitle}>
                {isEditing 
                  ? 'Update your personal affirmation below.'
                  : 'Add your own quote. It will only be visible to you.'
                }
              </Text>
            </View>

            {/* Affirmation Text Input */}
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
              />
            </View>



            {/* Spacer */}
            <View style={styles.spacer} />

            {/* Save Button */}
            <View style={styles.bottomSection}>
              <Pressable
                style={({ pressed }) => [
                  styles.saveButton,
                  { 
                    opacity: pressed ? 0.9 : (!affirmationText.trim() || isLoading ? 0.6 : 1),
                    transform: [{ scale: pressed ? 0.98 : 1 }]
                  }
                ]}
                onPress={handleSaveAffirmation}
                disabled={!affirmationText.trim() || isLoading}
              >
                <Text style={styles.saveButtonText}>
                  {isLoading ? 'Saving...' : 'Save'}
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  backgroundGradient: { 
    flex: 1 
  },
  safeArea: { 
    flex: 1 
  },
  keyboardAvoidingView: {
    flex: 1
  },
  container: {
    flex: 1,
    paddingHorizontal: theme.spacing.l,
  },
  headerRow: {
    paddingTop: theme.spacing.m,
    paddingBottom: theme.spacing.s,
  },
  backButton: {
    padding: theme.spacing.s,
    alignSelf: 'flex-start',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    paddingTop: theme.spacing.m,
  },
  title: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 32,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.m,
    lineHeight: 38,
  },
  subtitle: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: theme.spacing.m,
  },
  textInput: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.l,
    paddingHorizontal: theme.spacing.l,
    paddingVertical: theme.spacing.l,
    fontSize: theme.typography.fontSizes.m,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text,
    minHeight: 120,
    shadowColor: theme.colors.black,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },

  spacer: {
    flex: 1,
  },
  bottomSection: {
    paddingBottom: theme.spacing.xl,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.m,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.radii.l,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  saveButtonText: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: theme.typography.fontSizes.m,
    color: theme.colors.white,
  },
}); 