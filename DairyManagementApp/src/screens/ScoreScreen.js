import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Animated,
  ScrollView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { ChevronLeft, Building, Archive, Syringe, Droplets, Wind, Clipboard, Milk, Leaf } from 'lucide-react-native';

const ActionCard = ({ icon: Icon, title, onPress, gradient, delay = 0 }) => {
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
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const iconMap = {
  'Infrastructure-Cattle shed': Building,
  'Feed and fodder storage and handing': Archive,
  'Animal nutrition- Improve feeding practices to improve animal health': Leaf,
  'Animal health management': Syringe,
  "Milker's health and general hygiene": Droplets,
  'Preparation for milking': Clipboard,
  'Milking and post milking activities': Clipboard,
  'Handling of milk': Milk,
};

// Dynamic gradient colors for different sections
const gradientMap = {
  1: ['#06B6D4', '#0891B2'], // Infrastructure - Cyan
  2: ['#06B6D4', '#0891B2'], // Feed and fodder - Orange
  3: ['#06B6D4', '#0891B2'], // Animal nutrition - Green
  4: ['#06B6D4', '#0891B2'], // Animal health - Red
  5: ['#06B6D4', '#0891B2'], // Milker's health - Purple
  6: ['#06B6D4', '#0891B2'], // Preparation for milking - Blue
  7: ['#06B6D4', '#0891B2'], // Milking activities - Pink
  8: ['#06B6D4', '#0891B2'], // Handling of milk - Indigo
};

const ScoreScreen = ({ route, navigation }) => {
  const { userId } = route.params;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [scoreCategories, setScoreCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 0,
      useNativeDriver: true,
    }).start();

    fetchScoreCategories();
  }, []);

  const fetchScoreCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://3.6.143.181:8501/api/sections');
      
      if (!response.ok) {
        throw new Error('Failed to fetch sections');
      }
      
      const data = await response.json();
      
      const categories = data.map(item => ({
        id: item.id,
        title: item.name,
        icon: iconMap[item.name] || Wind, // Default icon
        gradient: gradientMap[item.id] || ['#06B6D4', '#0891B2'], // Default gradient
      }));
      
      setScoreCategories(categories);
    } catch (error) {
      console.error('Failed to fetch score categories:', error);
      Alert.alert(
        'Error',
        'Failed to load assessment categories. Please check your connection and try again.',
        [
          { text: 'Retry', onPress: fetchScoreCategories },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryPress = (category) => {
    // Navigate to InfraScreen with the selected section ID
    navigation.navigate('Infra', { 
      userId: userId,
      sectionId: category.id,
      sectionName: category.title
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>Loading assessment categories...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <LinearGradient
          colors={['#0F172A', '#1E293B', '#334155']}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <ChevronLeft color="#fff" size={24} strokeWidth={2} />
            </TouchableOpacity>
            <Text style={styles.title}>Assessment Categories</Text>
            <View style={{ width: 40 }} />
          </View>
        </LinearGradient>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.actionsContainer}>
        <Text style={styles.sectionTitle}>Choose a category to assess:</Text>
        <Text style={styles.sectionDescription}>
          Select any category below to start your assessment. Each category contains specific subsections that you can evaluate.
        </Text>
        
        {scoreCategories.map((category, index) => (
          <ActionCard
            key={category.id}
            icon={category.icon}
            title={category.title}
            onPress={() => handleCategoryPress(category)}
            gradient={category.gradient}
            delay={index * 100}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 16,
    fontWeight: '500',
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
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  actionsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 24,
    lineHeight: 22,
  },
  cardContainer: {
    marginBottom: 16,
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
  },
});

export default ScoreScreen;
