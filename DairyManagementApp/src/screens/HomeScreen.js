// src/screens/HomeScreen.js
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HomeScreen = ({ navigation }) => {
  const clearData = async () => {
    Alert.alert(
      'Clear All Data',
      'Are you sure you want to delete all dairy data? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear Data',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('dairyData');
              Alert.alert('Success', 'All dairy data has been cleared.');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data.');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2E7D32" />
      
      <View style={styles.header}>
        <Text style={styles.title}>Milk Management System</Text>
        {/* <Text style={styles.subtitle}>Prototype Version</Text> */}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('FormScreen')}
        >
          <Text style={styles.buttonText}>📝 Add Dairy Data</Text>
          <Text style={styles.buttonSubtext}>Record new dairy information</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('MapScreen')}
        >
          <Text style={styles.buttonText}>🗺️ View Map</Text>
          <Text style={styles.buttonSubtext}>See all dairy locations</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.clearButton]}
          onPress={clearData}
        >
          <Text style={[styles.buttonText, styles.clearButtonText]}>🗑️ Clear All Data</Text>
          <Text style={styles.buttonSubtext}>Delete all saved entries</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Digital Dairy Management System
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#2E7D32',
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#C8E6C9',
  },
  buttonContainer: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
    gap: 20,
  },
  button: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 4,
  },
  buttonSubtext: {
    fontSize: 14,
    color: '#666',
  },
  clearButton: {
    backgroundColor: '#FFF1F0',
    borderColor: '#D32F2F',
    borderWidth: 1,
  },
  clearButtonText: {
    color: '#D32F2F',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
  },
});

export default HomeScreen;