import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Dimensions, Text, StatusBar } from 'react-native';
import { Milk } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';

type SplashScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Splash'>;

const { width, height } = Dimensions.get('window');
const CIRCLE_RADIUS = width * 0.35;

// React Bits Style Iridescence Background Component (Non-rotating)
const IridescenceBackground = () => {
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animValue, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.timing(animValue, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  // Create animated color values for the gradient
  const color1 = animValue.interpolate({
    inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1],
    outputRange: [
      'hsl(318, 58%, 67%)', // Pink
      'hsl(270, 70%, 60%)', // Purple
      'hsl(240, 80%, 65%)', // Blue
      'hsl(200, 85%, 55%)', // Cyan
      'hsl(160, 75%, 50%)', // Teal
      'hsl(318, 58%, 67%)', // Back to Pink
    ],
  });

  const color2 = animValue.interpolate({
    inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1],
    outputRange: [
      'hsl(184, 84%, 50%)', // Cyan
      'hsl(122, 86%, 59%)', // Green
      'hsl(66, 89%, 58%)',  // Yellow
      'hsl(26, 90%, 52%)',  // Orange
      'hsl(21, 84%, 56%)',  // Red-Orange
      'hsl(184, 84%, 50%)', // Back to Cyan
    ],
  });

  const color3 = animValue.interpolate({
    inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1],
    outputRange: [
      'hsl(122, 86%, 59%)', // Green
      'hsl(66, 89%, 58%)',  // Yellow
      'hsl(26, 90%, 52%)',  // Orange
      'hsl(318, 58%, 67%)', // Pink
      'hsl(270, 70%, 65%)', // Purple
      'hsl(122, 86%, 59%)', // Back to Green
    ],
  });

  return (
    <View style={styles.iridescenceContainer}>
      <AnimatedLinearGradient
        colors={[color1, color2, color3]}
        style={styles.iridescenceBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={styles.noiseOverlay} />
    </View>
  );
};

// Enhanced Circular Text Component
const CircularText = ({ text, radius }: { text: string; radius: number }) => {
  const characters = text.split('');
  const totalChars = characters.length;
  
  return (
    <View style={{ width: radius * 2, height: radius * 2 }}>
      {characters.map((char, i) => {
        const angle = (i * 2 * Math.PI) / totalChars;
        const x = radius + radius * Math.sin(angle) - 8;
        const y = radius - radius * Math.cos(angle) - 12;
        const rotateAngle = (i * 360) / totalChars + 90;
        
        return (
          <Text
            key={i}
            style={[
              styles.char,
              {
                left: x,
                top: y,
                transform: [{ rotate: `${rotateAngle}deg` }],
              },
            ]}
          >
            {char}
          </Text>
        );
      })}
    </View>
  );
};

const SplashScreen: React.FC<{ navigation: SplashScreenNavigationProp }> = ({ navigation }) => {
  const logoRotateAnim = useRef(new Animated.Value(0)).current;
  const textRotateAnim = useRef(new Animated.Value(0)).current;
  const logoScaleAnim = useRef(new Animated.Value(0.8)).current;
  const logoOpacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Logo entrance animation
    const logoEntranceAnimation = Animated.parallel([
      Animated.timing(logoScaleAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.elastic(1),
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacityAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]);

    // Logo rotation animation
    const logoRotationAnimation = Animated.loop(
      Animated.timing(logoRotateAnim, {
        toValue: 1,
        duration: 12000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    // Text rotation animation (counter-clockwise)
    const textRotationAnimation = Animated.loop(
      Animated.timing(textRotateAnim, {
        toValue: 1,
        duration: 15000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    // Start animations
    logoEntranceAnimation.start();
    logoRotationAnimation.start();
    textRotationAnimation.start();

    // Navigate to login after 5 seconds
    const timer = setTimeout(() => {
      navigation.replace('Login');
    }, 5000);

    return () => {
      logoRotationAnimation.stop();
      textRotationAnimation.stop();
      clearTimeout(timer);
    };
  }, [navigation, logoRotateAnim, textRotateAnim, logoScaleAnim, logoOpacityAnim]);

  const logoRotate = logoRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const textRotate = textRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-360deg'], // Counter-clockwise
  });

  const AnimatedLogo = () => (
    <Animated.View 
      style={[
        styles.logoContainer,
        {
          transform: [
            { scale: logoScaleAnim },
            { rotate: logoRotate }
          ],
          opacity: logoOpacityAnim,
        }
      ]}
    >
      <View style={styles.logoInner}>
        <View style={styles.logoGlow}>
          <Milk color="#fff" size={52} strokeWidth={1.5} />
        </View>
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <IridescenceBackground />
      
      <View style={styles.contentContainer}>
        <View style={styles.animationContainer}>
          {/* Circular Text */}
          <Animated.View 
            style={{
              transform: [{ rotate: textRotate }],
              position: 'absolute',
            }}
          >
            <CircularText 
              text="MILK★MANAGEMENT★MILK★MANAGEMENT★" 
              radius={CIRCLE_RADIUS} 
            />
          </Animated.View>
          
          {/* Logo */}
          <View style={styles.logoWrapper}>
            <AnimatedLogo />
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  iridescenceContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  iridescenceBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gradientBackground: {
    flex: 1,
  },
  noiseOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    opacity: 0.6,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  animationContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: CIRCLE_RADIUS * 2,
    height: CIRCLE_RADIUS * 2,
  },
  char: {
    position: 'absolute',
    color: 'rgba(255, 255, 255, 0.95)',
    fontSize: 16,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    letterSpacing: 1,
  },
  logoWrapper: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    width: 130,
    height: 130,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoInner: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  logoGlow: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
});

export default SplashScreen;