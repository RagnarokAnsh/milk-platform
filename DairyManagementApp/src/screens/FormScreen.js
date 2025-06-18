import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { ChevronLeft, Send, Zap, Shield, Edit, Plus } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import { 
  submitCowInfo, 
  submitBuffaloInfo, 
  getCowsByUserId, 
  getBuffaloesByUserId,
  updateCowInfo,
  updateBuffaloInfo
} from '../api';

const { width } = Dimensions.get('window');

// Move AnimatedInput outside of FormScreen to prevent re-creation
const AnimatedInput = React.memo(({ label, value, onChangeText, keyboardType = 'numeric', icon }) => {
  const inputAnim = useRef(new Animated.Value(0)).current;
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    Animated.timing(inputAnim, {
      toValue: isFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, inputAnim]);

  const handleFocus = useCallback(() => setIsFocused(true), []);
  const handleBlur = useCallback(() => setIsFocused(false), []);

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
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
    </Animated.View>
  );
});

// Move BreedInput outside of FormScreen to prevent re-creation
const BreedInput = React.memo(({ breed, value, onChangeText, type }) => (
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
));

const FormScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const userId = route.params?.userId;
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  if (!userId) {
    Alert.alert('Error', 'User ID is missing. Please log in again.');
    navigation.goBack();
    return null; 
  }

  const [activeTab, setActiveTab] = useState('cow');
  const [loading, setLoading] = useState(true);
  const [existingCowData, setExistingCowData] = useState(null);
  const [existingBuffaloData, setExistingBuffaloData] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

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

    loadExistingData();
  }, []);

  const loadExistingData = async () => {
    try {
      setLoading(true);
      
      // Load existing cow data
      try {
        const cowResponse = await getCowsByUserId(userId);
        if (cowResponse.data && cowResponse.data.length > 0) {
          const existingCow = cowResponse.data[0];
          setExistingCowData(existingCow);
          
          // Populate cow form with existing data
          setCowData({
            total: existingCow.total?.toString() || '',
            milking: existingCow.milking?.toString() || '',
            dry: existingCow.dry?.toString() || '',
            calvesHeifers: existingCow.calvesHeifers?.toString() || '',
            breeds: [
              { name: 'HF', count: existingCow.breeds?.HF?.toString() || '' },
              { name: 'Jersey', count: existingCow.breeds?.Jersey?.toString() || '' },
              { name: 'Sahiwal', count: existingCow.breeds?.Sahiwal?.toString() || '' },
            ],
          });
          setIsEditMode(true);
        }
      } catch (error) {
        console.log('No existing cow data found');
      }

      // Load existing buffalo data
      try {
        const buffaloResponse = await getBuffaloesByUserId(userId);
        if (buffaloResponse.data && buffaloResponse.data.length > 0) {
          const existingBuffalo = buffaloResponse.data[0];
          setExistingBuffaloData(existingBuffalo);
          
          // Populate buffalo form with existing data
          setBuffaloData({
            total: existingBuffalo.total?.toString() || '',
            milking: existingBuffalo.milking?.toString() || '',
            dry: existingBuffalo.dry?.toString() || '',
            calvesHeifers: existingBuffalo.calvesHeifers?.toString() || '',
            breeds: [
              { name: 'Murrah', count: existingBuffalo.breeds?.Murrah?.toString() || '' },
              { name: 'Mehsana', count: existingBuffalo.breeds?.Mehsana?.toString() || '' },
              { name: 'Jaffarabadi', count: existingBuffalo.breeds?.Jaffarabadi?.toString() || '' },
            ],
          });
          setIsEditMode(true);
        }
      } catch (error) {
        console.log('No existing buffalo data found');
      }
    } catch (error) {
      console.error('Error loading existing data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Stable handler functions using useCallback
  const handleCowFieldChange = useCallback((field, value) => {
    setCowData(prevData => ({ ...prevData, [field]: value }));
  }, []);

  const handleBuffaloFieldChange = useCallback((field, value) => {
    setBuffaloData(prevData => ({ ...prevData, [field]: value }));
  }, []);

  const handleCowBreedChange = useCallback((index, value) => {
    setCowData(prevData => {
      const newBreeds = [...prevData.breeds];
      newBreeds[index].count = value;
      return { ...prevData, breeds: newBreeds };
    });
  }, []);

  const handleBuffaloBreedChange = useCallback((index, value) => {
    setBuffaloData(prevData => {
      const newBreeds = [...prevData.breeds];
      newBreeds[index].count = value;
      return { ...prevData, breeds: newBreeds };
    });
  }, []);

  // Create stable individual handlers
  const cowHandlers = {
    total: useCallback((value) => handleCowFieldChange('total', value), [handleCowFieldChange]),
    milking: useCallback((value) => handleCowFieldChange('milking', value), [handleCowFieldChange]),
    dry: useCallback((value) => handleCowFieldChange('dry', value), [handleCowFieldChange]),
    calvesHeifers: useCallback((value) => handleCowFieldChange('calvesHeifers', value), [handleCowFieldChange]),
    hf: useCallback((value) => handleCowBreedChange(0, value), [handleCowBreedChange]),
    jersey: useCallback((value) => handleCowBreedChange(1, value), [handleCowBreedChange]),
    sahiwal: useCallback((value) => handleCowBreedChange(2, value), [handleCowBreedChange]),
  };

  const buffaloHandlers = {
    total: useCallback((value) => handleBuffaloFieldChange('total', value), [handleBuffaloFieldChange]),
    milking: useCallback((value) => handleBuffaloFieldChange('milking', value), [handleBuffaloFieldChange]),
    dry: useCallback((value) => handleBuffaloFieldChange('dry', value), [handleBuffaloFieldChange]),
    calvesHeifers: useCallback((value) => handleBuffaloFieldChange('calvesHeifers', value), [handleBuffaloFieldChange]),
    murrah: useCallback((value) => handleBuffaloBreedChange(0, value), [handleBuffaloBreedChange]),
    mehsana: useCallback((value) => handleBuffaloBreedChange(1, value), [handleBuffaloBreedChange]),
    jaffarabadi: useCallback((value) => handleBuffaloBreedChange(2, value), [handleBuffaloBreedChange]),
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

    try {
      const promises = [];

      // Handle cow data
      if (cowData.total || cowData.milking || cowData.dry || cowData.calvesHeifers) {
        const cowPayload = {
          total: parseInt(cowData.total, 10) || 0,
          milking: parseInt(cowData.milking, 10) || 0,
          dry: parseInt(cowData.dry, 10) || 0,
          calvesHeifers: parseInt(cowData.calvesHeifers, 10) || 0,
          breeds: formatBreeds(cowData.breeds),
        };

        if (existingCowData) {
          promises.push(updateCowInfo(userId, cowPayload));
        } else {
          promises.push(submitCowInfo({ userId, ...cowPayload }));
        }
      }

      // Handle buffalo data
      if (buffaloData.total || buffaloData.milking || buffaloData.dry || buffaloData.calvesHeifers) {
        const buffaloPayload = {
          total: parseInt(buffaloData.total, 10) || 0,
          milking: parseInt(buffaloData.milking, 10) || 0,
          dry: parseInt(buffaloData.dry, 10) || 0,
          calvesHeifers: parseInt(buffaloData.calvesHeifers, 10) || 0,
          breeds: formatBreeds(buffaloData.breeds),
        };

        if (existingBuffaloData) {
          promises.push(updateBuffaloInfo(userId, buffaloPayload));
        } else {
          promises.push(submitBuffaloInfo({ userId, ...buffaloPayload }));
        }
      }

      if (promises.length > 0) {
        await Promise.all(promises);
        Alert.alert(
          'Success', 
          isEditMode ? 'Livestock data updated successfully!' : 'Livestock data submitted successfully!',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Error', 'Please fill in at least some data before submitting.');
      }
    } catch (error) {
      console.error('Submission Error:', error.response?.data || error.message);
      Alert.alert('Error', 'Failed to submit data. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading existing data...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
        <Text style={styles.headerTitle}>
          {isEditMode ? 'Update Livestock Data' : 'Add Livestock Data'}
        </Text>
        <View style={styles.headerRight}>
          {isEditMode && (
            <View style={styles.editModeIndicator}>
              <Edit color="#8B5CF6" size={20} strokeWidth={2} />
            </View>
          )}
        </View>
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
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 16 }]}
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
                <Text style={styles.sectionTitle}>
                  {existingCowData ? 'Update Cow Details' : 'Cow Ownership Details'}
                </Text>
              </View>
              
              <AnimatedInput
                label="Total Cows"
                value={cowData.total}
                onChangeText={cowHandlers.total}
              />
              
              <AnimatedInput
                label="Milking Cows"
                value={cowData.milking}
                onChangeText={cowHandlers.milking}
              />
              
              <AnimatedInput
                label="Dry Cows"
                value={cowData.dry}
                onChangeText={cowHandlers.dry}
              />
              
              <AnimatedInput
                label="Calves & Heifers"
                value={cowData.calvesHeifers}
                onChangeText={cowHandlers.calvesHeifers}
              />

              <Text style={styles.breedSectionTitle}>Cow Breeds</Text>
              <View style={styles.breedSection}>
                <BreedInput
                  breed="HF"
                  value={cowData.breeds[0].count}
                  onChangeText={cowHandlers.hf}
                  type="cow"
                />
                <BreedInput
                  breed="Jersey"
                  value={cowData.breeds[1].count}
                  onChangeText={cowHandlers.jersey}
                  type="cow"
                />
                <BreedInput
                  breed="Sahiwal"
                  value={cowData.breeds[2].count}
                  onChangeText={cowHandlers.sahiwal}
                  type="cow"
                />
              </View>
            </View>
          ) : (
            <View>
              <View style={styles.sectionHeader}>
                <Shield color="#8B5CF6" size={24} strokeWidth={2} />
                <Text style={styles.sectionTitle}>
                  {existingBuffaloData ? 'Update Buffalo Details' : 'Buffalo Ownership Details'}
                </Text>
              </View>
              
              <AnimatedInput
                label="Total Buffaloes"
                value={buffaloData.total}
                onChangeText={buffaloHandlers.total}
              />
              
              <AnimatedInput
                label="Milking Buffaloes"
                value={buffaloData.milking}
                onChangeText={buffaloHandlers.milking}
              />
              
              <AnimatedInput
                label="Dry Buffaloes"
                value={buffaloData.dry}
                onChangeText={buffaloHandlers.dry}
              />
              
              <AnimatedInput
                label="Calves & Heifers"
                value={buffaloData.calvesHeifers}
                onChangeText={buffaloHandlers.calvesHeifers}
              />

              <Text style={styles.breedSectionTitle}>Buffalo Breeds</Text>
              <View style={styles.breedSection}>
                <BreedInput
                  breed="Murrah"
                  value={buffaloData.breeds[0].count}
                  onChangeText={buffaloHandlers.murrah}
                  type="buffalo"
                />
                <BreedInput
                  breed="Mehsana"
                  value={buffaloData.breeds[1].count}
                  onChangeText={buffaloHandlers.mehsana}
                  type="buffalo"
                />
                <BreedInput
                  breed="Jaffarabadi"
                  value={buffaloData.breeds[2].count}
                  onChangeText={buffaloHandlers.jaffarabadi}
                  type="buffalo"
                />
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
            {isEditMode ? <Edit color="#fff" size={20} strokeWidth={2} /> : <Send color="#fff" size={20} strokeWidth={2} />}
            <Text style={styles.submitButtonText}>
              {isSubmitting 
                ? (isEditMode ? 'Updating...' : 'Submitting...') 
                : (isEditMode ? 'Update Data' : 'Submit All Data')
              }
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
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
    alignItems: 'flex-end',
  },
  editModeIndicator: {
    backgroundColor: '#F3E8FF',
    borderRadius: 8,
    padding: 6,
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