import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Dimensions,
  StatusBar,
  Animated,
} from 'react-native';
import { PanGestureHandler, GestureHandlerRootView, State } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { CategoriesModal } from './CategoriesModal';
import { theme } from '../constants/theme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Array of motivational quotes
const QUOTES = [
  "Keep going.\nYou're getting there.",
  "The sun will rise and\nwe will try again.",
  "Trust the timing\nof your life.",
  "Every day is a\nnew beginning.",
  "You are stronger\nthan you think.",
  "Progress, not\nperfection.",
  "Believe in yourself\nand all that you are.",
  "Your potential is\nendless.",
  "Great things take time.\nBe patient.",
  "You've got this.\nKeep pushing forward."
];

export const MainFeedScreen = () => {
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [likeCount, setLikeCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  
  const translateY = useRef(new Animated.Value(0)).current;
  const isAnimating = useRef(false);

  const handleGestureEvent = Animated.event(
    [{ nativeEvent: { translationY: translateY } }],
    { useNativeDriver: true }
  );

  const handleGestureStateChange = (event) => {
    if (event.nativeEvent.state === State.END) {
      const { translationY, velocityY } = event.nativeEvent;
      
      if (isAnimating.current) return;
      
      // Determine if swipe is significant enough
      const threshold = 100;
      const shouldChangeQuote = Math.abs(translationY) > threshold || Math.abs(velocityY) > 800;
      
      if (shouldChangeQuote) {
        if (translationY < 0) {
          // Swipe up - next quote
          nextQuote();
        } else {
          // Swipe down - previous quote
          previousQuote();
        }
      } else {
        // Return to original position
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    }
  };

  const nextQuote = () => {
    if (isAnimating.current) return;
    isAnimating.current = true;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Animate current quote up and out
    Animated.timing(translateY, {
      toValue: -screenHeight,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      // Update quote index
      setCurrentQuoteIndex((prevIndex) => (prevIndex + 1) % QUOTES.length);
      setIsLiked(false);
      
      // Reset position to bottom and animate in
      translateY.setValue(screenHeight);
      Animated.timing(translateY, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        isAnimating.current = false;
      });
    });
  };

  const previousQuote = () => {
    if (isAnimating.current) return;
    isAnimating.current = true;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Animate current quote down and out
    Animated.timing(translateY, {
      toValue: screenHeight,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      // Update quote index
      setCurrentQuoteIndex((prevIndex) => (prevIndex - 1 + QUOTES.length) % QUOTES.length);
      setIsLiked(false);
      
      // Reset position to top and animate in
      translateY.setValue(-screenHeight);
      Animated.timing(translateY, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        isAnimating.current = false;
      });
    });
  };

  const handleLike = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isLiked) {
      setLikeCount(Math.max(0, likeCount - 1));
    } else {
      setLikeCount(likeCount + 1);
    }
    setIsLiked(!isLiked);
  };

  const handleButtonPress = (buttonName) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (buttonName === 'Grid') {
      setShowCategories(true);
    } else {
      console.log(`${buttonName} pressed`);
    }
  };

  const handleCategorySelect = (category) => {
    console.log('Selected category:', category.title);
    setShowCategories(false);
    // Handle category selection logic here
  };

  const handleCloseCategories = () => {
    setShowCategories(false);
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <StatusBar hidden />
      
      <LinearGradient
        colors={[theme.colors.lightPink.lightest, theme.colors.lightPink.light, theme.colors.lightPink.medium, theme.colors.lightPink.dark]}
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        {/* Top Bar - Static */}
        <View style={styles.topBar}>
          <View style={styles.heartCounter}>
            <Ionicons name="heart-outline" size={20} color="#333" />
            <Text style={styles.counterText}>{likeCount}/10</Text>
          </View>
          
          <View style={styles.topRightButtons}>
            <Pressable 
              style={({ pressed }) => [
                styles.topButton,
                { opacity: pressed ? 0.7 : 1 }
              ]} 
              onPress={() => handleButtonPress('Crown')}
            >
              <Ionicons name="diamond-outline" size={20} color="#333" />
            </Pressable>
          </View>
        </View>

        {/* Swipeable Quote Section */}
        <View style={styles.quoteContainer}>
          <PanGestureHandler 
            onGestureEvent={handleGestureEvent}
            onHandlerStateChange={handleGestureStateChange}
          >
            <Animated.View 
              style={[
                styles.quoteSection,
                { transform: [{ translateY }] }
              ]}
            >
              <Text style={styles.quoteText}>{QUOTES[currentQuoteIndex]}</Text>
            </Animated.View>
          </PanGestureHandler>
          
          {/* Action Buttons - Fixed layer on top */}
          <View style={styles.actionButtons}>
            <Pressable 
              style={({ pressed }) => [
                styles.actionButton,
                { opacity: pressed ? 0.6 : 1, transform: [{ scale: pressed ? 0.95 : 1 }] }
              ]} 
              onPress={() => handleButtonPress('Share')}
            >
              <Ionicons name="share-outline" size={32} color="#333" />
            </Pressable>
            <Pressable 
              style={({ pressed }) => [
                styles.actionButton,
                { opacity: pressed ? 0.6 : 1, transform: [{ scale: pressed ? 0.95 : 1 }] }
              ]} 
              onPress={handleLike}
            >
              <Ionicons 
                name={isLiked ? "heart" : "heart-outline"} 
                size={32} 
                color={isLiked ? "#FF6B6B" : "#333"} 
              />
            </Pressable>
          </View>
        </View>

        {/* Bottom Navigation - Static - Hide when categories modal is open */}
        {!showCategories && (
          <View style={styles.bottomNav}>
            <Pressable 
              style={({ pressed }) => [
                styles.bottomButton,
                { opacity: pressed ? 0.7 : 1, transform: [{ scale: pressed ? 0.95 : 1 }] }
              ]} 
              onPress={() => handleButtonPress('Grid')}
            >
              <Ionicons name="grid-outline" size={24} color="#333" />
            </Pressable>
            <Pressable 
              style={({ pressed }) => [
                styles.bottomButton,
                { opacity: pressed ? 0.7 : 1, transform: [{ scale: pressed ? 0.95 : 1 }] }
              ]} 
              onPress={() => handleButtonPress('Brush')}
            >
              <Ionicons name="brush-outline" size={24} color="#333" />
            </Pressable>
            <Pressable 
              style={({ pressed }) => [
                styles.bottomButton,
                { opacity: pressed ? 0.7 : 1, transform: [{ scale: pressed ? 0.95 : 1 }] }
              ]} 
              onPress={() => handleButtonPress('Person')}
            >
              <Ionicons name="person-outline" size={24} color="#333" />
            </Pressable>
          </View>
        )}
      </LinearGradient>

      {/* Categories Modal */}
      <CategoriesModal
        visible={showCategories}
        onClose={handleCloseCategories}
        onCategorySelect={handleCategorySelect}
      />
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    width: screenWidth,
    height: screenHeight,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  heartCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  counterText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  topRightButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  topButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quoteContainer: {
    flex: 1,
    position: 'relative',
  },
  quoteSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  quoteText: {
    fontSize: 32,
    fontWeight: '400',
    color: '#333',
    textAlign: 'center',
    lineHeight: 42,
    marginBottom: 60,
  },
  actionButtons: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 60,
    zIndex: 10,
  },
  actionButton: {
    padding: 16,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 40,
  },
  bottomButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 