import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';

import LoginScreen from '../screens/LoginScreen';
// import RegistrationScreen from '../screens/RegistrationScreen'; // Commented out
// import DashboardScreen from '../screens/DashboardScreen'; // Commented out
import HomeScreen from '../screens/HomeScreen';
import FormScreen from '../screens/FormScreen';
import MapScreen from '../screens/MapScreen';

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="HomeScreen" component={HomeScreen} />
        {/* <Stack.Screen name="Register" component={RegistrationScreen} /> */}
        {/* <Stack.Screen name="Dashboard" component={DashboardScreen} /> */}
        <Stack.Screen name="FormScreen" component={FormScreen} />
        <Stack.Screen name="MapScreen" component={MapScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
