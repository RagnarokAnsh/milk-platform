import React, { useState, useRef, useEffect } from 'react';
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
  ArrowLeft,
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
} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';

const { width, height } = Dimensions.get('window');

const InfraScreen = ({ navigation, route }) => {
  const { userId, sectionId = 1 } = route.params || {};

  const [subsections, setSubsections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState({});
  const [uploadedImages, setUploadedImages] = useState({});
  const [scores, setScores] = useState({});
  const [submitting, setSubmitting] = useState({});
  
  // Track loading state per category instead of globally
  const [loadingCategories, setLoadingCategories] = useState({});

  // Animation values - simplified for smoother performance
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchSubsections();
    // Simplified initial animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [sectionId]);

  const fetchSubsections = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://192.168.21.241:8081/api/sections/${sectionId}/subsections`);
      const data = await response.json();
      
      if (response.ok) {
        setSubsections(data);
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
    } finally {
      setLoading(false);
    }
  };

  const submitScore = async (subsectionId, scoreValue) => {
    if (!userId) {
      Alert.alert('Error', 'User ID is required to submit scores.');
      return;
    }

    try {
      setSubmitting(prev => ({ ...prev, [subsectionId]: true }));
      
      const response = await fetch('http://192.168.21.241:8081/api/scores', {
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
        Alert.alert('Success', 'Score submitted successfully!');
        // Update local scores state
        setScores(prev => ({
          ...prev,
          [subsectionId]: scoreValue
        }));
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

  const scoreDescriptions = {
    1: {
      text: 'Bad Practice',
      color: '#EF4444',
      icon: XCircle,
      descriptions: {
        'CATTLE SHED FLOORING': 'Kachcha floor made of mud or small stones. Areas are wet or have waterlogged patches.',
        'CATTLE SHED ROOFING': 'Animals are tied in open without roof to protect from direct sunlight and rain.',
        'SPACE INSIDE THE CATTLE SHED': 'There is not enough space in the shed, resulting in overcrowded living in cramped and uncomfortable conditions.',
        'AIRFLOW AND VENTILATION IN CATTLE SHED': 'There is no or very minimal ventilation, leading to high heat and humidity, and foul odor inside the shed.',
        'DRAINAGE SYSTEM INSIDE THE CATTLE SHED': 'No drainage inside the shed, leading to waterlogging and lots of flies.',
        'WASTE MANAGEMENT': 'Lack a dung pit or organized system for waste and dung disposal. Dung and urine are scattered around the shed, attracting numerous flies.'
      }
    },
    2: {
      text: 'Needs Improvement',
      color: '#F59E0B',
      icon: AlertCircle,
      descriptions: {
        'CATTLE SHED FLOORING': 'Floor has some slippery areas but mostly adequate grip.',
        'CATTLE SHED ROOFING': 'Roof height is low, with lowest point being less than 8 feet.',
        'SPACE INSIDE THE CATTLE SHED': 'Space is limited but animals can move with some restrictions.',
        'AIRFLOW AND VENTILATION IN CATTLE SHED': 'Limited provision for cross ventilation, leading to foul odor in the shed.',
        'DRAINAGE SYSTEM INSIDE THE CATTLE SHED': 'The shed has a drain, but wastewater is not properly drained out, leading to waterlogging.',
        'WASTE MANAGEMENT': 'The dung pit is constructed but poorly maintained. It is exposed or leaking, hindering drainage, and serving as a breeding ground for flies.'
      }
    },
    3: {
      text: 'Good Practice',
      color: '#10B981',
      icon: CheckCircle,
      descriptions: {
        'CATTLE SHED FLOORING': 'Concrete floor with rubber mats to ensure adequate grip.',
        'CATTLE SHED ROOFING': 'Roof is high enough for animals and provides excellent protection being more than 10-12 feet.',
        'SPACE INSIDE THE CATTLE SHED': 'There is sufficient space in the shed and animals are staying in comfortable conditions.',
        'AIRFLOW AND VENTILATION IN CATTLE SHED': 'Properly ventilated shed with adequate airflow, leading to low humidity, temperature, and no foul odor in the shed.',
        'DRAINAGE SYSTEM INSIDE THE CATTLE SHED': 'The shed has proper drain that allows all wastewater to flow out easily, preventing any waterlogging in the shed.',
        'WASTE MANAGEMENT': 'A concrete dung pit or biogas production structure is properly constructed and maintained. Drains are free from waterlogging.'
      }
    }
  };

  const getScoreColor = (score) => {
    return scoreDescriptions[score]?.color || '#6B7280';
  };

  const getScoreText = (score) => {
    return scoreDescriptions[score]?.text || 'Not Assessed';
  };

  const getScoreIcon = (score) => {
    return scoreDescriptions[score]?.icon || Camera;
  };

  const getScoreDescription = (score, subsectionName) => {
    return scoreDescriptions[score]?.descriptions[subsectionName] || 'No description available';
  };

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
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

    launchCamera(options, (response) => {
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
        
        // Update uploaded images immediately
        setUploadedImages(prev => ({
          ...prev,
          [subsectionId]: imageUri
        }));
      }
    });
  };

  const ScoreSelector = ({ subsection }) => {
    const [selectedScore, setSelectedScore] = useState(scores[subsection.id] || null);
    const isSubmitting = submitting[subsection.id];

    const handleScoreSelect = (score) => {
      setSelectedScore(score);
    };

    const handleSubmit = () => {
      if (selectedScore) {
        submitScore(subsection.id, selectedScore);
      } else {
        Alert.alert('Error', 'Please select a score before submitting.');
      }
    };

    return (
      <View style={styles.scoreSelector}>
        <Text style={styles.scoreSelectorTitle}>Rate this category:</Text>
        
        {[1, 2, 3].map((score) => {
          const isSelected = selectedScore === score;
          const scoreInfo = scoreDescriptions[score];
          const ScoreIcon = scoreInfo.icon;
          
          return (
            <TouchableOpacity
              key={score}
              style={[
                styles.scoreOption,
                isSelected && { backgroundColor: scoreInfo.color + '20', borderColor: scoreInfo.color }
              ]}
              onPress={() => handleScoreSelect(score)}
              activeOpacity={0.7}
            >
              <View style={styles.scoreOptionHeader}>
                <View style={[styles.scoreOptionIcon, { backgroundColor: scoreInfo.color }]}>
                  <ScoreIcon color="#fff" size={20} strokeWidth={2} />
                </View>
                <View style={styles.scoreOptionInfo}>
                  <Text style={[styles.scoreOptionText, isSelected && { color: scoreInfo.color }]}>
                    {scoreInfo.text}
                  </Text>
                  <Text style={styles.scoreOptionValue}>Score: {score}</Text>
                </View>
                <View style={[styles.radioButton, isSelected && { backgroundColor: scoreInfo.color }]}>
                  {isSelected && <View style={styles.radioButtonInner} />}
                </View>
              </View>
              <Text style={styles.scoreOptionDescription}>
                {getScoreDescription(score, subsection.name)}
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
                <Send color="#fff" size={20} strokeWidth={2} />
                <Text style={styles.submitButtonText}>Submit Score</Text>
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
    const SubsectionIcon = getIconForSubsection(subsection.name);
    const ScoreIcon = getScoreIcon(score);

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
              <ArrowLeft color="#fff" size={24} strokeWidth={2} />
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Infrastructure Assessment</Text>
              <Text style={styles.headerSubtitle}>
                {subsections.length > 0 ? subsections[0].section.name : 'Loading...'}
              </Text>
            </View>
            <View style={styles.headerSpacer} />
          </View>
        </LinearGradient>
      </Animated.View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Assessment Categories</Text>
          <Text style={styles.sectionDescription}>
            Assess your infrastructure by uploading photos and selecting appropriate scores. Each category is scored from 1-3 based on best practices.
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
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 2,
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
  scoreSelectorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 12,
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