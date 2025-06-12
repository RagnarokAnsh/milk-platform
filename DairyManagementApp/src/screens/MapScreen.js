import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useIsFocused } from '@react-navigation/native';
import { ChevronLeft } from 'lucide-react-native';
import { getUsersList } from '../api';

const MapScreen = ({ navigation }) => {
  const [users, setUsers] = useState([]);
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]); // Default center (India)
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [webViewKey, setWebViewKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      loadUsersData();
    }
  }, [isFocused]);

  const loadUsersData = async () => {
    setLoading(true);
    try {
      const response = await getUsersList();
      const fetchedUsers = response.data.filter(u => u.latitude && u.longitude);
      setUsers(fetchedUsers);
      if (fetchedUsers.length > 0) {
        setMapCenter([fetchedUsers[0].latitude, fetchedUsers[0].longitude]);
      }
    } catch (error) {
      console.error('Error loading users data:', error);
      Alert.alert('Error', 'Could not fetch user data. Please check your connection.');
    } finally {
      setLoading(false);
      setWebViewKey(prev => prev + 1); // Force webview refresh
    }
  };

  const generateMapHTML = () => {
    const markers = users.map((user, index) => ({
      lat: user.latitude,
      lng: user.longitude,
      popup: `
        <div style="font-family: Arial, sans-serif; min-width: 180px;">
          <h3 style="margin: 0 0 8px 0; color: #2E7D32;">${user.firstName} ${user.surname}</h3>
          <p style="margin: 2px 0;"><strong>Reg ID:</strong> ${user.registrationId}</p>
          <button onclick="showDetails(${index})" style="background: #2E7D32; color: white; border: none; padding: 5px 10px; border-radius: 4px; margin-top: 8px; cursor: pointer;">View Details</button>
        </div>
      `,
    }));

    return `
    <!DOCTYPE html><html><head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>html, body, #map { height: 100%; margin: 0; padding: 0; } .leaflet-control-attribution { display: none !important; }</style>
    </head><body><div id="map"></div>
    <script>
      var map = L.map('map').setView([${mapCenter[0]}, ${mapCenter[1]}], 5);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
      var markers = ${JSON.stringify(markers)};
      if (markers.length > 0) {
        var bounds = [];
        markers.forEach(function(marker, index) {
          var leafletMarker = L.marker([marker.lat, marker.lng]).addTo(map).bindPopup(marker.popup);
          bounds.push([marker.lat, marker.lng]);
        });
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
      }
      function showDetails(index) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ action: 'showDetails', index: index }));
      }
    </script>
    </body></html>`;
  };

  const handleWebViewMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.action === 'showDetails') {
        setSelectedUser(users[data.index]);
        setModalVisible(true);
      }
    } catch (error) {
      console.error('Error handling webview message:', error);
    }
  };

  const Header = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <ChevronLeft color="#333" size={28} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>User Map</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header />
        <View style={styles.center}><ActivityIndicator size="large" color="#2E7D32" /><Text style={styles.loadingText}>Loading User Locations...</Text></View>
      </SafeAreaView>
    );
  }
  
  if (users.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <Header />
        <View style={styles.center}>
          <Text>No users with location data found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <WebView
        key={webViewKey}
        originWhitelist={['*']}
        source={{ html: generateMapHTML() }}
        style={styles.webview}
        onMessage={handleWebViewMessage}
      />
      {selectedUser && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <ScrollView>
                <Text style={styles.modalTitle}>{selectedUser.firstName} {selectedUser.surname}</Text>
                <Text style={styles.modalText}><Text style={styles.boldText}>Reg ID: </Text>{selectedUser.registrationId}</Text>
                <Text style={styles.modalText}><Text style={styles.boldText}>Contact: </Text>{selectedUser.contactNumber}</Text>
                <Text style={styles.modalText}><Text style={styles.boldText}>Gender: </Text>{selectedUser.gender}</Text>
                <Text style={styles.modalText}><Text style={styles.boldText}>DOB: </Text>{new Date(selectedUser.dob).toLocaleDateString()}</Text>
                <Text style={styles.modalText}><Text style={styles.boldText}>Location: </Text>{`${selectedUser.village}, ${selectedUser.block}, ${selectedUser.district}`}</Text>
              </ScrollView>
              <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  backButton: { marginRight: 15 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1E293B' },
  webview: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10 },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalContent: { width: '90%', maxHeight: '80%', backgroundColor: 'white', borderRadius: 12, padding: 20, elevation: 10 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#2E7D32', marginBottom: 15, textAlign: 'center' },
  modalText: { fontSize: 16, marginBottom: 8, lineHeight: 24 },
  boldText: { fontWeight: 'bold' },
  closeButton: { backgroundColor: '#D32F2F', paddingVertical: 12, borderRadius: 8, marginTop: 20, alignItems: 'center' },
  closeButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});

export default MapScreen;