import React, { useRef } from 'react';
import { TouchableOpacity, Text, Animated } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, ANIMATIONS } from '../../styles/globalStyles';

const AnimatedButton = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  icon: Icon,
  gradient,
  style,
  textStyle,
  ...props
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.96,
        duration: ANIMATIONS.timing.fast,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.8,
        duration: ANIMATIONS.timing.fast,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: ANIMATIONS.timing.fast,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: ANIMATIONS.timing.fast,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return {
          backgroundColor: COLORS.secondary[500],
          gradient: gradient || COLORS.gradients.secondary,
        };
      case 'success':
        return {
          backgroundColor: COLORS.success[500],
          gradient: gradient || COLORS.gradients.success,
        };
      case 'warning':
        return {
          backgroundColor: COLORS.warning[500],
          gradient: gradient || COLORS.gradients.warning,
        };
      case 'error':
        return {
          backgroundColor: COLORS.error[500],
          gradient: gradient || COLORS.gradients.error,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderColor: COLORS.primary[500],
        };
      default:
        return {
          backgroundColor: COLORS.primary[500],
          gradient: gradient || COLORS.gradients.primary,
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          paddingVertical: SPACING.sm,
          paddingHorizontal: SPACING.lg,
          fontSize: TYPOGRAPHY.fontSize.sm,
        };
      case 'large':
        return {
          paddingVertical: SPACING.xl,
          paddingHorizontal: SPACING['2xl'],
          fontSize: TYPOGRAPHY.fontSize.lg,
        };
      default:
        return {
          paddingVertical: SPACING.lg,
          paddingHorizontal: SPACING.xl,
          fontSize: TYPOGRAPHY.fontSize.base,
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  const buttonContent = (
    <Animated.View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: SPACING.sm,
          paddingVertical: sizeStyles.paddingVertical,
          paddingHorizontal: sizeStyles.paddingHorizontal,
        },
        disabled && { opacity: 0.5 },
      ]}
    >
      {Icon && (
        <Icon
          color={variant === 'outline' ? COLORS.primary[500] : COLORS.text.inverse}
          size={sizeStyles.fontSize}
          strokeWidth={2}
        />
      )}
      <Text
        style={[
          {
            fontSize: sizeStyles.fontSize,
            fontWeight: TYPOGRAPHY.fontWeight.semibold,
            color: variant === 'outline' ? COLORS.primary[500] : COLORS.text.inverse,
          },
          textStyle,
        ]}
      >
        {title}
      </Text>
    </Animated.View>
  );

  return (
    <Animated.View
      style={[
        {
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
        style,
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={1}
        style={[
          {
            borderRadius: BORDER_RADIUS.lg,
            overflow: 'hidden',
          },
          variant === 'outline' && {
            borderWidth: variantStyles.borderWidth,
            borderColor: variantStyles.borderColor,
          },
        ]}
        {...props}
      >
        {variantStyles.gradient && variant !== 'outline' ? (
          <LinearGradient
            colors={variantStyles.gradient}
            style={{ borderRadius: BORDER_RADIUS.lg }}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {buttonContent}
          </LinearGradient>
        ) : (
          <Animated.View
            style={[
              {
                backgroundColor: variantStyles.backgroundColor,
                borderRadius: BORDER_RADIUS.lg,
              },
            ]}
          >
            {buttonContent}
          </Animated.View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

export default AnimatedButton;