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
  Filter,
  Maximize2,
  Minimize2,
  Satellite,
  Map as MapIcon,
  Zap
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
  const [mapType, setMapType] = useState('modern');
  const [showMapControls, setShowMapControls] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isFocused = useIsFocused();

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const modalAnim = useRef(new Animated.Value(0)).current;
  const loadingAnim = useRef(new Animated.Value(0)).current;
  const controlsAnim = useRef(new Animated.Value(0)).current;

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

  useEffect(() => {
    Animated.timing(controlsAnim, {
      toValue: showMapControls ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [showMapControls]);

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

  const getMapTileLayer = () => {
    switch (mapType) {
      case 'satellite':
        return "L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { attribution: '' })";
      case 'dark':
        return "L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { attribution: '' })";
      case 'terrain':
        return "L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', { attribution: '' })";
      case 'modern':
      default:
        return "L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { attribution: '' })";
    }
  };

  const generateMapHTML = () => {
    const markers = users.map((user, index) => ({
      lat: user.latitude,
      lng: user.longitude,
      popup: `
        <div style="
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
          min-width: 280px; 
          max-width: 320px;
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          border: none;
        ">
          <div style="
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            padding: 20px; 
            position: relative;
            overflow: hidden;
          ">
            <div style="
              position: absolute;
              top: -50%;
              right: -50%;
              width: 100%;
              height: 100%;
              background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
            "></div>
            <h3 style="
              margin: 0; 
              color: white; 
              font-size: 18px; 
              font-weight: 700;
              letter-spacing: 0.5px;
            ">${user.firstName} ${user.surname}</h3>
          </div>
          <div style="padding: 20px;">
            <div style="
              display: flex; 
              align-items: center; 
              margin: 12px 0; 
              padding: 12px;
              background: #f8fafc;
              border-radius: 12px;
              border-left: 4px solid #667eea;
            ">
              <span style="
                margin-right: 12px; 
                font-size: 16px;
                background: #667eea;
                color: white;
                width: 28px;
                height: 28px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
              ">📍</span>
              <div>
                <div style="font-weight: 600; color: #1e293b; font-size: 14px;">${user.village}</div>
                <div style="color: #64748b; font-size: 12px;">${user.block}, ${user.district}</div>
              </div>
            </div>
            <div style="
              display: flex; 
              align-items: center; 
              margin: 12px 0; 
              padding: 12px;
              background: #f0fdf4;
              border-radius: 12px;
              border-left: 4px solid #10b981;
            ">
              <span style="
                margin-right: 12px; 
                font-size: 16px;
                background: #10b981;
                color: white;
                width: 28px;
                height: 28px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
              ">📞</span>
              <div>
                <div style="font-weight: 600; color: #1e293b; font-size: 14px;">Contact</div>
                <div style="color: #64748b; font-size: 12px;">${user.contactNumber}</div>
              </div>
            </div>
            <button 
              onclick="showDetails(${index})" 
              style="
                background: linear-gradient(135deg, #667eea, #764ba2); 
                color: white; 
                border: none; 
                padding: 14px 20px; 
                border-radius: 12px; 
                margin-top: 16px; 
                cursor: pointer; 
                font-weight: 600;
                font-size: 14px;
                width: 100%;
                transition: all 0.3s ease;
                box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
                position: relative;
                overflow: hidden;
              "
              onmouseover="
                this.style.transform='translateY(-2px)'; 
                this.style.boxShadow='0 8px 20px rgba(102, 126, 234, 0.4)';
              "
              onmouseout="
                this.style.transform='translateY(0)'; 
                this.style.boxShadow='0 4px 12px rgba(102, 126, 234, 0.3)';
              "
            >
              <span style="position: relative; z-index: 1;">View Full Details</span>
            </button>
          </div>
        </div>
      `,
    }));

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
          background: #f8fafc;
        }
        .leaflet-control-attribution { display: none !important; }
        .leaflet-popup-content-wrapper {
          border-radius: 16px;
          box-shadow: 0 25px 50px rgba(0,0,0,0.15);
          border: none;
          padding: 0;
          background: white;
        }
        .leaflet-popup-content {
          margin: 0;
          border-radius: 16px;
          overflow: hidden;
        }
        .leaflet-popup-tip {
          background: white;
          border: none;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .leaflet-popup-close-button {
          color: white !important;
          font-size: 24px !important;
          font-weight: bold !important;
          padding: 8px !important;
          background: rgba(0,0,0,0.2) !important;
          border-radius: 50% !important;
          width: auto !important;
          height: auto !important;
          text-align: center !important;
          line-height: 16px !important;
          top: 12px !important;
          right: 12px !important;
          transition: all 0.2s ease !important;
        }
        // .leaflet-popup-close-button:hover {
        //   background: rgba(0,0,0,0.4) !important;
        //   transform: scale(1.1) !important;
        // }
        .custom-marker {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: 4px solid white;
          border-radius: 50%;
          box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
          transition: all 0.3s ease;
        }
        .custom-marker:hover {
          transform: scale(1.2);
          box-shadow: 0 12px 30px rgba(102, 126, 234, 0.6);
        }
        .leaflet-control-zoom {
          border: none !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important;
        }
        .leaflet-control-zoom a {
          background: white !important;
          color: #667eea !important;
          border: none !important;
          border-radius: 8px !important;
          margin: 2px !important;
          font-weight: bold !important;
          transition: all 0.2s ease !important;
        }
        .leaflet-control-zoom a:hover {
          background: #667eea !important;
          color: white !important;
          transform: scale(1.05) !important;
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map', {
          zoomControl: false,
          attributionControl: false,
          preferCanvas: true,
          zoomAnimation: true,
          fadeAnimation: true,
          markerZoomAnimation: true
        }).setView([${mapCenter[0]}, ${mapCenter[1]}], 5);
        
        ${getMapTileLayer()}.addTo(map);
        
        // Add custom zoom control
        L.control.zoom({
          position: 'bottomright'
        }).addTo(map);
        
        var markers = ${JSON.stringify(markers)};
        
        // Enhanced custom marker icon
        var customIcon = L.divIcon({
          className: 'custom-marker',
          iconSize: [16, 16],
          iconAnchor: [8, 8],
          popupAnchor: [0, -8]
        });
        
        if (markers.length > 0) {
          var bounds = [];
          var markerGroup = L.featureGroup();
          
          markers.forEach(function(marker, index) {
            var leafletMarker = L.marker([marker.lat, marker.lng], {
              icon: customIcon,
              riseOnHover: true
            }).bindPopup(marker.popup, {
              maxWidth: 320,
              className: 'custom-popup',
              closeButton: true,
              autoClose: false,
              closeOnClick: false
            });
            
            markerGroup.addLayer(leafletMarker);
            bounds.push([marker.lat, marker.lng]);
          });
          
          markerGroup.addTo(map);
          
          if (bounds.length > 1) {
            map.fitBounds(bounds, { 
              padding: [30, 30], 
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
        
        // Add smooth animations
        map.on('zoomstart', function() {
          document.getElementById('map').style.transition = 'all 0.3s ease';
        });
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

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const mapTypes = [
    { id: 'modern', name: 'Modern', icon: MapIcon, gradient: ['#667eea', '#764ba2'] },
    { id: 'satellite', name: 'Satellite', icon: Satellite, gradient: ['#4facfe', '#00f2fe'] },
    { id: 'dark', name: 'Dark', gradient: ['#2c3e50', '#34495e'] },
    { id: 'terrain', name: 'Terrain', gradient: ['#56ab2f', '#a8e6cf'] },
  ];

  const Header = () => (
    !isFullscreen && (
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
              <Text style={styles.headerTitle}>Smart Location Map</Text>
              <Text style={styles.headerSubtitle}>
                {users.length} dairy location{users.length !== 1 ? 's' : ''} • Live tracking
              </Text>
            </View>
            
            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={toggleFullscreen}
                style={styles.actionButton}
                activeOpacity={0.8}
              >
                <Maximize2 color="#fff" size={18} strokeWidth={2} />
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => setShowMapControls(!showMapControls)}
                style={[styles.actionButton, showMapControls && styles.activeActionButton]}
                activeOpacity={0.8}
              >
                <Layers color="#fff" size={18} strokeWidth={2} />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    )
  );

  const MapControls = () => (
    <Animated.View
      style={[
        styles.mapControlsContainer,
        {
          opacity: controlsAnim,
          transform: [
            {
              translateY: controlsAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-20, 0],
              }),
            },
          ],
        },
      ]}
      pointerEvents={showMapControls ? 'auto' : 'none'}
    >
      <View style={styles.mapControls}>
        <Text style={styles.controlsTitle}>Map Style</Text>
        {mapTypes.map((type) => {
          const IconComponent = type.icon || MapIcon;
          return (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.mapTypeButton,
                mapType === type.id && styles.activeMapType
              ]}
              onPress={() => {
                setMapType(type.id);
                setWebViewKey(prev => prev + 1);
                setShowMapControls(false);
              }}
              activeOpacity={0.8}
            >
              {mapType === type.id && type.gradient && (
                <LinearGradient
                  colors={type.gradient}
                  style={StyleSheet.absoluteFillObject}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              )}
              <View style={styles.mapTypeContent}>
                {IconComponent && (
                  <IconComponent 
                    color={mapType === type.id ? '#fff' : '#64748B'} 
                    size={16} 
                    strokeWidth={2} 
                  />
                )}
                <Text style={[
                  styles.mapTypeText, 
                  mapType === type.id && styles.activeMapTypeText
                ]}>
                  {type.name}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </Animated.View>
  );

  const FloatingControls = () => (
    isFullscreen && (
      <View style={styles.floatingControls}>
        <TouchableOpacity
          onPress={toggleFullscreen}
          style={styles.floatingButton}
          activeOpacity={0.8}
        >
          <Minimize2 color="#fff" size={20} strokeWidth={2} />
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => setShowMapControls(!showMapControls)}
          style={[styles.floatingButton, showMapControls && styles.activeFloatingButton]}
          activeOpacity={0.8}
        >
          <Layers color="#fff" size={20} strokeWidth={2} />
        </TouchableOpacity>
      </View>
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
                outputRange: [0.7, 1],
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
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.loadingIconContainer}
          >
            <MapPin color="#fff" size={32} strokeWidth={1.5} />
          </LinearGradient>
          <ActivityIndicator size="large" color="#667eea" style={styles.loadingSpinner} />
          <Text style={styles.loadingText}>Loading Smart Map...</Text>
          <Text style={styles.loadingSubtext}>Fetching dairy locations with enhanced visualization</Text>
        </Animated.View>
      </View>
    </SafeAreaView>
  );

  const EmptyState = () => (
    <SafeAreaView style={styles.container}>
      <Header />
      <View style={styles.emptyContainer}>
        <View style={styles.emptyContent}>
          <LinearGradient
            colors={['#f1f5f9', '#e2e8f0']}
            style={styles.emptyIconContainer}
          >
            <MapPin color="#94A3B8" size={48} strokeWidth={1} />
          </LinearGradient>
          <Text style={styles.emptyTitle}>No Locations Available</Text>
          <Text style={styles.emptySubtitle}>
            No dairy locations with GPS coordinates were found. Ensure location data is properly captured during registration.
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadUsersData}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.retryGradient}
            >
              <Text style={styles.retryButtonText}>Refresh Locations</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );

  if (loading) return <LoadingScreen />;
  if (users.length === 0) return <EmptyState />;

  return (
    <SafeAreaView style={[styles.container, isFullscreen && styles.fullscreenContainer]}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="#667eea" 
        hidden={isFullscreen}
      />
      
      <Header />
      <MapControls />
      <FloatingControls />
      
      <Animated.View
        style={[
          styles.mapContainer,
          isFullscreen && styles.fullscreenMap,
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
              <Text style={styles.webviewLoadingText}>Rendering map...</Text>
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
                  <View style={styles.modalHeaderLeft}>
                    <View style={styles.modalAvatar}>
                      <Text style={styles.modalAvatarText}>
                        {selectedUser.firstName.charAt(0)}{selectedUser.surname.charAt(0)}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.modalTitle}>
                        {selectedUser.firstName} {selectedUser.surname}
                      </Text>
                      {/* <Text style={styles.modalSubtitle}>
                        Dairy Farmer • ID: {selectedUser.registrationId}
                      </Text> */}
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={closeModal}
                    style={styles.closeButton}
                    activeOpacity={0.8}
                  >
                    <X color="#fff" size={20} strokeWidth={2} />
                  </TouchableOpacity>
                </View>
              </LinearGradient>

              <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                <View style={styles.modalBody}>
                  <DetailRow
                    icon={Phone}
                    label="Contact Number"
                    value={selectedUser.contactNumber}
                    gradient={['#10b981', '#059669']}
                  />
                  
                  <DetailRow
                    icon={Users}
                    label="Gender"
                    value={selectedUser.gender}
                    gradient={['#8b5cf6', '#7c3aed']}
                  />
                  
                  <DetailRow
                    icon={Calendar}
                    label="Date of Birth"
                    value={new Date(selectedUser.dob).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                    gradient={['#f59e0b', '#d97706']}
                  />
                  
                  <DetailRow
                    icon={MapPin}
                    label="Complete Address"
                    value={`${selectedUser.village}, ${selectedUser.block}, ${selectedUser.district}, ${selectedUser.state}`}
                    gradient={['#ef4444', '#dc2626']}
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

const DetailRow = ({ icon: Icon, label, value, gradient }) => (
  <View style={styles.detailRow}>
    <LinearGradient
      colors={gradient}
      style={styles.detailIconContainer}
    >
      <Icon color="#fff" size={18} strokeWidth={2} />
    </LinearGradient>
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
  fullscreenContainer: {
    backgroundColor: '#000',
  },
  header: {
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
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
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  activeActionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  mapControlsContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 140 : 120,
    right: 20,
    zIndex: 1000,
  },
  mapControls: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    minWidth: 140,
  },
  controlsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 12,
    textAlign: 'center',
  },
  mapTypeButton: {
    borderRadius: 12,
    marginVertical: 3,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  activeMapType: {
    borderColor: 'transparent',
    elevation: 2,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  mapTypeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  mapTypeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  activeMapTypeText: {
    color: '#fff',
  },
  floatingControls: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 1000,
    gap: 12,
  },
  floatingButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  activeFloatingButton: {
    backgroundColor: 'rgba(102, 126, 234, 0.9)',
  },
  mapContainer: {
    flex: 1,
    margin: 20,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
  },
  fullscreenMap: {
    margin: 0,
    borderRadius: 0,
  },
  webview: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
  webviewLoadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
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
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
  },
  loadingSpinner: {
    marginVertical: 20,
  },
  loadingText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
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
    borderRadius: 32,
    padding: 24,
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  retryButton: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  retryGradient: {
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
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
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: height * 0.75,
    overflow: 'hidden',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  modalHeader: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  modalHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  modalAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  closeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 6,
    padding: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
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
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  detailIconContainer: {
    borderRadius: 14,
    padding: 12,
    marginRight: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '600',
    lineHeight: 22,
  },
});

export default MapScreen;