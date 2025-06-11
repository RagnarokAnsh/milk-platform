import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
// import MapView, { Marker } from 'react-native-maps'; // We'll add this later

type DashboardScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Dashboard'>;

interface Props {
  navigation: DashboardScreenNavigationProp;
}

const DashboardScreen: React.FC<Props> = ({ navigation }) => {
  // Mock data for now - later this will come from API/registration
  const farmData = [
    { id: '1', name: 'Farm A', latitude: 37.78825, longitude: -122.4324, milkProduction: '100L' },
    { id: '2', name: 'Farm B', latitude: 37.75825, longitude: -122.4624, milkProduction: '150L' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      <Text>Welcome to the Dairy Management App!</Text>
      
      {/* Placeholder for MapView */}
      <View style={styles.mapPlaceholder}>
        <Text>Map will be here</Text>
      </View>

      <Text style={styles.dataTitle}>Farm Data:</Text>
      {farmData.map(farm => (
        <View key={farm.id} style={styles.farmItem}>
          <Text>{farm.name} - Milk: {farm.milkProduction}</Text>
        </View>
      ))}

      <Button title="Logout" onPress={() => navigation.replace('Login')} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
  },
  mapPlaceholder: {
    height: 200,
    borderWidth: 1,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },
  dataTitle: {
    fontSize: 18,
    marginTop: 20,
    marginBottom: 10,
  },
  farmItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
});

export default DashboardScreen;
