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
  Dimensions,
  Platform,
} from 'react-native';
import { ChevronLeft, Send, Zap, Shield } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import { submitCowInfo, submitBuffaloInfo } from '../api';

const { width } = Dimensions.get('window');

const FormScreen = ({ route, navigation }) => {
  const userId = route.params?.userId;
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
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
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
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
      duration: 300,
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
    
    // Submit animation
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0.5,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

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

  const AnimatedInput = ({ label, value, onChangeText, keyboardType = 'numeric', icon }) => {
    const inputAnim = useRef(new Animated.Value(0)).current;
    const isFocused = focusedInput === label;

    useEffect(() => {
      Animated.timing(inputAnim, {
        toValue: isFocused ? 1 : 0,
        duration: 200,
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
              outputRange: ['#E2E8F0', '#8B5CF6'],
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
          placeholderTextColor="#94A3B8"
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          onFocus={() => setFocusedInput(label)}
          onBlur={() => setFocusedInput(null)}
        />
      </Animated.View>
    );
  };

  const BreedInput = ({ breed, value, onChangeText, type }) => (
    <View style={styles.breedContainer}>
      <View style={styles.breedLabel}>
        <Text style={styles.breedName}>{breed}</Text>
      </View>
      <TextInput
        style={styles.breedInput}
        placeholder="Count"
        placeholderTextColor="#94A3B8"
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
          colors={['#8B5CF6', '#7C3AED']}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
      )}
      <Icon 
        color={isActive ? '#fff' : '#64748B'} 
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
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      
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
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.8}
        >
          <ChevronLeft color="#1E293B" size={28} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Livestock Data</Text>
        <View style={styles.headerRight} />
      </Animated.View>

      {/* Progress Bar */}
      <Animated.View
        style={[
          styles.progressContainer,
          { opacity: fadeAnim },
        ]}
      >
        <Text style={styles.progressText}>Form Progress</Text>
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
        <Text style={styles.progressPercentage}>
          {progressPercentage}
        </Text>
      </Animated.View>

      {/* Tab Switcher */}
      <Animated.View
        style={[
          styles.tabContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
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
        <Animated.View
          style={[
            styles.formCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {activeTab === 'cow' ? (
            <View>
              <View style={styles.sectionHeader}>
                <Zap color="#8B5CF6" size={24} strokeWidth={2} />
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
                    type="cow"
                  />
                ))}
              </View>
            </View>
          ) : (
            <View>
              <View style={styles.sectionHeader}>
                <Shield color="#8B5CF6" size={24} strokeWidth={2} />
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
                    type="buffalo"
                  />
                ))}
              </View>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* Submit Button */}
      <Animated.View
        style={[
          styles.submitContainer,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={isSubmitting ? ['#94A3B8', '#64748B'] : ['#10B981', '#059669']}
            style={styles.submitGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Send color="#fff" size={20} strokeWidth={2} />
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Submitting...' : 'Submit All Data'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  headerRight: {
    width: 44,
  },
  progressContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  progressText: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 8,
    fontWeight: '500',
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 2,
  },
  progressPercentage: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'right',
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 15,
    borderRadius: 16,
    padding: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  activeTab: {
    overflow: 'hidden',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  activeTabText: {
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  inputContainer: {
    marginBottom: 20,
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#FAFBFC',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  input: {
    fontSize: 16,
    color: '#1E293B',
    padding: 0,
    fontWeight: '500',
  },
  breedSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginTop: 24,
    marginBottom: 16,
  },
  breedSection: {
    gap: 12,
  },
  breedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  breedLabel: {
    flex: 1,
  },
  breedName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  breedInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    width: 100,
  },
  submitContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  submitButton: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  submitButtonDisabled: {
    elevation: 0,
    shadowOpacity: 0,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default FormScreen;