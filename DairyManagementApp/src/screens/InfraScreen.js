import React, { useState, useRef, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
  Animated,
  Dimensions,
  Platform,
  Image,
  Modal,
  PermissionsAndroid,
  ActivityIndicator,
} from 'react-native';
import {
  ChevronLeft,
  Camera,
  Upload,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  AlertCircle,
  XCircle,
  Home,
  Droplets,
  Wind,
  Thermometer,
  Shield,
  Trash2,
  Send,
  Edit,
} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserSubsectionScores } from '../api';

const { width, height } = Dimensions.get('window');

const InfraScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { userId, sectionId = 1 } = route.params || {};

  const [subsections, setSubsections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState({});
  const [uploadedImages, setUploadedImages] = useState({});
  const [scores, setScores] = useState({});
  const [submitting, setSubmitting] = useState({});
  const [existingScores, setExistingScores] = useState({});
  
  // Store dynamic score descriptions for each subsection
  const [scoreDescriptions, setScoreDescriptions] = useState({});
  const [loadingDescriptions, setLoadingDescriptions] = useState({});

  // Animation values - simplified for smoother performance
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Keys for AsyncStorage
  const SCORES_STORAGE_KEY = `scores_${userId}_${sectionId}`;
  const EXISTING_SCORES_STORAGE_KEY = `existing_scores_${userId}_${sectionId}`;
  const IMAGES_STORAGE_KEY = `images_${userId}_${sectionId}`;

  useEffect(() => {
    initializeScreen();
  }, [sectionId, userId]);

  const initializeScreen = async () => {
    setLoading(true);
    
    try {
      // First load subsections
      await fetchSubsections();
      
      // Then load existing scores from API
      await loadExistingScores();
      
      // Finally load any persisted local data
      await loadPersistedData();
      
    } catch (error) {
      console.error('Error initializing screen:', error);
    } finally {
      setLoading(false);
      
      // Simplified initial animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  // Load persisted data from AsyncStorage
  const loadPersistedData = async () => {
    try {
      const [persistedImages] = await Promise.all([
        AsyncStorage.getItem(IMAGES_STORAGE_KEY),
      ]);

      if (persistedImages) {
        const parsedImages = JSON.parse(persistedImages);
        setUploadedImages(parsedImages);
        console.log('Loaded persisted images:', parsedImages);
      }
    } catch (error) {
      console.error('Error loading persisted data:', error);
    }
  };

  // Save data to AsyncStorage
  const persistData = async (key, data) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error persisting data for key ${key}:`, error);
    }
  };

  const loadExistingScores = async () => {
    if (!userId) {
      console.log('Missing userId for loading existing scores');
      return;
    }
    
    try {
      console.log(`Loading existing scores for userId: ${userId}`);
      
      // Get all scores for this user
      const response = await getUserSubsectionScores(userId, sectionId);
      
      console.log('API Response for existing scores:', response);
      
      if (response && response.data && Array.isArray(response.data)) {
        const existingScoresMap = {};
        const scoresMap = {};
        
        response.data.forEach(scoreRecord => {
          console.log('Processing score record:', scoreRecord);
          
          // Extract subsection ID - handle different possible structures
          let subsectionId;
          if (scoreRecord.subsection && scoreRecord.subsection.id) {
            subsectionId = scoreRecord.subsection.id;
          } else if (scoreRecord.subsectionId) {
            subsectionId = scoreRecord.subsectionId;
          } else if (scoreRecord.subsection_id) {
            subsectionId = scoreRecord.subsection_id;
          }
          
          // Extract score value - handle different possible structures
          let scoreValue;
          if (scoreRecord.scoreCategory && scoreRecord.scoreCategory.scoreValue) {
            scoreValue = scoreRecord.scoreCategory.scoreValue;
          } else if (scoreRecord.scoreValue) {
            scoreValue = scoreRecord.scoreValue;
          } else if (scoreRecord.score_value) {
            scoreValue = scoreRecord.score_value;
          } else if (scoreRecord.score) {
            scoreValue = scoreRecord.score;
          }
          
          console.log(`Extracted - subsectionId: ${subsectionId}, scoreValue: ${scoreValue}`);
          
          if (subsectionId && scoreValue) {
            existingScoresMap[subsectionId] = scoreValue;
            scoresMap[subsectionId] = scoreValue;
          }
        });
        
        console.log('Final existing scores map:', existingScoresMap);
        console.log('Final scores map:', scoresMap);
        
        setExistingScores(existingScoresMap);
        setScores(scoresMap);
        
        // Persist the loaded data
        await persistData(EXISTING_SCORES_STORAGE_KEY, existingScoresMap);
        await persistData(SCORES_STORAGE_KEY, scoresMap);
        
      } else {
        console.log('No existing scores found in response or invalid response structure');
      }
    } catch (error) {
      console.error('Error loading existing scores:', error);
      // Don't show error to user as this might be expected (no previous scores)
    }
  };

  const fetchSubsections = async () => {
    try {
      const response = await fetch(`http://3.6.143.181:8501/api/sections/${sectionId}/subsections`);
      const data = await response.json();
      
      if (response.ok) {
        setSubsections(data);
        console.log('Fetched subsections:', data.length);
      } else {
        throw new Error('Failed to fetch subsections');
      }
    } catch (error) {
      console.error('Error fetching subsections:', error);
      Alert.alert(
        'Error', 
        'Failed to load assessment categories. Please check your connection and try again.',
        [
          { text: 'Retry', onPress: fetchSubsections },
          { text: 'Cancel', onPress: () => navigation.goBack() }
        ]
      );
    }
  };

  const fetchScoreDescriptions = async (subsectionId) => {
    // Don't fetch if already loading or already have descriptions
    if (loadingDescriptions[subsectionId] || scoreDescriptions[subsectionId]) {
      return;
    }

    try {
      setLoadingDescriptions(prev => ({ ...prev, [subsectionId]: true }));
      
      const response = await fetch(`http://3.6.143.181:8501/api/subsections/${subsectionId}/score-descriptions`);
      const data = await response.json();
      
      if (response.ok) {
        // Transform the API response into the format expected by the component
        const descriptionsMap = {};
        data.forEach(item => {
          descriptionsMap[item.scoreValue] = {
            text: getScoreTextByValue(item.scoreValue),
            color: getScoreColorByValue(item.scoreValue),
            icon: getScoreIconByValue(item.scoreValue),
            description: item.description
          };
        });
        
        setScoreDescriptions(prev => ({
          ...prev,
          [subsectionId]: descriptionsMap
        }));
      } else {
        throw new Error('Failed to fetch score descriptions');
      }
    } catch (error) {
      console.error('Error fetching score descriptions:', error);
      // Use fallback descriptions if API fails
      setScoreDescriptions(prev => ({
        ...prev,
        [subsectionId]: getDefaultScoreDescriptions()
      }));
    } finally {
      setLoadingDescriptions(prev => ({ ...prev, [subsectionId]: false }));
    }
  };

  // Helper functions to get score properties by value
  const getScoreTextByValue = (scoreValue) => {
    switch (scoreValue) {
      case 1: return 'Bad Practice';
      case 2: return 'Needs Improvement';
      case 3: return 'Good Practice';
      default: return 'Not Assessed';
    }
  };

  const getScoreColorByValue = (scoreValue) => {
    switch (scoreValue) {
      case 1: return '#EF4444';
      case 2: return '#F59E0B';
      case 3: return '#10B981';
      default: return '#6B7280';
    }
  };

  const getScoreIconByValue = (scoreValue) => {
    switch (scoreValue) {
      case 1: return XCircle;
      case 2: return AlertCircle;
      case 3: return CheckCircle;
      default: return Camera;
    }
  };

  // Fallback descriptions in case API fails
  const getDefaultScoreDescriptions = () => ({
    1: {
      text: 'Bad Practice',
      color: '#EF4444',
      icon: XCircle,
      description: 'No Description available.'
    },
    2: {
      text: 'Needs Improvement',
      color: '#F59E0B',
      icon: AlertCircle,
      description: 'No Description available.'
    },
    3: {
      text: 'Good Practice',
      color: '#10B981',
      icon: CheckCircle,
      description: 'No Description available.'
    }
  });

  const submitScore = async (subsectionId, scoreValue) => {
    if (!userId) {
      Alert.alert('Error', 'User ID is required to submit scores.');
      return;
    }

    try {
      setSubmitting(prev => ({ ...prev, [subsectionId]: true }));
      
      const response = await fetch('http://3.6.143.181:8501/api/scores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          subsectionId: subsectionId,
          scoreValue: scoreValue
        }),
      });

      if (response.ok) {
        const isUpdate = existingScores[subsectionId] !== undefined;
        Alert.alert('Success', isUpdate ? 'Score updated successfully!' : 'Score submitted successfully!');
        
        // Update local scores state
        const newScores = { ...scores, [subsectionId]: scoreValue };
        const newExistingScores = { ...existingScores, [subsectionId]: scoreValue };
        
        setScores(newScores);
        setExistingScores(newExistingScores);
        
        // Persist the updated scores
        await persistData(SCORES_STORAGE_KEY, newScores);
        await persistData(EXISTING_SCORES_STORAGE_KEY, newExistingScores);
        
        console.log('Score submitted and persisted:', { subsectionId, scoreValue });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit score');
      }
    } catch (error) {
      console.error('Error submitting score:', error);
      Alert.alert('Error', 'Failed to submit score. Please try again.');
    } finally {
      setSubmitting(prev => ({ ...prev, [subsectionId]: false }));
    }
  };

  // Icon mapping for different subsection types
  const getIconForSubsection = (name) => {
    const nameLower = name.toLowerCase();
    if (nameLower.includes('flooring')) return Home;
    if (nameLower.includes('roofing')) return Shield;
    if (nameLower.includes('space')) return Home;
    if (nameLower.includes('airflow') || nameLower.includes('ventilation')) return Wind;
    if (nameLower.includes('drainage')) return Droplets;
    if (nameLower.includes('waste')) return Trash2;
    return Home; // Default icon
  };

  const getScoreColor = (score) => {
    return getScoreColorByValue(score);
  };

  const getScoreText = (score) => {
    return getScoreTextByValue(score);
  };

  const getScoreIcon = (score) => {
    return getScoreIconByValue(score);
  };

  const getScoreDescription = (score, subsectionId) => {
    const descriptions = scoreDescriptions[subsectionId];
    return descriptions?.[score]?.description || 'No description available';
  };

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));

    // Fetch score descriptions when section is expanded
    if (!expandedSections[sectionId]) {
      fetchScoreDescriptions(sectionId);
    }
  };

  const handleImageUpload = async (subsection) => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'This app needs access to your camera to take photos.',
            buttonPositive: 'OK',
            buttonNegative: 'Cancel',
          },
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permission Denied', 'You cannot use the camera without permission.');
          return;
        }
      } catch (err) {
        console.warn(err);
        return;
      }
    }

    const subsectionId = subsection.id;
    
    const options = {
      mediaType: 'photo',
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
      quality: 0.8,
      saveToPhotos: true,
    };

    launchCamera(options, async (response) => {
      if (response.didCancel) {
        console.log('User cancelled camera');
        return;
      }
      if (response.errorCode) {
        Alert.alert('Camera Error', response.errorMessage);
        return;
      }

      if (response.assets && response.assets[0]) {
        const imageUri = response.assets[0].uri;
        
        // Update uploaded images immediately and persist
        const newImages = { ...uploadedImages, [subsectionId]: imageUri };
        setUploadedImages(newImages);
        await persistData(IMAGES_STORAGE_KEY, newImages);
        
        console.log('Image uploaded and persisted for subsection:', subsectionId);
      }
    });
  };

  // Helper function to get default description by score value
  const getDefaultScoreDescription = (scoreValue) => {
    switch (scoreValue) {
      case 1: return 'No description available.';
      case 2: return 'No description available.';
      case 3: return 'No description available.';
      default: return 'No description available';
    }
  };

  const ScoreSelector = ({ subsection }) => {
    const [selectedScore, setSelectedScore] = useState(scores[subsection.id] || null);
    const isSubmitting = submitting[subsection.id];
    const hasExistingScore = existingScores[subsection.id] !== undefined;
    
    // Update selected score when scores state changes
    useEffect(() => {
      const currentScore = scores[subsection.id];
      console.log(`ScoreSelector for subsection ${subsection.id}: currentScore = ${currentScore}`);
      setSelectedScore(currentScore || null);
    }, [scores, subsection.id]);
    
    // Use default descriptions if API data isn't loaded yet
    const subsectionDescriptions = scoreDescriptions[subsection.id] || getDefaultScoreDescriptions();
    const isLoadingDescriptions = loadingDescriptions[subsection.id];

    const handleScoreSelect = (score) => {
      console.log(`Score selected for subsection ${subsection.id}: ${score}`);
      setSelectedScore(score);
    };

    const handleSubmit = () => {
      if (selectedScore) {
        submitScore(subsection.id, selectedScore);
      } else {
        Alert.alert('Error', 'Please select a score before submitting.');
      }
    };

    if (isLoadingDescriptions) {
      return (
        <View style={styles.scoreSelector}>
          <View style={styles.loadingDescriptions}>
            <ActivityIndicator size="small" color="#8B5CF6" />
            <Text style={styles.loadingDescriptionsText}>Loading score descriptions...</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.scoreSelector}>
        <View style={styles.scoreSelectorHeader}>
          <Text style={styles.scoreSelectorTitle}>Rate this category:</Text>
          {hasExistingScore && (
            <View style={styles.existingScoreIndicator}>
              <Edit color="#8B5CF6" size={16} strokeWidth={2} />
              <Text style={styles.existingScoreText}>Previously scored</Text>
            </View>
          )}
        </View>
        
        {[1, 2, 3].map((score) => {
          const isSelected = selectedScore === score;
          const scoreInfo = subsectionDescriptions[score];
          
          // Ensure we always have the correct icon, text, and color
          const ScoreIcon = scoreInfo?.icon || getScoreIconByValue(score);
          const scoreText = scoreInfo?.text || getScoreTextByValue(score);
          const scoreColor = scoreInfo?.color || getScoreColorByValue(score);
          const scoreDescription = scoreInfo?.description || getDefaultScoreDescription(score);
          
          return (
            <TouchableOpacity
              key={score}
              style={[
                styles.scoreOption,
                isSelected && { 
                  backgroundColor: scoreColor + '20', 
                  borderColor: scoreColor 
                }
              ]}
              onPress={() => handleScoreSelect(score)}
              activeOpacity={0.7}
            >
              <View style={styles.scoreOptionHeader}>
                <View style={[styles.scoreOptionIcon, { backgroundColor: scoreColor }]}>
                  <ScoreIcon color="#fff" size={20} strokeWidth={2} />
                </View>
                <View style={styles.scoreOptionInfo}>
                  <Text style={[
                    styles.scoreOptionText, 
                    isSelected && { color: scoreColor }
                  ]}>
                    {scoreText}
                  </Text>
                  <Text style={styles.scoreOptionValue}>Score: {score}</Text>
                </View>
                <View style={[
                  styles.radioButton, 
                  isSelected && { backgroundColor: scoreColor }
                ]}>
                  {isSelected && <View style={styles.radioButtonInner} />}
                </View>
              </View>
              <Text style={styles.scoreOptionDescription}>
                {scoreDescription}
              </Text>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity
          style={[
            styles.submitButton,
            (!selectedScore || isSubmitting) && styles.submitButtonDisabled
          ]}
          onPress={handleSubmit}
          disabled={!selectedScore || isSubmitting}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={
              selectedScore && !isSubmitting 
                ? ['#8B5CF6', '#7C3AED'] 
                : ['#9CA3AF', '#6B7280']
            }
            style={styles.submitGradient}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                {hasExistingScore ? <Edit color="#fff" size={20} strokeWidth={2} /> : <Send color="#fff" size={20} strokeWidth={2} />}
                <Text style={styles.submitButtonText}>
                  {hasExistingScore ? 'Update Score' : 'Submit Score'}
                </Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  };

  const CategoryCard = ({ subsection, index }) => {
    const isExpanded = expandedSections[subsection.id];
    const hasImage = uploadedImages[subsection.id];
    const score = scores[subsection.id];
    const hasExistingScore = existingScores[subsection.id] !== undefined;
    const SubsectionIcon = getIconForSubsection(subsection.name);
    const ScoreIcon = getScoreIcon(score);

    console.log(`CategoryCard for ${subsection.name} (ID: ${subsection.id}): score = ${score}, hasExistingScore = ${hasExistingScore}`);

    return (
      <View style={styles.categoryCard}>
        <TouchableOpacity
          style={styles.categoryHeader}
          onPress={() => toggleSection(subsection.id)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#334155', '#475569']}
            style={styles.categoryHeaderGradient}
          >
            <View style={styles.categoryHeaderContent}>
              <View style={styles.categoryLeft}>
                <View style={styles.categoryIcon}>
                  <SubsectionIcon color="#fff" size={20} strokeWidth={2} />
                </View>
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryTitle}>
                    {subsection.name}
                  </Text>
                  {hasExistingScore && (
                    <Text style={styles.categorySubtitle}>Previously assessed</Text>
                  )}
                </View>
              </View>
              <View style={styles.categoryRight}>
                {score && (
                  <View style={[styles.scoreIndicator, { backgroundColor: getScoreColor(score) }]}>
                    <ScoreIcon color="#fff" size={16} strokeWidth={2} />
                  </View>
                )}
                <View style={styles.chevronIcon}>
                  {isExpanded ? (
                    <ChevronUp color="#fff" size={20} strokeWidth={2} />
                  ) : (
                    <ChevronDown color="#fff" size={20} strokeWidth={2} />
                  )}
                </View>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.categoryContent}>
            {subsection.description && (
              <Text style={styles.categoryDescription}>{subsection.description}</Text>
            )}

            <View style={styles.uploadSection}>
              {hasImage ? (
                <View style={styles.imageContainer}>
                  <Image source={{ uri: hasImage }} style={styles.uploadedImage} />
                  <View style={styles.imageOverlay}>
                    <TouchableOpacity
                      style={styles.retakeButton}
                      onPress={() => handleImageUpload(subsection)}
                    >
                      <Camera color="#fff" size={16} strokeWidth={2} />
                      <Text style={styles.retakeText}>Retake</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={() => handleImageUpload(subsection)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#8B5CF6', '#7C3AED']}
                    style={styles.uploadGradient}
                  >
                    <Upload color="#fff" size={24} strokeWidth={2} />
                    <Text style={styles.uploadText}>Upload Photo</Text>
                    <Text style={styles.uploadSubtext}>Take a photo to assess this category</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}

              <ScoreSelector subsection={subsection} />
            </View>
          </View>
        )}
      </View>
    );
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

      {/* Header */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <LinearGradient
          colors={['#0F172A', '#1E293B', '#334155']}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              activeOpacity={0.8}
            >
              <ChevronLeft color="#fff" size={24} strokeWidth={2} />
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {subsections.length > 0 ? subsections[0].section.name : 'Loading...'}
              </Text>
              {Object.keys(existingScores).length > 0 && (
                <Text style={styles.headerSubtitle}>
                  {Object.keys(existingScores).length} item(s) previously assessed
                </Text>
              )}
            </View>
            <View style={styles.headerSpacer} />
          </View>
        </LinearGradient>
      </Animated.View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 16 }} style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Assessment Categories</Text>
          <Text style={styles.sectionDescription}>
            Assess your infrastructure by uploading photos and selecting appropriate scores. Each category is scored from 1-3 based on best practices.
            {Object.keys(existingScores).length > 0 && ' You can update your previous assessments.'}
          </Text>

          {subsections.map((subsection, index) => (
            <CategoryCard key={subsection.id} subsection={subsection} index={index} />
          ))}
        </View>
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
  loadingDescriptions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingDescriptionsText: {
    fontSize: 14,
    color: '#64748B',
    marginLeft: 8,
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
    paddingLeft: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 48,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 30,
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
  categoryCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  categoryHeader: {
    overflow: 'hidden',
  },
  categoryHeaderGradient: {
    padding: 0,
  },
  categoryHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    padding: 8,
    marginRight: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  categorySubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  categoryRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreIndicator: {
    borderRadius: 12,
    padding: 6,
    marginRight: 8,
  },
  chevronIcon: {
    padding: 4,
  },
  categoryContent: {
    padding: 20,
    backgroundColor: '#fff',
  },
  categoryDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 16,
  },
  uploadSection: {
    alignItems: 'center',
  },
  uploadButton: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  uploadGradient: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  uploadText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  uploadSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  imageContainer: {
    width: '100%',
    marginBottom: 16,
    position: 'relative',
  },
  uploadedImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  imageOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  retakeButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  retakeText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  scoreSelector: {
    width: '100%',
    marginTop: 16,
  },
  scoreSelectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  scoreSelectorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  existingScoreIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  existingScoreText: {
    fontSize: 12,
    color: '#8B5CF6',
    marginLeft: 4,
    fontWeight: '500',
  },
  scoreOption: {
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  scoreOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  scoreOptionIcon: {
    borderRadius: 8,
    padding: 8,
    marginRight: 12,
  },
  scoreOptionInfo: {
    flex: 1,
  },
  scoreOptionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  scoreOptionValue: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  scoreOptionDescription: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginLeft: 52,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitGradient: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
});

export default InfraScreen;