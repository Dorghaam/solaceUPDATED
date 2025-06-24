import { Dimensions, Platform } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Device type detection
export const isTablet = () => {
  const { width, height } = Dimensions.get('window');
  const aspectRatio = width / height;
  
  // iPad detection based on screen size and aspect ratio
  if (Platform.OS === 'ios') {
    // iPad aspect ratios are typically closer to 4:3 (1.33) vs iPhone 16:9+ (1.77+)
    return (width >= 768 || height >= 1024) && aspectRatio < 1.6;
  }
  
  // Android tablet detection
  return width >= 600;
};

export const isLandscape = () => {
  const { width, height } = Dimensions.get('window');
  return width > height;
};

// Responsive dimensions
export const getResponsiveDimensions = () => {
  const { width, height } = Dimensions.get('window');
  const tablet = isTablet();
  const landscape = isLandscape();
  
  return {
    width,
    height,
    isTablet: tablet,
    isLandscape: landscape,
    // Content width - constrain content on larger screens
    contentWidth: tablet ? Math.min(width * 0.7, 600) : width,
    // Padding adjustments
    horizontalPadding: tablet ? 40 : 24,
    // Font scale for larger screens
    fontScale: tablet ? 1.1 : 1,
  };
};

// Responsive font sizes
export const getResponsiveFontSize = (baseSize: number) => {
  const { fontScale } = getResponsiveDimensions();
  return Math.round(baseSize * fontScale);
};

// Responsive spacing
export const getResponsiveSpacing = (baseSpacing: number) => {
  const { isTablet } = getResponsiveDimensions();
  return isTablet ? Math.round(baseSpacing * 1.2) : baseSpacing;
};

// Widget preview dimensions for iPad
export const getWidgetPreviewSize = () => {
  const { width, isTablet } = getResponsiveDimensions();
  
  if (isTablet) {
    return {
      width: Math.min(width * 0.6, 400),
      height: 200,
    };
  }
  
  return {
    width: width * 0.85,
    height: 160,
  };
};

// Modal sizing for iPad
export const getModalDimensions = () => {
  const { width, height, isTablet } = getResponsiveDimensions();
  
  if (isTablet) {
    return {
      width: Math.min(width * 0.8, 600),
      height: Math.min(height * 0.9, 800),
      borderRadius: 24,
    };
  }
  
  return {
    width,
    height,
    borderRadius: 24,
  };
}; 