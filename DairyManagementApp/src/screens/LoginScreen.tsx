import React, { useState, useRef } from 'react';
import DatePicker from 'react-native-date-picker';
import { Dropdown } from 'react-native-element-dropdown';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  ScrollView,
} from 'react-native';
import { Eye, EyeOff, User, Phone, Lock, Calendar, Users } from 'lucide-react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

interface Props {
  navigation: LoginScreenNavigationProp;
}

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [currentScreen, setCurrentScreen] = useState('login'); // 'login', 'signup'
  const [showPassword, setShowPassword] = useState(false);

  const [date, setDate] = useState(new Date());
  const [open, setOpen] = useState(false);
  const [isGenderFocus, setIsGenderFocus] = useState(false);

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
  });



  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };



  const handleSignUp = () => {
    console.log('Sign up data:', formData);
    if (!formData.firstName || !formData.phone || !formData.password) {
      Alert.alert('Error', 'Please fill all required fields.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }
    Alert.alert('Success', 'Account created successfully! Please log in.');
    setCurrentScreen('login');
  };

  const handleLogin = () => {
    console.log('Login data:', { phone: formData.phone, password: formData.password });
    if (!formData.phone || !formData.password) {
      Alert.alert('Error', 'Please enter phone and password.');
      return;
    }
    Alert.alert('Success', 'Login successful!');
    navigation.replace('HomeScreen');
  };



  const renderLoginScreen = () => (
    <View style={styles.screenContainer}>
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={[styles.iconContainer, {backgroundColor: '#4f46e5'}]}>
            <User color="#fff" size={32} />
          </View>
          <Text style={styles.title}>Welcome!</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Phone style={styles.inputIcon} color="#9ca3af" size={20} />
            <TextInput
              placeholder="Phone Number"
              value={formData.phone}
              onChangeText={(text) => handleInputChange('phone', text)}
              style={styles.input}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputContainer}>
            <Lock style={styles.inputIcon} color="#9ca3af" size={20} />
            <TextInput
              secureTextEntry={!showPassword}
              placeholder="Password"
              value={formData.password}
              onChangeText={(text) => handleInputChange('password', text)}
              style={styles.input}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              {showPassword ? <EyeOff color="#9ca3af" size={20} /> : <Eye color="#9ca3af" size={20} />}
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={handleLogin} style={[styles.button, {backgroundColor: '#6d28d9'}]}>
            <Text style={styles.buttonText}>Sign In</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <TouchableOpacity onPress={() => setCurrentScreen('signup')}>
              <Text style={styles.footerText}>Don't have an account? <Text style={{color: '#4f46e5'}}>Sign Up</Text></Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

    const renderSignUpScreen = () => (
    <ScrollView contentContainerStyle={{flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20}} style={{backgroundColor: '#f0fdfa'}} keyboardShouldPersistTaps="handled">
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={[styles.iconContainer, {backgroundColor: '#22c55e'}]}>
            <User color="#fff" size={32} />
          </View>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Fill in your details to get started</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <User style={styles.inputIcon} color="#9ca3af" size={20} />
            <TextInput
              placeholder="First Name"
              value={formData.firstName}
              onChangeText={(text) => handleInputChange('firstName', text)}
              style={styles.input}
            />
          </View>

          <View style={styles.inputContainer}>
            <User style={styles.inputIcon} color="#9ca3af" size={20} />
            <TextInput
              placeholder="Surname"
              value={formData.surname}
              onChangeText={(text) => handleInputChange('surname', text)}
              style={styles.input}
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Users style={styles.inputIcon} color="#9ca3af" size={20} />
            <Dropdown
              style={[styles.input, { paddingVertical: 0, paddingLeft: 10, height: 52 }]}
              placeholderStyle={{ color: '#9ca3af', marginLeft: 30 }}
              selectedTextStyle={{ marginLeft: 30, color: '#111827' }}
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
          
          <TouchableOpacity onPress={() => setOpen(true)}>
            <View style={styles.inputContainer}>
              <Calendar style={styles.inputIcon} color="#9ca3af" size={20} />
              <Text style={[styles.input, {paddingTop: 15, color: formData.dob ? '#000' : '#9ca3af'}]}>
                {formData.dob || 'Date of Birth'}
              </Text>
            </View>
          </TouchableOpacity>
          
          <View style={styles.inputContainer}>
            <Phone style={styles.inputIcon} color="#9ca3af" size={20} />
            <Text style={styles.countryCode}>+91</Text>
            <TextInput
              placeholder="Phone Number"
              value={formData.phone}
              onChangeText={(text) => handleInputChange('phone', text)}
              style={[styles.input, {paddingLeft: 85}]}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputContainer}>
            <Lock style={styles.inputIcon} color="#9ca3af" size={20} />
            <TextInput
              secureTextEntry={!showPassword}
              placeholder="Password"
              value={formData.password}
              onChangeText={(text) => handleInputChange('password', text)}
              style={styles.input}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              {showPassword ? <EyeOff color="#9ca3af" size={20} /> : <Eye color="#9ca3af" size={20} />}
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Lock style={styles.inputIcon} color="#9ca3af" size={20} />
            <TextInput
              secureTextEntry={!showPassword}
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChangeText={(text) => handleInputChange('confirmPassword', text)}
              style={styles.input}
            />
          </View>

          <View style={styles.inputContainer}>
            <User style={styles.inputIcon} color="#9ca3af" size={20} />
            <TextInput
              placeholder="State"
              value={formData.state}
              onChangeText={(text) => handleInputChange('state', text)}
              style={styles.input}
            />
          </View>

          <View style={styles.inputContainer}>
            <User style={styles.inputIcon} color="#9ca3af" size={20} />
            <TextInput
              placeholder="District"
              value={formData.district}
              onChangeText={(text) => handleInputChange('district', text)}
              style={styles.input}
            />
          </View>

          <View style={styles.inputContainer}>
            <User style={styles.inputIcon} color="#9ca3af" size={20} />
            <TextInput
              placeholder="Block"
              value={formData.block}
              onChangeText={(text) => handleInputChange('block', text)}
              style={styles.input}
            />
          </View>

          <View style={styles.inputContainer}>
            <User style={styles.inputIcon} color="#9ca3af" size={20} />
            <TextInput
              placeholder="Village"
              value={formData.village}
              onChangeText={(text) => handleInputChange('village', text)}
              style={styles.input}
            />
          </View>

          <TouchableOpacity onPress={handleSignUp} style={[styles.button, {backgroundColor: '#16a34a'}]}>
            <Text style={styles.buttonText}>Create Account</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <TouchableOpacity onPress={() => setCurrentScreen('login')}>
              <Text style={styles.footerText}>Already have an account? <Text style={{color: '#16a34a'}}>Sign In</Text></Text>
            </TouchableOpacity>
          </View>
        </View>
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
    </ScrollView>
  );



  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Text style={styles.mainHeading}>Milk Management System</Text>
      {currentScreen === 'login' && renderLoginScreen()}
      {currentScreen === 'signup' && renderSignUpScreen()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  screenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#eef2ff',
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 15,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 4,
  },
  phoneText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  input: {
    flex: 1,
    height: 50,
    paddingLeft: 40,
    paddingRight: 40,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    fontSize: 16,
  },
  inputIcon: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
  },
    countryCode: {
    position: 'absolute',
    left: 40,
    fontSize: 16,
    color: '#111827',
    zIndex: 1,
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#6b7280',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  otpInput: {
    width: 45,
    height: 55,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
  },
  mainHeading: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    paddingVertical: 20,
    backgroundColor: '#f0fdfa',
  },
});

export default LoginScreen;