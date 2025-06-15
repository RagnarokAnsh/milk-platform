import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Alert,
  StatusBar,
  ScrollView,
  Dimensions,
  SafeAreaView,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import DatePicker from 'react-native-date-picker';
import { Dropdown } from 'react-native-element-dropdown';
import { loginUser, registerUser, getUsersList } from '../api';
import Geolocation from 'react-native-geolocation-service';
import { Eye, EyeOff, User, Phone, Lock, Calendar, Users, Milk, MapPin } from 'lucide-react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, User as UserType } from '../types/navigation';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS, ANIMATIONS } from '../styles/globalStyles';
import AnimatedButton from '../components/common/AnimatedButton';
import AnimatedCard from '../components/common/AnimatedCard';
import LoadingSpinner from '../components/common/LoadingSpinner';

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

const { width, height } = Dimensions.get('window');

const LoginScreen: React.FC<{ navigation: LoginScreenNavigationProp }> = ({ navigation }) => {
  const [currentScreen, setCurrentScreen] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [date, setDate] = useState(new Date());
  const [open, setOpen] = useState(false);
  const [isGenderFocus, setIsGenderFocus] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const logoAnim = useRef(new Animated.Value(0)).current;

  const genderData = [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
    { label: 'Other', value: 'other' },
  ];

  const [formData, setFormData] = useState({
    firstName: '',
    surname: '',
    gender: '',
    dob: '',
    phone: '',
    password: '',
    confirmPassword: '',
    state: '',
    district: '',
    block: '',
    village: '',
    latitude: null as number | null,
    longitude: null as number | null,
  });

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: ANIMATIONS.timing.slow,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: ANIMATIONS.timing.slow,
        useNativeDriver: true,
      }),
    ]).start();

    // Logo animation
    const logoAnimation = Animated.loop(
      Animated.timing(logoAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    );
    logoAnimation.start();

    return () => logoAnimation.stop();
  }, []);

  const handleScreenTransition = (screen: string) => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: ANIMATIONS.timing.fast,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: ANIMATIONS.timing.fast,
        useNativeDriver: true,
      }),
    ]).start();
    
    setCurrentScreen(screen);
  };

  const handleInputChange = (field: keyof typeof formData, value: string | number | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleGetLocation = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This app needs access to your location for registration.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permission Denied', 'Location permission is required to sign up.');
          return;
        }
      } catch (err) {
        console.warn(err);
        return;
      }
    }

    setLoading(true);
    Geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }));
        Alert.alert('Success', 'Location captured successfully!');
        setLoading(false);
      },
      (error) => {
        Alert.alert('Error', error.message);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
    );
  };

  const handleSignUp = async () => {
    const {
      firstName,
      surname,
      gender,
      dob,
      phone,
      password,
      confirmPassword,
      state,
      district,
      block,
      village,
      latitude,
      longitude,
    } = formData;

    if (!firstName || !phone || !password || !gender || !dob || !state || !district || !block || !village) {
      Alert.alert('Error', 'Please fill all required fields.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }
    if (!latitude || !longitude) {
      Alert.alert('Error', 'Please capture your location before signing up.');
      return;
    }

    const payload = {
      firstName,
      surname,
      contactNumber: `+91${phone}`,
      password,
      confirmPassword,
      gender: gender.charAt(0).toUpperCase() + gender.slice(1),
      dob,
      state,
      district,
      block,
      village,
      latitude,
      longitude,
    };

    setLoading(true);
    try {
      await registerUser(payload);
      Alert.alert('Success', 'Account created successfully! Please log in.');
      handleScreenTransition('login');
    } catch (error) {
      console.error('Registration failed:', error);
      Alert.alert('Registration Failed', 'An error occurred during registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!formData.phone || !formData.password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await loginUser({ contactNumber: `+91${formData.phone}`, password: formData.password });

      const usersResponse = await getUsersList();
      const allUsers = usersResponse.data;
      const loggedInUser = allUsers.find((user: UserType) => user.contactNumber === `+91${formData.phone}`);

      if (loggedInUser && loggedInUser.userId) {
        Alert.alert('Success', 'Welcome back!');
        navigation.navigate('HomeScreen', { userId: loggedInUser.userId });
      } else {
        console.error('Login Error: Could not find user details after successful authentication.');
        Alert.alert('Login Error', 'Could not retrieve user details after login. Please try again.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Login Failed', 'Invalid credentials or network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const logoRotate = logoAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const AnimatedLogo = () => (
    <Animated.View
      style={[
        styles.logoContainer,
        {
          transform: [{ rotate: logoRotate }],
        },
      ]}
    >
      <View style={styles.logoInner}>
        <Milk color={COLORS.text.inverse} size={32} strokeWidth={2} />
      </View>
    </Animated.View>
  );

  const InputField = ({ 
    icon: Icon, 
    placeholder, 
    value, 
    onChangeText, 
    secureTextEntry = false,
    keyboardType = 'default',
    rightIcon,
    onRightIconPress,
    style,
    ...props 
  }) => (
    <View style={[styles.inputContainer, style]}>
      <View style={styles.inputIconContainer}>
        <Icon color={COLORS.primary[500]} size={20} strokeWidth={2} />
      </View>
      <TextInput
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        style={styles.input}
        placeholderTextColor={COLORS.text.tertiary}
        {...props}
      />
      {rightIcon && (
        <TouchableOpacity onPress={onRightIconPress} style={styles.rightIcon}>
          {rightIcon}
        </TouchableOpacity>
      )}
    </View>
  );

  const renderLoginScreen = () => (
    <Animated.View
      style={[
        styles.screenContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <AnimatedCard style={styles.card} animationType="fadeInUp">
        <View style={styles.header}>
          <AnimatedLogo />
          <Text style={styles.title}>Welcome Back!</Text>
          <Text style={styles.subtitle}>Sign in to manage your dairy operations</Text>
        </View>

        <View style={styles.form}>
          <InputField
            icon={Phone}
            placeholder="Phone Number"
            value={formData.phone}
            onChangeText={(text) => handleInputChange('phone', text)}
            keyboardType="phone-pad"
          />

          <InputField
            icon={Lock}
            placeholder="Password"
            value={formData.password}
            onChangeText={(text) => handleInputChange('password', text)}
            secureTextEntry={!showPassword}
            rightIcon={
              showPassword ? 
                <EyeOff color={COLORS.text.tertiary} size={20} strokeWidth={2} /> : 
                <Eye color={COLORS.text.tertiary} size={20} strokeWidth={2} />
            }
            onRightIconPress={() => setShowPassword(!showPassword)}
          />

          <AnimatedButton
            title={loading ? "Signing In..." : "Sign In"}
            onPress={handleLogin}
            disabled={loading}
            style={styles.loginButton}
          />

          <TouchableOpacity onPress={() => handleScreenTransition('signup')}>
            <Text style={styles.footerText}>
              Don't have an account?{' '}
              <Text style={styles.linkText}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </AnimatedCard>
    </Animated.View>
  );

  const renderSignUpScreen = () => (
    <ScrollView
      contentContainerStyle={styles.scrollContainer}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Animated.View
        style={[
          styles.screenContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <AnimatedCard style={styles.card} animationType="fadeInUp">
          <View style={styles.header}>
            <AnimatedLogo />
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join our dairy management community</Text>
          </View>

          <View style={styles.form}>
            <InputField
              icon={User}
              placeholder="First Name"
              value={formData.firstName}
              onChangeText={(text) => handleInputChange('firstName', text)}
            />

            <InputField
              icon={User}
              placeholder="Surname"
              value={formData.surname}
              onChangeText={(text) => handleInputChange('surname', text)}
            />

            <View style={styles.inputContainer}>
              <View style={styles.inputIconContainer}>
                <Users color={COLORS.primary[500]} size={20} strokeWidth={2} />
              </View>
              <Dropdown
                style={styles.dropdown}
                placeholderStyle={styles.dropdownPlaceholder}
                selectedTextStyle={styles.dropdownSelected}
                data={genderData}
                maxHeight={300}
                labelField="label"
                valueField="value"
                placeholder="Select gender"
                value={formData.gender}
                onFocus={() => setIsGenderFocus(true)}
                onBlur={() => setIsGenderFocus(false)}
                onChange={item => {
                  handleInputChange('gender', item.value);
                  setIsGenderFocus(false);
                }}
              />
            </View>

            <TouchableOpacity onPress={() => setOpen(true)}>
              <View style={styles.inputContainer}>
                <View style={styles.inputIconContainer}>
                  <Calendar color={COLORS.primary[500]} size={20} strokeWidth={2} />
                </View>
                <View style={styles.dateInputWrapper}>
                  <Text style={[styles.dateInputText, {color: formData.dob ? COLORS.text.primary : COLORS.text.tertiary}]}>
                    {formData.dob || 'Date of Birth'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            <InputField
              icon={Phone}
              placeholder="Phone Number"
              value={formData.phone}
              onChangeText={(text) => handleInputChange('phone', text)}
              keyboardType="phone-pad"
            />

            <InputField
              icon={Lock}
              placeholder="Password"
              value={formData.password}
              onChangeText={(text) => handleInputChange('password', text)}
              secureTextEntry={!showPassword}
              rightIcon={
                showPassword ? 
                  <EyeOff color={COLORS.text.tertiary} size={20} strokeWidth={2} /> : 
                  <Eye color={COLORS.text.tertiary} size={20} strokeWidth={2} />
              }
              onRightIconPress={() => setShowPassword(!showPassword)}
            />

            <InputField
              icon={Lock}
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChangeText={(text) => handleInputChange('confirmPassword', text)}
              secureTextEntry={!showConfirmPassword}
              rightIcon={
                showConfirmPassword ? 
                  <EyeOff color={COLORS.text.tertiary} size={20} strokeWidth={2} /> : 
                  <Eye color={COLORS.text.tertiary} size={20} strokeWidth={2} />
              }
              onRightIconPress={() => setShowConfirmPassword(!showConfirmPassword)}
            />

            <InputField
              icon={MapPin}
              placeholder="State"
              value={formData.state}
              onChangeText={(text) => handleInputChange('state', text)}
            />

            <InputField
              icon={MapPin}
              placeholder="District"
              value={formData.district}
              onChangeText={(text) => handleInputChange('district', text)}
            />

            <InputField
              icon={MapPin}
              placeholder="Block"
              value={formData.block}
              onChangeText={(text) => handleInputChange('block', text)}
            />

            <InputField
              icon={MapPin}
              placeholder="Village"
              value={formData.village}
              onChangeText={(text) => handleInputChange('village', text)}
            />

            <View style={styles.locationContainer}>
              <AnimatedButton
                title={loading ? "Getting Location..." : "Capture Location"}
                onPress={handleGetLocation}
                variant="warning"
                icon={MapPin}
                disabled={loading}
                style={styles.locationButton}
              />
              {formData.latitude && formData.longitude && (
                <Text style={styles.locationText}>
                  ✅ Location captured successfully
                </Text>
              )}
            </View>

            <AnimatedButton
              title={loading ? "Creating Account..." : "Create Account"}
              onPress={handleSignUp}
              variant="success"
              disabled={loading}
              style={styles.signupButton}
            />

            <TouchableOpacity onPress={() => handleScreenTransition('login')}>
              <Text style={styles.footerText}>
                Already have an account?{' '}
                <Text style={styles.linkText}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </AnimatedCard>
      </Animated.View>

      <DatePicker
        modal
        open={open}
        date={date}
        mode="date"
        onConfirm={(selectedDate) => {
          setOpen(false);
          setDate(selectedDate);
          handleInputChange('dob', selectedDate.toISOString().split('T')[0]);
        }}
        onCancel={() => {
          setOpen(false);
        }}
      />
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary[600]} />
      
      <View style={styles.headerContainer}>
        <Text style={styles.mainHeading}>Smart Dairy Management</Text>
        <Text style={styles.mainSubheading}>Empowering dairy farmers with technology</Text>
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <LoadingSpinner size="large" text="Please wait..." />
        </View>
      )}

      {currentScreen === 'login' && renderLoginScreen()}
      {currentScreen === 'signup' && renderSignUpScreen()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerContainer: {
    backgroundColor: COLORS.primary[600],
    paddingVertical: SPACING['2xl'],
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
    ...SHADOWS.lg,
  },
  mainHeading: {
    fontSize: TYPOGRAPHY.fontSize['3xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.inverse,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  mainSubheading: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  screenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
    paddingBottom: SPACING['4xl'],
  },
  card: {
    width: '100%',
    maxWidth: 400,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING['3xl'],
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    ...SHADOWS.lg,
  },
  logoInner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.lineHeight.relaxed * TYPOGRAPHY.fontSize.base,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.neutral[200],
    minHeight: 56,
    ...SHADOWS.sm,
  },
  inputIconContainer: {
    width: 50,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.neutral[50],
    borderTopLeftRadius: BORDER_RADIUS.lg,
    borderBottomLeftRadius: BORDER_RADIUS.lg,
    borderRightWidth: 1,
    borderRightColor: COLORS.neutral[200],
  },
  input: {
    flex: 1,
    height: 56,
    paddingHorizontal: SPACING.lg,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text.primary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  rightIcon: {
    position: 'absolute',
    right: SPACING.lg,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdown: {
    flex: 1,
    height: 56,
    paddingHorizontal: SPACING.lg,
  },
  dropdownPlaceholder: {
    color: COLORS.text.tertiary,
    fontSize: TYPOGRAPHY.fontSize.base,
  },
  dropdownSelected: {
    color: COLORS.text.primary,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  dateInputWrapper: {
    flex: 1,
    height: 56,
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  dateInputText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  locationContainer: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  locationButton: {
    width: '100%',
    marginBottom: SPACING.md,
  },
  locationText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.success[600],
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    textAlign: 'center',
  },
  loginButton: {
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
  },
  signupButton: {
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
  },
  footerText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text.secondary,
    textAlign: 'center',
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  linkText: {
    color: COLORS.primary[600],
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
});

export default LoginScreen;