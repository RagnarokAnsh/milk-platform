import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  PermissionsAndroid,
  Platform,
  Linking,
} from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FormScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    // Cow ownership fields
    numberOfCows: '',
    breedsOfCows: '',
    numberOfMilkingCows: '',
    numberOfDryCows: '',
    numberOfCowCalvesAndHeifers: '',
    
    // Buffalo ownership fields
    numberOfBuffaloes: '',
    breedsOfBuffaloes: '',
    numberOfMilkingBuffaloes: '',
    numberOfDryBuffaloes: '',
    numberOfBuffaloCalvesAndHeifers: '',
  });
  
  const [location, setLocation] = useState(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Enhanced permission request with better error handling
  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        // First check if permission is already granted
        const checkPermission = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        
        if (checkPermission) {
          return true;
        }

        // Request permission
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Access Required',
            message: 'This app needs to access your location to save dairy locations on the map.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'Grant Permission',
          },
        );

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          return true;
        } else if (granted === PermissionsAndroid.RESULTS.DENIED) {
          Alert.alert(
            'Permission Denied',
            'Location permission was denied. Please grant permission to continue.',
            [{ text: 'OK' }]
          );
          return false;
        } else if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
          Alert.alert(
            'Permission Required',
            'Location permission is permanently denied. Please enable it in Settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Open Settings', 
                onPress: () => Linking.openSettings() 
              }
            ]
          );
          return false;
        }
      } catch (err) {
        console.warn('Permission request error:', err);
        return false;
      }
    }
    return true; // iOS handles permissions automatically
  };

  const getCurrentLocation = async () => {
    console.log('Starting location capture...');
    
    const hasPermission = await requestLocationPermission();
    
    if (!hasPermission) {
      console.log('Permission not granted');
      return null;
    }

    setIsGettingLocation(true);
    
    // Enhanced geolocation options
    const options = {
      enableHighAccuracy: true,
      timeout: 20000, // Increased timeout
      maximumAge: 5000,
      distanceFilter: 10,
    };

    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (position) => {
          console.log('Location received:', position);
          const locationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setLocation(locationData);
          setIsGettingLocation(false);
          resolve(locationData);
        },
        (error) => {
          console.log('Location error:', error.code, error.message);
          setIsGettingLocation(false);
          
          let errorMessage = 'Failed to get location. ';
          
          switch (error.code) {
            case 1:
              errorMessage += 'Permission denied. Please enable location services.';
              break;
            case 2:
              errorMessage += 'Position unavailable. Make sure GPS is enabled.';
              break;
            case 3:
              errorMessage += 'Request timeout. Please try again.';
              break;
            default:
              errorMessage += 'Unknown error occurred.';
          }
          
          Alert.alert(
            'Location Error', 
            errorMessage,
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Try Again', onPress: () => getCurrentLocation() },
              { text: 'Settings', onPress: () => Linking.openSettings() }
            ]
          );
          reject(error);
        },
        options
      );
    });
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    const required = [
      'numberOfCows', 
      'breedsOfCows', 
      'numberOfMilkingCows', 
      'numberOfDryCows', 
      'numberOfCowCalvesAndHeifers',
      'numberOfBuffaloes', 
      'breedsOfBuffaloes', 
      'numberOfMilkingBuffaloes', 
      'numberOfDryBuffaloes', 
      'numberOfBuffaloCalvesAndHeifers'
    ];
    const missing = required.filter(field => !formData[field].trim());
    
    if (missing.length > 0) {
      Alert.alert('Validation Error', 'Please fill in all required fields.');
      return false;
    }
    
    return true;
  };

  const saveData = async () => {
    if (!validateForm()) return;

    // Capture location when saving
    try {
      const locationData = await getCurrentLocation();
      
      if (!locationData) {
        Alert.alert('Location Required', 'Location is required to save livestock data.');
        return;
      }

      const dataToSave = {
        ...formData,
        location: locationData,
        registrationDate: new Date().toISOString(),
        id: Date.now().toString(),
      };

      const existingData = await AsyncStorage.getItem('dairyData');
      const dairyList = existingData ? JSON.parse(existingData) : [];
      
      dairyList.push(dataToSave);
      
      await AsyncStorage.setItem('dairyData', JSON.stringify(dairyList));
      
      Alert.alert(
        'Success', 
        'Livestock data saved successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('MapScreen'),
            style: 'cancel'
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to save data. Please try again.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.sectionTitle}>Cow Ownership</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Number of Cows *</Text>
          <TextInput
            style={styles.input}
            value={formData.numberOfCows}
            onChangeText={(value) => handleInputChange('numberOfCows', value)}
            placeholder="Enter total number of cows"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Breeds of Cows *</Text>
          <TextInput
            style={styles.input}
            value={formData.breedsOfCows}
            onChangeText={(value) => handleInputChange('breedsOfCows', value)}
            placeholder="Enter cow breeds (e.g., Holstein, Jersey)"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Number of Milking Cows *</Text>
          <TextInput
            style={styles.input}
            value={formData.numberOfMilkingCows}
            onChangeText={(value) => handleInputChange('numberOfMilkingCows', value)}
            placeholder="Enter number of milking cows"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Number of Dry Cows *</Text>
          <TextInput
            style={styles.input}
            value={formData.numberOfDryCows}
            onChangeText={(value) => handleInputChange('numberOfDryCows', value)}
            placeholder="Enter number of dry cows"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Number of Calves and Heifers (Cows) *</Text>
          <TextInput
            style={styles.input}
            value={formData.numberOfCowCalvesAndHeifers}
            onChangeText={(value) => handleInputChange('numberOfCowCalvesAndHeifers', value)}
            placeholder="Enter number of cow calves and heifers"
            keyboardType="numeric"
          />
        </View>

        <Text style={styles.sectionTitle}>Buffalo Ownership</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Number of Buffaloes *</Text>
          <TextInput
            style={styles.input}
            value={formData.numberOfBuffaloes}
            onChangeText={(value) => handleInputChange('numberOfBuffaloes', value)}
            placeholder="Enter total number of buffaloes"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Breeds of Buffaloes *</Text>
          <TextInput
            style={styles.input}
            value={formData.breedsOfBuffaloes}
            onChangeText={(value) => handleInputChange('breedsOfBuffaloes', value)}
            placeholder="Enter buffalo breeds (e.g., Murrah, Mehsana)"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Number of Milking Buffaloes *</Text>
          <TextInput
            style={styles.input}
            value={formData.numberOfMilkingBuffaloes}
            onChangeText={(value) => handleInputChange('numberOfMilkingBuffaloes', value)}
            placeholder="Enter number of milking buffaloes"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Number of Dry Buffaloes *</Text>
          <TextInput
            style={styles.input}
            value={formData.numberOfDryBuffaloes}
            onChangeText={(value) => handleInputChange('numberOfDryBuffaloes', value)}
            placeholder="Enter number of dry buffaloes"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Number of Calves and Heifers (Buffaloes) *</Text>
          <TextInput
            style={styles.input}
            value={formData.numberOfBuffaloCalvesAndHeifers}
            onChangeText={(value) => handleInputChange('numberOfBuffaloCalvesAndHeifers', value)}
            placeholder="Enter number of buffalo calves and heifers"
            keyboardType="numeric"
          />
        </View>

        <TouchableOpacity 
          style={[styles.submitButton, isGettingLocation && styles.submitButtonDisabled]} 
          onPress={saveData}
          disabled={isGettingLocation}
        >
          <Text style={styles.submitButtonText}>
            {isGettingLocation ? 'Getting Location...' : 'Save Livestock Data'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  form: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 15,
    marginTop: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#2E7D32',
    paddingBottom: 5,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  submitButton: {
    backgroundColor: '#2E7D32',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#A5A5A5',
    elevation: 1,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default FormScreen;