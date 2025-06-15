import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  SafeAreaView,
  StatusBar,
  Animated,
  Platform,
} from 'react-native';
import { ChevronLeft, Send, Zap, Shield } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import { submitCowInfo, submitBuffaloInfo } from '../api';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS, ANIMATIONS } from '../styles/globalStyles';
import ModernHeader from '../components/common/ModernHeader';
import AnimatedCard from '../components/common/AnimatedCard';
import AnimatedButton from '../components/common/AnimatedButton';
import LoadingSpinner from '../components/common/LoadingSpinner';

const FormScreen = ({ route, navigation }) => {
  const userId = route.params?.userId;
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  if (!userId) {
    Alert.alert('Error', 'User ID is missing. Please log in again.');
    navigation.goBack();
    return null; 
  }

  const [activeTab, setActiveTab] = useState('cow');
  const [cowData, setCowData] = useState({
    total: '',
    milking: '',
    dry: '',
    calvesHeifers: '',
    breeds: [
      { name: 'HF', count: '' },
      { name: 'Jersey', count: '' },
      { name: 'Sahiwal', count: '' },
    ],
  });

  const [buffaloData, setBuffaloData] = useState({
    total: '',
    milking: '',
    dry: '',
    calvesHeifers: '',
    breeds: [
      { name: 'Murrah', count: '' },
      { name: 'Mehsana', count: '' },
      { name: 'Jaffarabadi', count: '' },
    ],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);
  const [progressPercentage, setProgressPercentage] = useState('0%');

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: ANIMATIONS.timing.slow,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    // Update progress based on filled fields
    const cowFields = [cowData.total, cowData.milking, cowData.dry, cowData.calvesHeifers];
    const buffaloFields = [buffaloData.total, buffaloData.milking, buffaloData.dry, buffaloData.calvesHeifers];
    const allFields = [...cowFields, ...buffaloFields];
    const filledFields = allFields.filter(field => field.trim() !== '').length;
    const progress = allFields.length > 0 ? filledFields / allFields.length : 0;

    Animated.timing(progressAnim, {
      toValue: progress,
      duration: ANIMATIONS.timing.normal,
      useNativeDriver: false,
    }).start();
  }, [cowData, buffaloData]);

  useEffect(() => {
    const listenerId = progressAnim.addListener(({ value }) => {
      setProgressPercentage(`${Math.round(value * 100)}%`);
    });
    return () => {
      progressAnim.removeListener(listenerId);
    };
  }, [progressAnim]);

  const handleCowChange = (field, value) => setCowData({ ...cowData, [field]: value });
  const handleBuffaloChange = (field, value) => setBuffaloData({ ...buffaloData, [field]: value });

  const handleBreedChange = (type, index, value) => {
    const data = type === 'cow' ? cowData : buffaloData;
    const setData = type === 'cow' ? setCowData : setBuffaloData;
    const newBreeds = [...data.breeds];
    newBreeds[index].count = value;
    setData({ ...data, breeds: newBreeds });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    const formatBreeds = (breeds) =>
      breeds.reduce((acc, breed) => {
        if (breed.name && breed.count) {
          acc[breed.name] = parseInt(breed.count, 10) || 0;
        }
        return acc;
      }, {});

    const cowPayload = {
      userId,
      total: parseInt(cowData.total, 10) || 0,
      milking: parseInt(cowData.milking, 10) || 0,
      dry: parseInt(cowData.dry, 10) || 0,
      calvesHeifers: parseInt(cowData.calvesHeifers, 10) || 0,
      breeds: formatBreeds(cowData.breeds),
    };

    const buffaloPayload = {
      userId,
      total: parseInt(buffaloData.total, 10) || 0,
      milking: parseInt(buffaloData.milking, 10) || 0,
      dry: parseInt(buffaloData.dry, 10) || 0,
      calvesHeifers: parseInt(buffaloData.calvesHeifers, 10) || 0,
      breeds: formatBreeds(buffaloData.breeds),
    };

    try {
      await Promise.all([submitCowInfo(cowPayload), submitBuffaloInfo(buffaloPayload)]);
      Alert.alert('Success', 'Livestock data submitted successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Submission Error:', error.response?.data || error.message);
      Alert.alert('Error', 'Failed to submit data. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const AnimatedInput = ({ label, value, onChangeText, keyboardType = 'numeric' }) => {
    const inputAnim = useRef(new Animated.Value(0)).current;
    const isFocused = focusedInput === label;

    useEffect(() => {
      Animated.timing(inputAnim, {
        toValue: isFocused ? 1 : 0,
        duration: ANIMATIONS.timing.fast,
        useNativeDriver: false,
      }).start();
    }, [isFocused]);

    return (
      <Animated.View
        style={[
          styles.inputContainer,
          {
            borderColor: inputAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [COLORS.neutral[200], COLORS.primary[500]],
            }),
            shadowOpacity: inputAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.1],
            }),
          },
        ]}
      >
        <Text style={styles.inputLabel}>{label}</Text>
        <TextInput
          style={styles.input}
          placeholder={`Enter ${label.toLowerCase()}`}
          placeholderTextColor={COLORS.text.tertiary}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          onFocus={() => setFocusedInput(label)}
          onBlur={() => setFocusedInput(null)}
        />
      </Animated.View>
    );
  };

  const BreedInput = ({ breed, value, onChangeText }) => (
    <View style={styles.breedContainer}>
      <View style={styles.breedLabel}>
        <Text style={styles.breedName}>{breed}</Text>
      </View>
      <TextInput
        style={styles.breedInput}
        placeholder="Count"
        placeholderTextColor={COLORS.text.tertiary}
        keyboardType="numeric"
        value={value}
        onChangeText={onChangeText}
        textAlign="center"
      />
    </View>
  );

  const TabButton = ({ title, icon: Icon, isActive, onPress }) => (
    <TouchableOpacity
      style={[styles.tabButton, isActive && styles.activeTab]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {isActive && (
        <LinearGradient
          colors={COLORS.gradients.primary}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
      )}
      <Icon 
        color={isActive ? COLORS.text.inverse : COLORS.text.secondary} 
        size={20} 
        strokeWidth={2}
      />
      <Text style={[styles.tabText, isActive && styles.activeTabText]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary[600]} />
      
      <ModernHeader
        title="Add Livestock Data"
        subtitle="Record your dairy animals"
        onBackPress={() => navigation.goBack()}
        gradient={COLORS.gradients.primary}
      />

      {/* Progress Bar */}
      <Animated.View
        style={[
          styles.progressContainer,
          { opacity: fadeAnim },
        ]}
      >
        <View style={styles.progressHeader}>
          <Text style={styles.progressText}>Form Progress</Text>
          <Text style={styles.progressPercentage}>{progressPercentage}</Text>
        </View>
        <View style={styles.progressBarContainer}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
      </Animated.View>

      {/* Tab Switcher */}
      <Animated.View
        style={[
          styles.tabContainer,
          { opacity: fadeAnim },
        ]}
      >
        <TabButton
          title="Cows"
          icon={Zap}
          isActive={activeTab === 'cow'}
          onPress={() => setActiveTab('cow')}
        />
        <TabButton
          title="Buffaloes"
          icon={Shield}
          isActive={activeTab === 'buffalo'}
          onPress={() => setActiveTab('buffalo')}
        />
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <AnimatedCard style={styles.formCard} animationType="fadeInUp">
          {activeTab === 'cow' ? (
            <View>
              <View style={styles.sectionHeader}>
                <Zap color={COLORS.primary[500]} size={24} strokeWidth={2} />
                <Text style={styles.sectionTitle}>Cow Ownership Details</Text>
              </View>
              
              <AnimatedInput
                label="Total Cows"
                value={cowData.total}
                onChangeText={(v) => handleCowChange('total', v)}
              />
              
              <AnimatedInput
                label="Milking Cows"
                value={cowData.milking}
                onChangeText={(v) => handleCowChange('milking', v)}
              />
              
              <AnimatedInput
                label="Dry Cows"
                value={cowData.dry}
                onChangeText={(v) => handleCowChange('dry', v)}
              />
              
              <AnimatedInput
                label="Calves & Heifers"
                value={cowData.calvesHeifers}
                onChangeText={(v) => handleCowChange('calvesHeifers', v)}
              />

              <Text style={styles.breedSectionTitle}>Cow Breeds</Text>
              <View style={styles.breedSection}>
                {cowData.breeds.map((breed, index) => (
                  <BreedInput
                    key={breed.name}
                    breed={breed.name}
                    value={breed.count}
                    onChangeText={(value) => handleBreedChange('cow', index, value)}
                  />
                ))}
              </View>
            </View>
          ) : (
            <View>
              <View style={styles.sectionHeader}>
                <Shield color={COLORS.primary[500]} size={24} strokeWidth={2} />
                <Text style={styles.sectionTitle}>Buffalo Ownership Details</Text>
              </View>
              
              <AnimatedInput
                label="Total Buffaloes"
                value={buffaloData.total}
                onChangeText={(v) => handleBuffaloChange('total', v)}
              />
              
              <AnimatedInput
                label="Milking Buffaloes"
                value={buffaloData.milking}
                onChangeText={(v) => handleBuffaloChange('milking', v)}
              />
              
              <AnimatedInput
                label="Dry Buffaloes"
                value={buffaloData.dry}
                onChangeText={(v) => handleBuffaloChange('dry', v)}
              />
              
              <AnimatedInput
                label="Calves & Heifers"
                value={buffaloData.calvesHeifers}
                onChangeText={(v) => handleBuffaloChange('calvesHeifers', v)}
              />

              <Text style={styles.breedSectionTitle}>Buffalo Breeds</Text>
              <View style={styles.breedSection}>
                {buffaloData.breeds.map((breed, index) => (
                  <BreedInput
                    key={breed.name}
                    breed={breed.name}
                    value={breed.count}
                    onChangeText={(value) => handleBreedChange('buffalo', index, value)}
                  />
                ))}
              </View>
            </View>
          )}
        </AnimatedCard>
      </ScrollView>

      {/* Submit Button */}
      <Animated.View
        style={[
          styles.submitContainer,
          { opacity: fadeAnim },
        ]}
      >
        {isSubmitting ? (
          <View style={styles.loadingContainer}>
            <LoadingSpinner text="Submitting data..." />
          </View>
        ) : (
          <AnimatedButton
            title="Submit All Data"
            onPress={handleSubmit}
            icon={Send}
            variant="success"
            style={styles.submitButton}
          />
        )}
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  progressContainer: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutral[200],
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  progressText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.secondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  progressPercentage: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.primary[600],
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: COLORS.neutral[200],
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.success[500],
    borderRadius: BORDER_RADIUS.sm,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.xl,
    marginTop: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xs,
    ...SHADOWS.sm,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.sm,
  },
  activeTab: {
    overflow: 'hidden',
  },
  tabText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text.secondary,
  },
  activeTabText: {
    color: COLORS.text.inverse,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.xl,
    paddingBottom: 120,
  },
  formCard: {
    padding: SPACING['2xl'],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING['2xl'],
    gap: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
  },
  inputContainer: {
    marginBottom: SPACING.lg,
    borderWidth: 1.5,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    ...SHADOWS.sm,
  },
  inputLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text.secondary,
    marginBottom: SPACING.sm,
  },
  input: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text.primary,
    padding: 0,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  breedSectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginTop: SPACING['2xl'],
    marginBottom: SPACING.lg,
  },
  breedSection: {
    gap: SPACING.md,
  },
  breedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.neutral[50],
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.neutral[200],
  },
  breedLabel: {
    flex: 1,
  },
  breedName: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text.primary,
  },
  breedInput: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.neutral[300],
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text.primary,
    width: 100,
    textAlign: 'center',
  },
  submitContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xl,
    borderTopWidth: 1,
    borderTopColor: COLORS.neutral[200],
    ...SHADOWS.lg,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  submitButton: {
    width: '100%',
  },
});

export default FormScreen;