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
  Platform,
  Image,
  Modal,
  PermissionsAndroid,
  ActivityIndicator,
} from 'react-native';
import {
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
  Shield,
  Trash2,
  Send,
  X,
} from 'lucide-react-native';
import { launchCamera } from 'react-native-image-picker';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS, ANIMATIONS } from '../styles/globalStyles';
import ModernHeader from '../components/common/ModernHeader';
import AnimatedCard from '../components/common/AnimatedCard';
import AnimatedButton from '../components/common/AnimatedButton';
import LoadingSpinner from '../components/common/LoadingSpinner';

const InfraScreen = ({ navigation, route }) => {
  const { userId, sectionId = 1 } = route.params || {};

  const [subsections, setSubsections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState({});
  const [uploadedImages, setUploadedImages] = useState({});
  const [scores, setScores] = useState({});
  const [submitting, setSubmitting] = useState({});

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchSubsections();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: ANIMATIONS.timing.normal,
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

  const getIconForSubsection = (name) => {
    const nameLower = name.toLowerCase();
    if (nameLower.includes('flooring')) return Home;
    if (nameLower.includes('roofing')) return Shield;
    if (nameLower.includes('space')) return Home;
    if (nameLower.includes('airflow') || nameLower.includes('ventilation')) return Wind;
    if (nameLower.includes('drainage')) return Droplets;
    if (nameLower.includes('waste')) return Trash2;
    return Home;
  };

  const scoreDescriptions = {
    1: {
      text: 'Needs Improvement',
      color: COLORS.error[500],
      icon: XCircle,
      gradient: COLORS.gradients.error,
    },
    2: {
      text: 'Fair Practice',
      color: COLORS.warning[500],
      icon: AlertCircle,
      gradient: COLORS.gradients.warning,
    },
    3: {
      text: 'Best Practice',
      color: COLORS.success[500],
      icon: CheckCircle,
      gradient: COLORS.gradients.success,
    },
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
                isSelected && { 
                  borderColor: scoreInfo.color,
                  backgroundColor: `${scoreInfo.color}10`
                }
              ]}
              onPress={() => handleScoreSelect(score)}
              activeOpacity={0.7}
            >
              <View style={styles.scoreOptionContent}>
                <View style={[styles.scoreOptionIcon, { backgroundColor: scoreInfo.color }]}>
                  <ScoreIcon color={COLORS.text.inverse} size={20} strokeWidth={2} />
                </View>
                <View style={styles.scoreOptionInfo}>
                  <Text style={[styles.scoreOptionText, isSelected && { color: scoreInfo.color }]}>
                    {scoreInfo.text}
                  </Text>
                  <Text style={styles.scoreOptionValue}>Score: {score}</Text>
                </View>
                <View style={[
                  styles.radioButton, 
                  isSelected && { backgroundColor: scoreInfo.color, borderColor: scoreInfo.color }
                ]}>
                  {isSelected && <View style={styles.radioButtonInner} />}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}

        <AnimatedButton
          title={isSubmitting ? "Submitting..." : "Submit Score"}
          onPress={handleSubmit}
          disabled={!selectedScore || isSubmitting}
          icon={isSubmitting ? undefined : Send}
          variant="primary"
          style={styles.submitButton}
        />
      </View>
    );
  };

  const CategoryCard = ({ subsection, index }) => {
    const isExpanded = expandedSections[subsection.id];
    const hasImage = uploadedImages[subsection.id];
    const score = scores[subsection.id];
    const SubsectionIcon = getIconForSubsection(subsection.name);

    return (
      <AnimatedCard
        style={styles.categoryCard}
        delay={index * 100}
        animationType="fadeInUp"
      >
        <TouchableOpacity
          style={styles.categoryHeader}
          onPress={() => toggleSection(subsection.id)}
          activeOpacity={0.8}
        >
          <View style={styles.categoryHeaderContent}>
            <View style={styles.categoryLeft}>
              <View style={styles.categoryIcon}>
                <SubsectionIcon color={COLORS.primary[500]} size={20} strokeWidth={2} />
              </View>
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryTitle}>{subsection.name}</Text>
                {score && (
                  <Text style={[styles.categoryScore, { color: scoreDescriptions[score].color }]}>
                    {scoreDescriptions[score].text}
                  </Text>
                )}
              </View>
            </View>
            <View style={styles.categoryRight}>
              {isExpanded ? (
                <ChevronUp color={COLORS.text.secondary} size={20} strokeWidth={2} />
              ) : (
                <ChevronDown color={COLORS.text.secondary} size={20} strokeWidth={2} />
              )}
            </View>
          </View>
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
                  <TouchableOpacity
                    style={styles.retakeButton}
                    onPress={() => handleImageUpload(subsection)}
                    activeOpacity={0.8}
                  >
                    <Camera color={COLORS.text.inverse} size={16} strokeWidth={2} />
                    <Text style={styles.retakeText}>Retake</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <AnimatedButton
                  title="Upload Photo"
                  onPress={() => handleImageUpload(subsection)}
                  icon={Upload}
                  variant="secondary"
                  style={styles.uploadButton}
                />
              )}

              <ScoreSelector subsection={subsection} />
            </View>
          </View>
        )}
      </AnimatedCard>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary[600]} />
        <ModernHeader
          title="Infrastructure Assessment"
          subtitle="Loading..."
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
        title="Infrastructure Assessment"
        subtitle={subsections.length > 0 ? subsections[0].section.name : 'Assessment'}
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
          <Text style={styles.introTitle}>Assessment Categories</Text>
          <Text style={styles.introDescription}>
            Assess your infrastructure by uploading photos and selecting appropriate scores. Each category is scored from 1-3 based on best practices.
          </Text>
        </View>

        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {subsections.map((subsection, index) => (
            <CategoryCard key={subsection.id} subsection={subsection} index={index} />
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xl,
    paddingBottom: SPACING['4xl'],
  },
  categoryCard: {
    marginBottom: SPACING.lg,
    overflow: 'hidden',
  },
  categoryHeader: {
    padding: 0,
  },
  categoryHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    backgroundColor: COLORS.primary[50],
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginRight: SPACING.md,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  categoryScore: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  categoryRight: {
    padding: SPACING.xs,
  },
  categoryContent: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xl,
    borderTopWidth: 1,
    borderTopColor: COLORS.neutral[200],
  },
  categoryDescription: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.secondary,
    lineHeight: TYPOGRAPHY.lineHeight.normal * TYPOGRAPHY.fontSize.sm,
    marginBottom: SPACING.lg,
  },
  uploadSection: {
    gap: SPACING.lg,
  },
  uploadButton: {
    width: '100%',
  },
  imageContainer: {
    position: 'relative',
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  uploadedImage: {
    width: '100%',
    height: 200,
    borderRadius: BORDER_RADIUS.lg,
  },
  retakeButton: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  retakeText: {
    color: COLORS.text.inverse,
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  scoreSelector: {
    gap: SPACING.md,
  },
  scoreSelectorTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text.primary,
  },
  scoreOption: {
    borderWidth: 2,
    borderColor: COLORS.neutral[200],
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
  },
  scoreOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreOptionIcon: {
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    marginRight: SPACING.md,
  },
  scoreOptionInfo: {
    flex: 1,
  },
  scoreOptionText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text.primary,
  },
  scoreOptionValue: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.secondary,
    marginTop: SPACING.xs,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.neutral[300],
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.text.inverse,
  },
  submitButton: {
    marginTop: SPACING.md,
  },
});

export default InfraScreen;