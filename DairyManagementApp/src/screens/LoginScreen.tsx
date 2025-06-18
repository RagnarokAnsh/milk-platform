import React, { useState, useRef, useEffect } from 'react';
import Toast from 'react-native-toast-message';
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  StyleSheet,
  Animated,

  StatusBar,
  ScrollView,
  Dimensions,
  Easing,
  SafeAreaView,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import DatePicker from 'react-native-date-picker';
import { Dropdown } from 'react-native-element-dropdown';
import { loginUser, registerUser, getUsersList } from '../api';
import Geolocation from 'react-native-geolocation-service';
import { Eye, EyeOff, User, Phone, Lock, Calendar, Users, Milk } from 'lucide-react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, User as UserType } from '../types/navigation';

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

const { width, height } = Dimensions.get('window');

const LoginScreen: React.FC<{ navigation: LoginScreenNavigationProp }> = ({ navigation }) => {
  const [currentScreen, setCurrentScreen] = useState('login'); // 'login', 'signup'
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [date, setDate] = useState(new Date());
  const [open, setOpen] = useState(false);
  const [isGenderFocus, setIsGenderFocus] = useState(false);

  // Animation values - Initialize properly
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const logoRotateAnim = useRef(new Animated.Value(0)).current;
  const logoScaleAnim = useRef(new Animated.Value(1)).current;
  const cardScaleAnim = useRef(new Animated.Value(1)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;
  const shakeAnimation = useRef(new Animated.Value(0)).current;

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
    // Logo rotation animation
    const rotateAnimation = Animated.loop(
      Animated.timing(logoRotateAnim, {
        toValue: 1,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    rotateAnimation.start();

    return () => rotateAnimation.stop();
  }, []);

  const handleScreenTransition = (screen: string) => {
    // Simple transition without complex animations
    setCurrentScreen(screen);
    
    // Reset animation values to ensure proper display
    fadeAnim.setValue(1);
    slideAnim.setValue(0);
  };

  const handleButtonPress = () => {
    Animated.sequence([
      Animated.timing(buttonScaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleInputChange = (field: keyof typeof formData, value: string | number | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleGetLocation = (): Promise<{ latitude: number; longitude: number }> => {
    return new Promise(async (resolve, reject) => {
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
            return reject(new Error('Location permission is required to sign up.'));
          }
        } catch (err) {
          console.warn(err);
          return reject(err);
        }
      }

      Geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          reject(error);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
      );
    });
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
    } = formData;

    if (!firstName || !phone || !password || !gender || !dob || !state || !district || !block || !village) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Please fill all required fields.' });
      return;
    }
    if (password !== confirmPassword) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Passwords do not match.' });
      return;
    }

    try {
      const location = await handleGetLocation();

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
        latitude: location.latitude,
        longitude: location.longitude,
      };

      await registerUser(payload);
      Toast.show({ type: 'success', text1: 'Success', text2: 'Account created successfully! Please log in.' });
      handleScreenTransition('login');
    } catch (error: any) {
      console.error('Registration failed:', error);
      Toast.show({ type: 'error', text1: 'Registration Failed', text2: error.message || 'An error occurred during registration. Please try again.' });
    }
  };

  const handleLogin = async () => {
    if (!formData.phone || !formData.password) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Please fill in all fields' });
      return;
    }
    try {
      // Step 1: Authenticate the user. We don't need the response since it's just a success message.
      await loginUser({ contactNumber: `+91${formData.phone}`, password: formData.password });

      // Step 2: Fetch the full list of users to find the details of the logged-in user.
      const usersResponse = await getUsersList();
      const allUsers = usersResponse.data;

      // Step 3: Find the user by the contact number they used to log in.
            const loggedInUser = allUsers.find((user: UserType) => user.contactNumber === `+91${formData.phone}`);

      if (loggedInUser && loggedInUser.userId) {
        Toast.show({ type: 'success', text1: 'Success', text2: 'Logged in successfully!' });
        // Navigate to the next screen with the found userId.
        navigation.navigate('HomeScreen', { userId: loggedInUser.userId });
      } else {
        // This error means login was successful, but we couldn't find the user's details in the list.
        console.error('Login Error: Could not find user details after successful authentication.');
        Toast.show({ type: 'error', text1: 'Login Error', text2: 'Could not retrieve user details after login. Please try again.' });
      }
    } catch (error) {
      console.error(error);
      Toast.show({ type: 'error', text1: 'Login Failed', text2: 'Invalid credentials or network error. Please try again.' });
      // Optional: Add shake animation for failed login attempt
      Animated.sequence([
        Animated.timing(shakeAnimation, { toValue: 10, duration: 100, useNativeDriver: true }),
        Animated.timing(shakeAnimation, { toValue: -10, duration: 100, useNativeDriver: true }),
        Animated.timing(shakeAnimation, { toValue: 10, duration: 100, useNativeDriver: true }),
        Animated.timing(shakeAnimation, { toValue: 0, duration: 100, useNativeDriver: true })
      ]).start();
    }
  };

  const logoRotate = logoRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const AnimatedLogo = () => (
    <Animated.View
      style={[
        styles.logoContainer,
        {
          transform: [
            { scale: logoScaleAnim },
            { rotate: logoRotate },
          ],
        },
      ]}
    >
      <View style={styles.logoInner}>
        <Milk color="#fff" size={48} />
      </View>
      <View style={styles.logoRing} />
    </Animated.View>
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
      <Animated.View
        style={[
          styles.card,
          {
            transform: [{ scale: cardScaleAnim }],
          },
        ]}
      >
        <View style={styles.header}>
          <AnimatedLogo />
          <Text style={styles.title}>Welcome Back!</Text>
          <Text style={styles.subtitle}>Sign in to continue your journey</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <View style={styles.inputIconContainer}>
              <Phone color="#6366f1" size={20} />
            </View>
            <Text style={styles.countryCodeInput}>+91</Text>
            <TextInput
              placeholder="Phone Number"
              value={formData.phone}
              onChangeText={(text) => handleInputChange('phone', text)}
              style={[styles.input, styles.phoneInput]}
              keyboardType="phone-pad"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.inputIconContainer}>
              <Lock color="#6366f1" size={20} />
            </View>
            <TextInput
              secureTextEntry={!showPassword}
              placeholder="Password"
              value={formData.password}
              onChangeText={(text) => handleInputChange('password', text)}
              style={styles.input}
              placeholderTextColor="#9ca3af"
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              {showPassword ? <EyeOff color="#9ca3af" size={20} /> : <Eye color="#9ca3af" size={20} />}
            </TouchableOpacity>
          </View>

          <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
            <TouchableOpacity
              onPress={() => {
                handleButtonPress();
                handleLogin();
              }}
              style={styles.loginButton}
            >
              <Text style={styles.buttonText}>Sign In</Text>
            </TouchableOpacity>
          </Animated.View>

          <View style={styles.footer}>
            <TouchableOpacity onPress={() => handleScreenTransition('signup')}>
              <Text style={styles.footerText}>
                Don't have an account?{' '}
                <Text style={styles.linkText}>Sign Up</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </Animated.View>
  );

  const renderSignUpScreen = () => (
    <View style={styles.signupScreenContainer}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        style={styles.scrollView}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.header}>
            <AnimatedLogo />
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join our milk management family</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <View style={styles.inputIconContainer}>
                <User color="#10b981" size={20} />
              </View>
              <TextInput
                placeholder="First Name"
                value={formData.firstName}
                onChangeText={(text) => handleInputChange('firstName', text)}
                style={styles.input}
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputIconContainer}>
                <User color="#10b981" size={20} />
              </View>
              <TextInput
                placeholder="Surname"
                value={formData.surname}
                onChangeText={(text) => handleInputChange('surname', text)}
                style={styles.input}
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputIconContainer}>
                <Users color="#10b981" size={20} />
              </View>
              <View style={styles.dropdownWrapper}>
                <Dropdown
                  style={styles.dropdown}
                  placeholderStyle={styles.dropdownPlaceholder}
                  selectedTextStyle={styles.dropdownSelected}
                  inputSearchStyle={styles.inputSearchStyle}
                  iconStyle={styles.iconStyle}
                  data={genderData}
                  maxHeight={300}
                  labelField="label"
                  valueField="value"
                  placeholder={!isGenderFocus ? 'Select gender' : '...'}
                  value={formData.gender}
                  onFocus={() => setIsGenderFocus(true)}
                  onBlur={() => setIsGenderFocus(false)}
                  onChange={item => {
                    handleInputChange('gender', item.value);
                    setIsGenderFocus(false);
                  }}
                />
              </View>
            </View>

            <TouchableOpacity onPress={() => setOpen(true)}>
              <View style={styles.inputContainer}>
                <View style={styles.inputIconContainer}>
                  <Calendar color="#10b981" size={20} />
                </View>
                <View style={styles.dateInputWrapper}>
                  <Text style={[styles.dateInputText, {color: formData.dob ? '#111827' : '#9ca3af'}]}>
                    {formData.dob || 'Date of Birth'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            <View style={styles.inputContainer}>
              <View style={styles.inputIconContainer}>
                <Phone color="#10b981" size={20} />
              </View>
              <Text style={styles.countryCodeInput}>+91</Text>
              <TextInput
                placeholder="Phone Number"
                value={formData.phone}
                onChangeText={(text) => handleInputChange('phone', text)}
                style={[styles.input, styles.phoneInput]}
                keyboardType="phone-pad"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputIconContainer}>
                <Lock color="#10b981" size={20} />
              </View>
              <TextInput
                secureTextEntry={!showPassword}
                placeholder="Password"
                value={formData.password}
                onChangeText={(text) => handleInputChange('password', text)}
                style={styles.input}
                placeholderTextColor="#9ca3af"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                {showPassword ? <EyeOff color="#9ca3af" size={20} /> : <Eye color="#9ca3af" size={20} />}
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputIconContainer}>
                <Lock color="#10b981" size={20} />
              </View>
              <TextInput
                secureTextEntry={!showConfirmPassword}
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChangeText={(text) => handleInputChange('confirmPassword', text)}
                style={styles.input}
                placeholderTextColor="#9ca3af"
              />
              {/* <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeIcon}
              >
                {showConfirmPassword ? <EyeOff color="#9ca3af" size={20} /> : <Eye color="#9ca3af" size={20} />}
              </TouchableOpacity> */}
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputIconContainer}>
                <User color="#10b981" size={20} />
              </View>
              <TextInput
                placeholder="State"
                value={formData.state}
                onChangeText={(text) => handleInputChange('state', text)}
                style={styles.input}
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputIconContainer}>
                <User color="#10b981" size={20} />
              </View>
              <TextInput
                placeholder="District"
                value={formData.district}
                onChangeText={(text) => handleInputChange('district', text)}
                style={styles.input}
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputIconContainer}>
                <User color="#10b981" size={20} />
              </View>
              <TextInput
                placeholder="Block"
                value={formData.block}
                onChangeText={(text) => handleInputChange('block', text)}
                style={styles.input}
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputIconContainer}>
                <User color="#10b981" size={20} />
              </View>
              <TextInput
                placeholder="Village"
                value={formData.village}
                onChangeText={(text) => handleInputChange('village', text)}
                style={styles.input}
                placeholderTextColor="#9ca3af"
              />
            </View>



            <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
              <TouchableOpacity
                onPress={() => {
                  handleButtonPress();
                  handleSignUp();
                }}
                style={styles.signupButton}
              >
                <Text style={styles.buttonText}>Create Account</Text>
              </TouchableOpacity>
            </Animated.View>

            <View style={styles.footer}>
              <TouchableOpacity onPress={() => handleScreenTransition('login')}>
                <Text style={styles.footerText}>
                  Already have an account?{' '}
                  <Text style={styles.linkText}>Sign In</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

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
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#6366f1" />
      <View style={styles.headerContainer}>
        <Text style={styles.mainHeading}>Milk Management System</Text>
      </View>
      {currentScreen === 'login' && renderLoginScreen()}
      {currentScreen === 'signup' && renderSignUpScreen()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  headerContainer: {
    backgroundColor: '#6366f1',
    paddingVertical: 20,
    shadowColor: '#6366f1',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  mainHeading: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  screenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  signupScreenContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 20,
    },
    shadowOpacity: 0.1,
    shadowRadius: 25,
    elevation: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 100,
    height: 100,
    marginBottom: 24,
    position: 'relative',
  },
  logoInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 10,
    left: 10,
    shadowColor: '#6366f1',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  logoRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#e0e7ff',
    position: 'absolute',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    minHeight: 56,
  },
  inputIconContainer: {
    width: 50,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
    borderRightWidth: 2,
    borderRightColor: '#e5e7eb',
  },
  input: {
    flex: 1,
    height: 56,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: 'transparent',
  },
  phoneInput: {
    paddingLeft: 60,
  },
  countryCodeInput: {
    position: 'absolute',
    left: 60,
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '600',
    zIndex: 1,
  },
  dropdownWrapper: {
    flex: 1,
    height: 56,
    justifyContent: 'center',
  },
  dropdown: {
    flex: 1,
    height: 56,
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
  },
  dropdownPlaceholder: {
    color: '#9ca3af',
    fontSize: 16,
  },
  dropdownSelected: {
    color: '#1f2937',
    fontSize: 16,
  },
  dateInputWrapper: {
    flex: 1,
    height: 56,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  dateInputText: {
    fontSize: 16,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#6366f1',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  signupButton: {
    backgroundColor: '#10b981',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#10b981',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  locationContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  locationButton: {
    backgroundColor: '#f59e0b',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#f59e0b',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    marginBottom: 10,
  },
  locationText: {
    marginTop: 12,
    fontSize: 14,
    color: '#4b5563',
    fontWeight: '500',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
  },
  linkText: {
    color: '#6366f1',
    fontWeight: '600',
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
  },
});
export default LoginScreen;