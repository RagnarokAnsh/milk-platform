import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';

import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import FormScreen from '../screens/FormScreen';
import MapScreen from '../screens/MapScreen';
import ScoreScreen from '../screens/ScoreScreen';
import InfraScreen from '../screens/InfraScreen';

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="HomeScreen" component={HomeScreen} />
        <Stack.Screen name="FormScreen" component={FormScreen} />
        <Stack.Screen name="MapScreen" component={MapScreen} />
        <Stack.Screen name="ScoreScreen" component={ScoreScreen} />
        <Stack.Screen name="Infra" component={InfraScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
