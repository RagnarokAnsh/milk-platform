import React, { useState, useEffect, useRef } from 'react';
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
  Animated,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useIsFocused } from '@react-navigation/native';
import { 
  ChevronLeft, 
  MapPin, 
  Users, 
  Phone, 
  Calendar,
  X,
  Navigation,
  Layers,
  Filter
} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import { getUsersList } from '../api';

const { width, height } = Dimensions.get('window');

const MapScreen = ({ navigation }) => {
  const [users, setUsers] = useState([]);
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [webViewKey, setWebViewKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [mapType, setMapType] = useState('standard');
  const [showMapControls, setShowMapControls] = useState(false);
  const isFocused = useIsFocused();

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const modalAnim = useRef(new Animated.Value(0)).current;
  const loadingAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isFocused) {
      loadUsersData();
    }
  }, [isFocused]);

  useEffect(() => {
    if (!loading) {
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
    }
  }, [loading]);

  useEffect(() => {
    // Loading animation
    const loadingAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(loadingAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(loadingAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    if (loading) {
      loadingAnimation.start();
    } else {
      loadingAnimation.stop();
    }

    return () => loadingAnimation.stop();
  }, [loading]);

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
      setWebViewKey(prev => prev + 1);
    }
  };

  const generateMapHTML = () => {
    const markers = users.map((user, index) => ({
      lat: user.latitude,
      lng: user.longitude,
      popup: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; min-width: 220px; max-width: 300px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 16px; margin: -12px -12px 12px -12px; border-radius: 8px 8px 0 0;">
            <h3 style="margin: 0; color: white; font-size: 16px; font-weight: 600;">${user.firstName} ${user.surname}</h3>
            <p style="margin: 4px 0 0 0; color: rgba(255,255,255,0.8); font-size: 12px; font-weight: 500;">ID: ${user.registrationId}</p>
          </div>
          <div style="padding: 0 4px;">
            <div style="display: flex; align-items: center; margin: 8px 0; color: #374151; font-size: 13px;">
              <span style="margin-right: 8px; font-weight: 600;">📍</span>
              <span>${user.village}, ${user.block}</span>
            </div>
            <div style="display: flex; align-items: center; margin: 8px 0; color: #374151; font-size: 13px;">
              <span style="margin-right: 8px; font-weight: 600;">📞</span>
              <span>${user.contactNumber}</span>
            </div>
            <button 
              onclick="showDetails(${index})" 
              style="
                background: linear-gradient(135deg, #10B981, #059669); 
                color: white; 
                border: none; 
                padding: 8px 16px; 
                border-radius: 8px; 
                margin-top: 12px; 
                cursor: pointer; 
                font-weight: 600;
                font-size: 13px;
                width: 100%;
                transition: all 0.2s ease;
              "
              onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 12px rgba(16,185,129,0.3)'"
              onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'"
            >
              View Details
            </button>
          </div>
        </div>
      `,
    }));

    const tileLayer = mapType === 'satellite' 
      ? "L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}')"
      : "L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')";

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        html, body, #map { 
          height: 100%; 
          margin: 0; 
          padding: 0; 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .leaflet-control-attribution { display: none !important; }
        .leaflet-popup-content-wrapper {
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.15);
          border: none;
        }
        .leaflet-popup-content {
          margin: 12px;
        }
        .leaflet-popup-tip {
          background: white;
          border: none;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .custom-marker {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map', {
          zoomControl: false,
          attributionControl: false
        }).setView([${mapCenter[0]}, ${mapCenter[1]}], 5);
        
        ${tileLayer}.addTo(map);
        
        // Add zoom control to bottom right
        L.control.zoom({
          position: 'bottomright'
        }).addTo(map);
        
        var markers = ${JSON.stringify(markers)};
        
        // Custom marker icon
        var customIcon = L.divIcon({
          className: 'custom-marker',
          iconSize: [12, 12],
          iconAnchor: [6, 6]
        });
        
        if (markers.length > 0) {
          var bounds = [];
          markers.forEach(function(marker, index) {
            var leafletMarker = L.marker([marker.lat, marker.lng], {
              icon: customIcon
            }).addTo(map).bindPopup(marker.popup, {
              maxWidth: 300,
              className: 'custom-popup'
            });
            bounds.push([marker.lat, marker.lng]);
          });
          
          if (bounds.length > 1) {
            map.fitBounds(bounds, { 
              padding: [20, 20], 
              maxZoom: 12 
            });
          } else {
            map.setView(bounds[0], 10);
          }
        }
        
        function showDetails(index) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ 
            action: 'showDetails', 
            index: index 
          }));
        }
      </script>
    </body>
    </html>`;
  };

  const handleWebViewMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.action === 'showDetails') {
        setSelectedUser(users[data.index]);
        setModalVisible(true);
        
        // Modal entrance animation
        Animated.spring(modalAnim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }).start();
      }
    } catch (error) {
      console.error('Error handling webview message:', error);
    }
  };

  const closeModal = () => {
    Animated.timing(modalAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setModalVisible(false);
      setSelectedUser(null);
    });
  };

  const Header = () => (
    <Animated.View
      style={[
        styles.header,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.8}
          >
            <ChevronLeft color="#fff" size={24} strokeWidth={2} />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Location Map</Text>
            <Text style={styles.headerSubtitle}>
              {users.length} location{users.length !== 1 ? 's' : ''} found
            </Text>
          </View>
          
          <TouchableOpacity
            onPress={() => setShowMapControls(!showMapControls)}
            style={styles.controlButton}
            activeOpacity={0.8}
          >
            <Layers color="#fff" size={20} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Animated.View>
  );

  const MapControls = () => (
    showMapControls && (
      <Animated.View
        style={[
          styles.mapControlsContainer,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <View style={styles.mapControls}>
          <TouchableOpacity
            style={[styles.mapTypeButton, mapType === 'standard' && styles.activeMapType]}
            onPress={() => {
              setMapType('standard');
              setWebViewKey(prev => prev + 1);
            }}
            activeOpacity={0.8}
          >
            <Text style={[styles.mapTypeText, mapType === 'standard' && styles.activeMapTypeText]}>
              Standard
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.mapTypeButton, mapType === 'satellite' && styles.activeMapType]}
            onPress={() => {
              setMapType('satellite');
              setWebViewKey(prev => prev + 1);
            }}
            activeOpacity={0.8}
          >
            <Text style={[styles.mapTypeText, mapType === 'satellite' && styles.activeMapTypeText]}>
              Satellite
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    )
  );

  const LoadingScreen = () => (
    <SafeAreaView style={styles.container}>
      <Header />
      <View style={styles.loadingContainer}>
        <Animated.View
          style={[
            styles.loadingContent,
            {
              opacity: loadingAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.5, 1],
              }),
              transform: [
                {
                  scale: loadingAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.95, 1.05],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.loadingIconContainer}>
            <MapPin color="#667eea" size={48} strokeWidth={1.5} />
          </View>
          <ActivityIndicator size="large" color="#667eea" style={styles.loadingSpinner} />
          <Text style={styles.loadingText}>Loading Locations...</Text>
          <Text style={styles.loadingSubtext}>Fetching dairy locations from server</Text>
        </Animated.View>
      </View>
    </SafeAreaView>
  );

  const EmptyState = () => (
    <SafeAreaView style={styles.container}>
      <Header />
      <View style={styles.emptyContainer}>
        <View style={styles.emptyContent}>
          <View style={styles.emptyIconContainer}>
            <MapPin color="#94A3B8" size={64} strokeWidth={1} />
          </View>
          <Text style={styles.emptyTitle}>No Locations Found</Text>
          <Text style={styles.emptySubtitle}>
            No users with location data were found. Please ensure GPS data is available.
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadUsersData}
            activeOpacity={0.8}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );

  if (loading) return <LoadingScreen />;
  if (users.length === 0) return <EmptyState />;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      
      <Header />
      <MapControls />
      
      <Animated.View
        style={[
          styles.mapContainer,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <WebView
          key={webViewKey}
          originWhitelist={['*']}
          source={{ html: generateMapHTML() }}
          style={styles.webview}
          onMessage={handleWebViewMessage}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.webviewLoading}>
              <ActivityIndicator size="large" color="#667eea" />
            </View>
          )}
        />
      </Animated.View>

      {/* Enhanced Modal */}
      {selectedUser && (
        <Modal
          animationType="none"
          transparent={true}
          visible={modalVisible}
          onRequestClose={closeModal}
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity
              style={styles.modalBackdrop}
              activeOpacity={1}
              onPress={closeModal}
            />
            
            <Animated.View
              style={[
                styles.modalContainer,
                {
                  opacity: modalAnim,
                  transform: [
                    {
                      translateY: modalAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [300, 0],
                      }),
                    },
                    {
                      scale: modalAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.9, 1],
                      }),
                    },
                  ],
                },
              ]}
            >
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.modalHeader}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <View style={styles.modalHeaderContent}>
                  <View>
                    <Text style={styles.modalTitle}>
                      {selectedUser.firstName} {selectedUser.surname}
                    </Text>
                    <Text style={styles.modalSubtitle}>
                      ID: {selectedUser.registrationId}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={closeModal}
                    style={styles.closeButton}
                    activeOpacity={0.8}
                  >
                    <X color="#fff" size={24} strokeWidth={2} />
                  </TouchableOpacity>
                </View>
              </LinearGradient>

              <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                <View style={styles.modalBody}>
                  <DetailRow
                    icon={Phone}
                    label="Contact Number"
                    value={selectedUser.contactNumber}
                  />
                  
                  <DetailRow
                    icon={Users}
                    label="Gender"
                    value={selectedUser.gender}
                  />
                  
                  <DetailRow
                    icon={Calendar}
                    label="Date of Birth"
                    value={new Date(selectedUser.dob).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  />
                  
                  <DetailRow
                    icon={MapPin}
                    label="Location"
                    value={`${selectedUser.village}, ${selectedUser.block}, ${selectedUser.district}`}
                  />
                </View>
              </ScrollView>
            </Animated.View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
};

const DetailRow = ({ icon: Icon, label, value }) => (
  <View style={styles.detailRow}>
    <View style={styles.detailIconContainer}>
      <Icon color="#667eea" size={20} strokeWidth={2} />
    </View>
    <View style={styles.detailTextContainer}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    overflow: 'hidden',
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 0 : 0,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
    fontWeight: '500',
  },
  controlButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 8,
  },
  mapControlsContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 120 : 100,
    right: 20,
    zIndex: 1000,
  },
  mapControls: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  mapTypeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginVertical: 2,
  },
  activeMapType: {
    backgroundColor: '#667eea',
  },
  mapTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  activeMapTypeText: {
    color: '#fff',
  },
  mapContainer: {
    flex: 1,
    margin: 20,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  webview: {
    flex: 1,
  },
  webviewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingIconContainer: {
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
  },
  loadingSpinner: {
    marginVertical: 20,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyContent: {
    alignItems: 'center',
  },
  emptyIconContainer: {
    backgroundColor: '#F1F5F9',
    borderRadius: 32,
    padding: 24,
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.7,
    overflow: 'hidden',
  },
  modalHeader: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  modalHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  closeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 8,
  },
  modalContent: {
    flex: 1,
  },
  modalBody: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  detailIconContainer: {
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginRight: 16,
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '600',
  },
});

export default MapScreen;