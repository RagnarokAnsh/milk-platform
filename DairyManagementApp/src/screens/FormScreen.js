import React, { useState } from 'react';
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
} from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { submitCowInfo, submitBuffaloInfo } from '../api';

const FormScreen = ({ route, navigation }) => {
  const userId = route.params?.userId;

  if (!userId) {
    Alert.alert('Error', 'User ID is missing. Please log in again.');
    navigation.goBack();
    return null; 
  }

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

  const renderBreedInputs = (type) => {
    const data = type === 'cow' ? cowData : buffaloData;
    return data.breeds.map((breed, index) => (
      <View key={index} style={styles.breedRow}>
        <Text style={styles.breedLabel}>{breed.name}</Text>
        <TextInput
          style={styles.breedInput}
          placeholder={`Count for ${breed.name}`}
          keyboardType="numeric"
          value={breed.count}
          onChangeText={(text) => handleBreedChange(type, index, text)}
        />
      </View>
    ));
  };

  const InputRow = ({ label, value, onChangeText }) => (
    <View style={styles.inputRow}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholder={`Total ${label}`}
        value={value}
        onChangeText={onChangeText}
        keyboardType="numeric"
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft color="#333" size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Livestock Data</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Cow Ownership</Text>
          <InputRow label="Total Cows" value={cowData.total} onChangeText={(v) => handleCowChange('total', v)} />
          <InputRow label="Milking Cows" value={cowData.milking} onChangeText={(v) => handleCowChange('milking', v)} />
          <InputRow label="Dry Cows" value={cowData.dry} onChangeText={(v) => handleCowChange('dry', v)} />
          <InputRow label="Calves & Heifers" value={cowData.calvesHeifers} onChangeText={(v) => handleCowChange('calvesHeifers', v)} />
          <Text style={styles.subHeader}>Cow Breeds</Text>
          {renderBreedInputs('cow')}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Buffalo Ownership</Text>
          <InputRow label="Total Buffaloes" value={buffaloData.total} onChangeText={(v) => handleBuffaloChange('total', v)} />
          <InputRow label="Milking Buffaloes" value={buffaloData.milking} onChangeText={(v) => handleBuffaloChange('milking', v)} />
          <InputRow label="Dry Buffaloes" value={buffaloData.dry} onChangeText={(v) => handleBuffaloChange('dry', v)} />
          <InputRow label="Calves & Heifers" value={buffaloData.calvesHeifers} onChangeText={(v) => handleBuffaloChange('calvesHeifers', v)} />
          <Text style={styles.subHeader}>Buffalo Breeds</Text>
          {renderBreedInputs('buffalo')}
        </View>

        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}>
          <Text style={styles.submitButtonText}>{isSubmitting ? 'Submitting...' : 'Submit All Data'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F8' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  backButton: { marginRight: 15 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1E293B' },
  scrollContainer: { padding: 16, paddingBottom: 100 },
  card: { backgroundColor: '#FFF', borderRadius: 12, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#2E7D32', marginBottom: 20 },
  subHeader: { fontSize: 16, fontWeight: '600', color: '#334155', marginTop: 15, marginBottom: 10 },
  inputRow: { marginBottom: 15 },
  label: { fontSize: 14, fontWeight: '500', color: '#475569', marginBottom: 8 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingHorizontal: 15, paddingVertical: 12, fontSize: 16, color: '#1E293B' },
  breedRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  breedLabel: { fontSize: 16, color: '#334155', flex: 1 },
  breedInput: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingHorizontal: 15, paddingVertical: 10, fontSize: 16, color: '#1E293B', width: 120, textAlign: 'center' },
  submitButton: { backgroundColor: '#2E7D32', paddingVertical: 15, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  submitButtonDisabled: { backgroundColor: '#A5D6A7' },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default FormScreen;