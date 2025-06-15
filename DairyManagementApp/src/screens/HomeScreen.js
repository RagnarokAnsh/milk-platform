import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  Animated,
  ScrollView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LogOut, Plus, Map, Trash2, Milk, BarChart3, Users, TrendingUp } from 'lucide-react-native';
import { getUsersList, getCowsList, getBuffaloesList } from '../api';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS, ANIMATIONS } from '../styles/globalStyles';
import AnimatedCard from '../components/common/AnimatedCard';
import AnimatedButton from '../components/common/AnimatedButton';
import LoadingSpinner from '../components/common/LoadingSpinner';

const formatNumber = (num) => {
  if (num >= 10000000) return (num / 10000000).toFixed(1) + ' Cr';
  if (num >= 100000) return (num / 100000).toFixed(1) + ' L';
  if (num >= 1000) return (num / 1000).toFixed(1) + ' K';
  return num.toString();
};

const HomeScreen = ({ route, navigation }) => {
  const { userId } = route.params;
  const [stats, setStats] = useState({ totalRecords: 0, locations: 0 });
  const [loading, setLoading] = useState(true);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  
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

    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [usersResponse, cowsResponse, buffaloesResponse] = await Promise.all([
        getUsersList(),
        getCowsList(),
        getBuffaloesList(),
      ]);

      const locationCount = usersResponse.data.filter(u => u.latitude && u.longitude).length;
      
      const milkingCows = cowsResponse.data.reduce((sum, record) => sum + (record.milking || 0), 0);
      const milkingBuffaloes = buffaloesResponse.data.reduce((sum, record) => sum + (record.milking || 0), 0);
      const totalMilkingAnimals = milkingCows + milkingBuffaloes;

      setStats({ totalRecords: totalMilkingAnimals, locations: locationCount });
    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
      Alert.alert('Error', 'Could not load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

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

  const StatCard = ({ icon: Icon, title, value, subtitle, gradient, delay = 0 }) => (
    <AnimatedCard
      gradient={gradient}
      style={styles.statCard}
      delay={delay}
      animationType="fadeInUp"
    >
      <View style={styles.statContent}>
        <View style={styles.statIconContainer}>
          <Icon color={COLORS.text.inverse} size={24} strokeWidth={2} />
        </View>
        <View style={styles.statTextContainer}>
          <Text style={styles.statValue}>{loading ? '...' : formatNumber(value)}</Text>
          <Text style={styles.statTitle}>{title}</Text>
          {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
        </View>
      </View>
    </AnimatedCard>
  );

  const ActionCard = ({ icon: Icon, title, subtitle, onPress, gradient, delay = 0 }) => (
    <AnimatedCard
      onPress={onPress}
      gradient={gradient}
      style={styles.actionCard}
      delay={delay}
      animationType="fadeInUp"
    >
      <View style={styles.actionContent}>
        <View style={styles.actionIconContainer}>
          <Icon color={COLORS.text.inverse} size={28} strokeWidth={2} />
        </View>
        <View style={styles.actionTextContainer}>
          <Text style={styles.actionTitle}>{title}</Text>
          <Text style={styles.actionSubtitle}>{subtitle}</Text>
        </View>
      </View>
    </AnimatedCard>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary[600]} />
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="large" text="Loading dashboard..." />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary[600]} />
      
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
          colors={COLORS.gradients.primary}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <View style={styles.logoContainer}>
                <Milk color={COLORS.success[500]} size={32} strokeWidth={2.5} />
              </View>
              <View>
                <Text style={styles.welcomeText}>Welcome back</Text>
                <Text style={styles.title}>Dairy Manager</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={handleLogout}
              style={styles.logoutButton}
              activeOpacity={0.8}
            >
              <LogOut color={COLORS.text.inverse} size={24} strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Animated.View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Section */}
        <Animated.View
          style={[
            styles.statsContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>Dashboard Overview</Text>
          <View style={styles.statsGrid}>
            <StatCard
              icon={TrendingUp}
              title="Milking Animals"
              value={stats.totalRecords}
              subtitle="Active producers"
              gradient={COLORS.gradients.success}
              delay={100}
            />
            
            <StatCard
              icon={Map}
              title="Locations"
              value={stats.locations}
              subtitle="GPS tracked"
              gradient={COLORS.gradients.primary}
              delay={200}
            />
          </View>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View
          style={[
            styles.actionsContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <ActionCard
            icon={Plus}
            title="Add Livestock Data"
            subtitle="Record new dairy information"
            onPress={() => navigation.navigate('FormScreen', { userId })}
            gradient={COLORS.gradients.secondary}
            delay={300}
          />
          
          <ActionCard
            icon={Map}
            title="View Locations Map"
            subtitle="Explore all dairy locations"
            onPress={() => navigation.navigate('MapScreen')}
            gradient={COLORS.gradients.ocean}
            delay={400}
          />

          <ActionCard
            icon={BarChart3}
            title="Assessment Scorecard"
            subtitle="Evaluate dairy performance"
            onPress={() => navigation.navigate('ScoreScreen', { userId })}
            gradient={COLORS.gradients.warning}
            delay={500}
          />
          
          <ActionCard
            icon={Trash2}
            title="Clear All Data"
            subtitle="Reset all saved entries"
            onPress={clearData}
            gradient={COLORS.gradients.error}
            delay={600}
          />
        </Animated.View>

        {/* Footer */}
        <Animated.View
          style={[
            styles.footer,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <Text style={styles.footerText}>Smart Dairy Management System</Text>
          <Text style={styles.versionText}>Version 3.0 • Built with ❤️ for farmers</Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    ...SHADOWS.lg,
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 20 : 0,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING['2xl'],
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginRight: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  welcomeText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.inverse,
    marginTop: SPACING.xs,
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING['4xl'],
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: SPACING.lg,
  },
  statsContainer: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING['2xl'],
  },
  statsGrid: {
    flexDirection: 'row',
    gap: SPACING.lg,
  },
  statCard: {
    flex: 1,
    minHeight: 120,
  },
  statContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginRight: SPACING.lg,
  },
  statTextContainer: {
    flex: 1,
  },
  statValue: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.inverse,
    marginBottom: SPACING.xs,
  },
  statTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  statSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: SPACING.xs,
  },
  actionsContainer: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING['3xl'],
  },
  actionCard: {
    marginBottom: SPACING.lg,
    minHeight: 100,
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginRight: SPACING.lg,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.inverse,
    marginBottom: SPACING.xs,
  },
  actionSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: SPACING['2xl'],
    paddingHorizontal: SPACING.xl,
    marginTop: SPACING['2xl'],
  },
  footerText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.secondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    textAlign: 'center',
  },
  versionText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.text.tertiary,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
});

export default HomeScreen;