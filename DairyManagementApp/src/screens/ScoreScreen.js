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
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { ChevronLeft, Building, Archive, Syringe, Droplets, Wind, Clipboard, Milk, Leaf } from 'lucide-react-native';

const ActionCard = ({ icon: Icon, title, onPress, gradient, delay = 0 }) => {
  const cardAnim = useRef(new Animated.Value(0)).current;
  const pressAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(cardAnim, {
      toValue: 1,
      duration: 500,
      delay,
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

const ScoreScreen = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [scoreCategories, setScoreCategories] = useState([]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    const fetchScoreCategories = async () => {
      try {
        const response = await fetch('http://192.168.21.241:8081/api/sections');
        const data = await response.json();
        const categories = data.map(item => ({
          id: item.id,
          title: item.name,
          icon: iconMap[item.name] || Wind, // Default icon
          gradient: ['#06B6D4', '#0891B2'],
        }));
        setScoreCategories(categories);
      } catch (error) {
        console.error('Failed to fetch score categories:', error);
      }
    };

    fetchScoreCategories();
  }, []);

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
            <Text style={styles.title}>Scorecard</Text>
            <View style={{ width: 40 }} />
          </View>
        </LinearGradient>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.actionsContainer}>
        {scoreCategories.map((category, index) => (
          <ActionCard
            key={category.id}
            icon={category.icon}
            title={category.title}
            onPress={() => {
              if (category.id === 1) {
                navigation.navigate('Infra');
              } else {
                console.log(`Navigate to ${category.title}`);
              }
            }}
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
  },
});

export default ScoreScreen;
