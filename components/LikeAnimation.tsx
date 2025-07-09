import React, { useRef, useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import LottieView from 'lottie-react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface LikeAnimationProps {
  visible: boolean;
  onAnimationComplete?: () => void;
}

export const LikeAnimation: React.FC<LikeAnimationProps> = ({ 
  visible, 
  onAnimationComplete 
}) => {
  const animationRef = useRef<LottieView>(null);

  useEffect(() => {
    if (visible) {
      // Reset and play the animation
      animationRef.current?.play();
    }
  }, [visible]);

  const handleAnimationFinish = () => {
    if (onAnimationComplete) {
      onAnimationComplete();
    }
  };

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.container}>
      <LottieView
        ref={animationRef}
        source={require('../assets/like-animation.json')}
        style={styles.animation}
        autoPlay={false}
        loop={false}
        speed={1}
        onAnimationFinish={handleAnimationFinish}
      />
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
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    pointerEvents: 'none', // Allow touches to pass through
  },
  animation: {
    width: screenWidth * 1.5, // 95% of screen width - even bigger!
    height: screenWidth * 1.5, // Keep it square
  },
}); 