import React, { useEffect, useRef, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LogOut, Plus, Map, Trash2, Milk, BarChart3 } from 'lucide-react-native';
import { getUsersList, getCowsList, getBuffaloesList } from '../api';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';

const { width, height } = Dimensions.get('window');

const formatNumber = (num) => {
  if (num >= 10000000) return (num / 10000000).toFixed(1) + ' Cr';
  if (num >= 100000) return (num / 100000).toFixed(1) + ' L';
  if (num >= 1000) return (num / 1000).toFixed(1) + ' K';
  return num;
};

const HomeScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const navState = useNavigationState(state => state);
  console.log('Current Navigation State:', JSON.stringify(navState, null, 2));

  const { userId } = route.params;

  const [stats, setStats] = useState({ totalRecords: 0, locations: 0 });
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  
  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [usersResponse, cowsResponse, buffaloesResponse] = await Promise.all([
          getUsersList(),
          getCowsList(),
          getBuffaloesList(),
        ]);

        const currentUser = usersResponse.data.find(user => user.userId === userId);
        if (currentUser) {
          setUserName(currentUser.firstName);
        }

        const locationCount = usersResponse.data.filter(u => u.latitude && u.longitude).length;
        
        const milkingCows = cowsResponse.data.reduce((sum, record) => sum + (record.milking || 0), 0);
        const milkingBuffaloes = buffaloesResponse.data.reduce((sum, record) => sum + (record.milking || 0), 0);
        const totalMilkingAnimals = milkingCows + milkingBuffaloes;

        setStats({ totalRecords: totalMilkingAnimals, locations: locationCount });
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
        Toast.show({ type: 'error', text1: 'Error', text2: 'Could not load dashboard data.' });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [userId]);

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          onPress: () => navigation.navigate('Login'),
          style: 'destructive',
        },
      ],
      { cancelable: true }
    );
  };

  const clearData = async () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all your dairy records. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Data',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('dairyData');
              Toast.show({ type: 'success', text1: 'Success', text2: 'All dairy data has been cleared.' });
            } catch (error) {
              Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to clear data.' });
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const ActionCard = ({ icon: Icon, title, subtitle, onPress, gradient, delay = 0 }) => {
    const cardAnim = useRef(new Animated.Value(0)).current;
    const pressAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
      Animated.timing(cardAnim, {
        toValue: 1,
        duration: 0,
        // delay,
        useNativeDriver: true,
      }).start();
    }, []);

    const handlePress = () => {
      Animated.sequence([
        Animated.timing(pressAnim, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(pressAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (onPress) {
          onPress();
        }
      });
    };

    return (
      <Animated.View
        style={[
          styles.cardContainer,
          {
            opacity: cardAnim,
            transform: [
              {
                translateY: cardAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [30, 0],
                }),
              },
              { scale: pressAnim },
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.card}
          onPress={handlePress}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={gradient}
            style={styles.cardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.cardContent}>
              <View style={styles.iconContainer}>
                <Icon color="#fff" size={28} strokeWidth={2} />
              </View>
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>{title}</Text>
                <Text style={styles.cardSubtitle}>{subtitle}</Text>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      
      {/* Header */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <LinearGradient
          colors={['#0F172A', '#1E293B', '#334155']}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <View style={styles.logoContainer}>
                <Milk color="#10B981" size={32} strokeWidth={2.5} />
              </View>
              <View>
                <Text style={styles.welcomeText}>Welcome back</Text>
                <Text style={styles.title}>{userName || 'Dairy Manager'}</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={handleLogout}
              style={styles.logoutButton}
              activeOpacity={0.8}
            >
              <LogOut color="#fff" size={24} strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Stats Cards */}
      <Animated.View
        style={[
          styles.statsContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.statsCard}>
          <LinearGradient
            colors={['#10B981', '#059669']}
            style={styles.statsGradient}
          >
            <BarChart3 color="#fff" size={24} strokeWidth={2} />
            <Text style={styles.statsNumber}>{loading ? '...' : formatNumber(stats.totalRecords)}</Text>
            <Text style={styles.statsLabel}>Total Milking Animals</Text>
          </LinearGradient>
        </View>
        
        <View style={styles.statsCard}>
          <LinearGradient
            colors={['#3B82F6', '#2563EB']}
            style={styles.statsGradient}
          >
            <Map color="#fff" size={24} strokeWidth={2} />
            <Text style={styles.statsNumber}>{loading ? '...' : formatNumber(stats.locations)}</Text>
            <Text style={styles.statsLabel}>Locations</Text>
          </LinearGradient>
        </View>
      </Animated.View>

      {/* Action Cards */}
      <View style={styles.actionsContainer}>
        <ActionCard
          icon={Plus}
          title="Livestock Data"
          subtitle="Record dairy information"
          onPress={() => navigation.navigate('FormScreen', { userId })}
          gradient={['#8B5CF6', '#7C3AED']}
          delay={200}
        />
        
        <ActionCard
          icon={Map}
          title="View Locations Map"
          subtitle="Explore all dairy locations"
          onPress={() => navigation.navigate('MapScreen')}
          gradient={['#8B5CF6', '#7C3AED']}
          delay={400}
        />

        <ActionCard
          icon={BarChart3}
          title="Scorecard"
          subtitle="Score the dairy"
          onPress={() => navigation.navigate('ScoreScreen', { userId })}
          gradient={['#8B5CF6', '#7C3AED']}
          delay={600}
        />
        
        {/* <ActionCard
          icon={Trash2}
          title="Clear All Data"
          subtitle="Delete all saved entries"
          onPress={clearData}
          gradient={['#8B5CF6', '#7C3AED']}
          delay={800}
        /> */}
      </View>

      {/* Footer */}
      <Animated.View
        style={[
          styles.footer,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <Text style={styles.footerText}>Digital Dairy Management System</Text>
        {/* <Text style={styles.versionText}>Version 2.0</Text> */}
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    marginBottom: 20,
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 20 : 0,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 25,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 12,
    padding: 8,
    marginRight: 15,
  },
  welcomeText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 2,
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 30,
    gap: 15,
  },
  statsCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  statsGradient: {
    padding: 20,
    alignItems: 'center',
  },
  statsNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  statsLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
    fontWeight: '500',
  },
  actionsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    gap: 16,
  },
  cardContainer: {
    marginBottom: 4,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  cardGradient: {
    padding: 24,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    padding: 12,
    marginRight: 16,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  versionText: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 4,
  },
});

export default HomeScreen;