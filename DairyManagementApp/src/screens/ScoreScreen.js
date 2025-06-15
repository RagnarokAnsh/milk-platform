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
import { Building, Archive, Syringe, Droplets, Wind, Clipboard, Milk, Leaf } from 'lucide-react-native';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS, ANIMATIONS } from '../styles/globalStyles';
import ModernHeader from '../components/common/ModernHeader';
import AnimatedCard from '../components/common/AnimatedCard';
import LoadingSpinner from '../components/common/LoadingSpinner';

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

const gradientMap = [
  COLORS.gradients.primary,
  COLORS.gradients.secondary,
  COLORS.gradients.success,
  COLORS.gradients.warning,
  COLORS.gradients.error,
  COLORS.gradients.ocean,
  COLORS.gradients.forest,
  COLORS.gradients.royal,
];

const ScoreScreen = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [scoreCategories, setScoreCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: ANIMATIONS.timing.slow,
      useNativeDriver: true,
    }).start();

    fetchScoreCategories();
  }, []);

  const fetchScoreCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://192.168.21.241:8081/api/sections');
      const data = await response.json();
      const categories = data.map((item, index) => ({
        id: item.id,
        title: item.name,
        icon: iconMap[item.name] || Wind,
        gradient: gradientMap[index % gradientMap.length],
        description: getDescriptionForCategory(item.name),
      }));
      setScoreCategories(categories);
    } catch (error) {
      console.error('Failed to fetch score categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDescriptionForCategory = (name) => {
    const descriptions = {
      'Infrastructure-Cattle shed': 'Assess your cattle shed infrastructure and facilities',
      'Feed and fodder storage and handing': 'Evaluate feed storage and handling practices',
      'Animal nutrition- Improve feeding practices to improve animal health': 'Review animal nutrition and feeding methods',
      'Animal health management': 'Check animal health management protocols',
      "Milker's health and general hygiene": 'Assess milker hygiene and health practices',
      'Preparation for milking': 'Evaluate pre-milking preparation procedures',
      'Milking and post milking activities': 'Review milking and post-milking activities',
      'Handling of milk': 'Assess milk handling and storage practices',
    };
    return descriptions[name] || 'Evaluate this aspect of your dairy operation';
  };

  const CategoryCard = ({ category, index }) => (
    <AnimatedCard
      onPress={() => {
        if (category.id === 1) {
          navigation.navigate('Infra', { sectionId: category.id });
        } else {
          console.log(`Navigate to ${category.title}`);
        }
      }}
      gradient={category.gradient}
      style={styles.categoryCard}
      delay={index * 100}
      animationType="fadeInUp"
    >
      <View style={styles.categoryContent}>
        <View style={styles.categoryIconContainer}>
          <category.icon color={COLORS.text.inverse} size={32} strokeWidth={2} />
        </View>
        <View style={styles.categoryTextContainer}>
          <Text style={styles.categoryTitle}>{category.title}</Text>
          <Text style={styles.categoryDescription}>{category.description}</Text>
        </View>
      </View>
    </AnimatedCard>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary[600]} />
        <ModernHeader
          title="Assessment Scorecard"
          subtitle="Loading categories..."
          onBackPress={() => navigation.goBack()}
          gradient={COLORS.gradients.primary}
        />
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="large" text="Loading assessment categories..." />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary[600]} />
      
      <ModernHeader
        title="Assessment Scorecard"
        subtitle={`${scoreCategories.length} categories available`}
        onBackPress={() => navigation.goBack()}
        gradient={COLORS.gradients.primary}
      />

      <Animated.View
        style={[
          styles.content,
          { opacity: fadeAnim },
        ]}
      >
        <View style={styles.introSection}>
          <Text style={styles.introTitle}>Dairy Performance Assessment</Text>
          <Text style={styles.introDescription}>
            Evaluate different aspects of your dairy operation to identify areas for improvement and track your progress over time.
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionTitle}>Assessment Categories</Text>
          
          {scoreCategories.map((category, index) => (
            <CategoryCard key={category.id} category={category} index={index} />
          ))}
        </ScrollView>
      </Animated.View>
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
  content: {
    flex: 1,
  },
  introSection: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING['2xl'],
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutral[200],
  },
  introTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },
  introDescription: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text.secondary,
    lineHeight: TYPOGRAPHY.lineHeight.relaxed * TYPOGRAPHY.fontSize.base,
  },
  scrollContent: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING['4xl'],
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginTop: SPACING['2xl'],
    marginBottom: SPACING.lg,
  },
  categoryCard: {
    marginBottom: SPACING.lg,
    minHeight: 120,
  },
  categoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginRight: SPACING.lg,
  },
  categoryTextContainer: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.inverse,
    marginBottom: SPACING.xs,
    lineHeight: TYPOGRAPHY.lineHeight.tight * TYPOGRAPHY.fontSize.lg,
  },
  categoryDescription: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    lineHeight: TYPOGRAPHY.lineHeight.normal * TYPOGRAPHY.fontSize.sm,
  },
});

export default ScoreScreen;