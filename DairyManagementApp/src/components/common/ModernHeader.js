import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, Platform, StatusBar } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { ChevronLeft } from 'lucide-react-native';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, ANIMATIONS } from '../../styles/globalStyles';

const ModernHeader = ({
  title,
  subtitle,
  onBackPress,
  rightComponent,
  gradient = COLORS.gradients.primary,
  showBackButton = true,
  style,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: ANIMATIONS.timing.normal,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: ANIMATIONS.timing.normal,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={gradient[0]} />
      <Animated.View
        style={[
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
          style,
        ]}
      >
        <LinearGradient
          colors={gradient}
          style={{
            paddingTop: Platform.OS === 'ios' ? 50 : 20,
            paddingBottom: SPACING.xl,
            paddingHorizontal: SPACING.xl,
          }}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            {showBackButton ? (
              <TouchableOpacity
                onPress={onBackPress}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: BORDER_RADIUS.lg,
                  padding: SPACING.md,
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                }}
                activeOpacity={0.8}
              >
                <ChevronLeft color={COLORS.text.inverse} size={24} strokeWidth={2} />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 48 }} />
            )}

            <View style={{ flex: 1, alignItems: 'center', marginHorizontal: SPACING.lg }}>
              <Text
                style={{
                  fontSize: TYPOGRAPHY.fontSize.xl,
                  fontWeight: TYPOGRAPHY.fontWeight.bold,
                  color: COLORS.text.inverse,
                  textAlign: 'center',
                }}
              >
                {title}
              </Text>
              {subtitle && (
                <Text
                  style={{
                    fontSize: TYPOGRAPHY.fontSize.sm,
                    color: 'rgba(255, 255, 255, 0.9)',
                    marginTop: SPACING.xs,
                    textAlign: 'center',
                    fontWeight: TYPOGRAPHY.fontWeight.medium,
                  }}
                >
                  {subtitle}
                </Text>
              )}
            </View>

            <View style={{ width: 48, alignItems: 'flex-end' }}>
              {rightComponent}
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    </>
  );
};

export default ModernHeader;