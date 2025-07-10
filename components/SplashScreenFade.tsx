import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Image, Animated, Dimensions } from 'react-native';

interface SplashScreenFadeProps {
  onFadeComplete: () => void;
}

const { width, height } = Dimensions.get('window');

export const SplashScreenFade: React.FC<SplashScreenFadeProps> = ({ onFadeComplete }) => {
  const opacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Wait 1.8 seconds then fade out
    const timer = setTimeout(() => {
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 600, // 600ms smooth fade
        useNativeDriver: true,
      }).start(() => {
        onFadeComplete();
      });
    }, 1800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: opacityAnim }]}>
      <Image
        source={require('../Copy of Solace(4).png')}
        style={styles.logo}
        resizeMode="contain"
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#ffffff', // Same as native splash
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  logo: {
    width: 200,
    height: 200,
  },
}); 