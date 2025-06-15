import React, { useRef, useEffect } from 'react';
import { View, Animated, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, ANIMATIONS } from '../../styles/globalStyles';

const AnimatedCard = ({
  children,
  onPress,
  gradient,
  style,
  delay = 0,
  animationType = 'fadeInUp',
  ...props
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const pressAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animations = [];

    if (animationType.includes('fade')) {
      animations.push(
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: ANIMATIONS.timing.slow,
          delay,
          useNativeDriver: true,
        })
      );
    }

    if (animationType.includes('Up')) {
      animations.push(
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: ANIMATIONS.timing.slow,
          delay,
          useNativeDriver: true,
        })
      );
    }

    if (animationType.includes('scale')) {
      animations.push(
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          delay,
          useNativeDriver: true,
        })
      );
    }

    Animated.parallel(animations).start();
  }, [delay, animationType]);

  const handlePressIn = () => {
    if (onPress) {
      Animated.timing(pressAnim, {
        toValue: 0.96,
        duration: ANIMATIONS.timing.fast,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (onPress) {
      Animated.timing(pressAnim, {
        toValue: 1,
        duration: ANIMATIONS.timing.fast,
        useNativeDriver: true,
      }).start();
    }
  };

  const cardContent = (
    <Animated.View
      style={[
        {
          backgroundColor: COLORS.surface,
          borderRadius: BORDER_RADIUS.xl,
          padding: SPACING.xl,
          ...SHADOWS.md,
        },
        style,
        {
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim },
            { scale: pressAnim },
          ],
        },
      ]}
      {...props}
    >
      {children}
    </Animated.View>
  );

  if (gradient) {
    return (
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        disabled={!onPress}
      >
        <Animated.View
          style={[
            {
              borderRadius: BORDER_RADIUS.xl,
              overflow: 'hidden',
              ...SHADOWS.md,
            },
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim },
                { scale: pressAnim },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={gradient}
            style={[
              {
                padding: SPACING.xl,
                borderRadius: BORDER_RADIUS.xl,
              },
              style,
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {children}
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>
    );
  }

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        {cardContent}
      </TouchableOpacity>
    );
  }

  return cardContent;
};

export default AnimatedCard;