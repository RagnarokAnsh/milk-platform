import React, { useRef, useEffect } from 'react';
import { View, Animated, Text } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, ANIMATIONS } from '../../styles/globalStyles';

const LoadingSpinner = ({ 
  size = 'medium', 
  color = COLORS.primary[500], 
  text,
  style 
}) => {
  const spinAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: ANIMATIONS.timing.normal,
      useNativeDriver: true,
    }).start();

    // Continuous spin animation
    const spinAnimation = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    );
    
    spinAnimation.start();

    return () => spinAnimation.stop();
  }, []);

  const getSize = () => {
    switch (size) {
      case 'small':
        return 20;
      case 'large':
        return 60;
      default:
        return 40;
    }
  };

  const spinValue = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const spinnerSize = getSize();

  return (
    <Animated.View
      style={[
        {
          alignItems: 'center',
          justifyContent: 'center',
          opacity: fadeAnim,
        },
        style,
      ]}
    >
      <Animated.View
        style={{
          width: spinnerSize,
          height: spinnerSize,
          borderRadius: spinnerSize / 2,
          borderWidth: 3,
          borderColor: `${color}20`,
          borderTopColor: color,
          transform: [{ rotate: spinValue }],
        }}
      />
      {text && (
        <Text
          style={{
            marginTop: SPACING.md,
            fontSize: TYPOGRAPHY.fontSize.sm,
            color: COLORS.text.secondary,
            fontWeight: TYPOGRAPHY.fontWeight.medium,
          }}
        >
          {text}
        </Text>
      )}
    </Animated.View>
  );
};

export default LoadingSpinner;