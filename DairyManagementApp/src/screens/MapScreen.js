import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused, useNavigation } from '@react-navigation/native';

const MapScreen = () => {
  const [dairyData, setDairyData] = useState([]);
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]); // Default center (India)
  const [selectedDairy, setSelectedDairy] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [webViewKey, setWebViewKey] = useState(0); // For force refresh
  const [isMapReady, setIsMapReady] = useState(false);
  const isFocused = useIsFocused();
  const navigation = useNavigation();

  useEffect(() => {
    if(isFocused) {
      loadDairyData();
    }
  }, [isFocused]);

  const loadDairyData = async () => {
    try {
      const data = await AsyncStorage.getItem('dairyData');
      if (data) {
        const parsedData = JSON.parse(data);
        if (parsedData.length > 0) {
          setDairyData(parsedData);
          // Set map center to the last entry
          const lastEntry = parsedData[parsedData.length - 1];
          setMapCenter([lastEntry.location.latitude, lastEntry.location.longitude]);
        } else {
          // If data is empty array, use mock data and default center
          const mockData = getMockData();
          setDairyData(mockData);
          setMapCenter([20.5937, 78.9629]);
        }
      } else {
        // If no data, use mock data for demonstration
        const mockData = getMockData();
        setDairyData(mockData);
      }
      // Force webview refresh when data changes
      setWebViewKey(prev => prev + 1);
    } catch (error) {
      console.error('Error loading dairy data:', error);
    }
  };

  const getMockData = () => [
    {
      dairyName: 'BINOD DA MILK',
      ownerName: 'BINOD',
      villageName: 'Anand',
      numberOfCows: '5000',
      dailyMilkProduction: '150000',
      location: { latitude: 22.5645, longitude: 72.9289 },
      registrationDate: new Date().toISOString(),
      contact: '1234567890',
      address: 'Anand, Gujarat',
    },
    {
      dairyName: 'BINOD DA MILK',
      ownerName: 'BINOD',
      villageName: 'Delhi',
      numberOfCows: '10000',
      dailyMilkProduction: '250000',
      location: { latitude: 28.7041, longitude: 77.1025 },
      registrationDate: new Date().toISOString(),
      contact: '0987654321',
      address: 'Delhi, India',
    },
    {
      dairyName: 'BINOD DA MILK',
      ownerName: 'BINOD',
      villageName: 'Bengaluru',
      numberOfCows: '8000',
      dailyMilkProduction: '200000',
      location: { latitude: 12.9716, longitude: 77.5946 },
      registrationDate: new Date().toISOString(),
      contact: '1122334455',
      address: 'Bengaluru, Karnataka',
    },
  ];

  const generateMapHTML = () => {
    const markers = dairyData.map((dairy, index) => ({
      lat: dairy.location.latitude,
      lng: dairy.location.longitude,
      popup: `
        <div style="font-family: Arial, sans-serif; min-width: 200px;">
          <h3 style="margin: 0 0 10px 0; color: #2E7D32;">${dairy.dairyName}</h3>
          <p style="margin: 2px 0;"><strong>Owner:</strong> ${dairy.ownerName}</p>
          <p style="margin: 2px 0;"><strong>Village:</strong> ${dairy.villageName}</p>
          <p style="margin: 2px 0;"><strong>Cows:</strong> ${dairy.numberOfCows}</p>
          ${dairy.dailyMilkProduction ? `<p style="margin: 2px 0;"><strong>Daily Production:</strong> ${dairy.dailyMilkProduction}L</p>` : ''}
          <button onclick="showDetails(${index})" style="
            background: #2E7D32; 
            color: white; 
            border: none; 
            padding: 5px 10px; 
            border-radius: 4px; 
            margin-top: 8px;
            cursor: pointer;
          ">View Details</button>
        </div>
      `
    }));
  
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
            * {
                box-sizing: border-box;
            }
            html, body {
                margin: 0;
                padding: 0;
                height: 100%;
                overflow: hidden;
            }
            #map {
                height: 100vh;
                width: 100vw;
                position: fixed;
                top: 0;
                left: 0;
                z-index: 1;
            }
            .custom-popup .leaflet-popup-content-wrapper {
                border-radius: 8px;
            }
            /* Hide attribution control completely */
            .leaflet-control-attribution {
                display: none !important;
            }
            /* Position zoom controls properly */
            .leaflet-control-zoom {
                position: absolute !important;
                top: 80px !important;
                right: 10px !important;
                left: auto !important;
                z-index: 1000 !important;
            }
            /* Improve tile loading and prevent blurring */
            .leaflet-tile {
                pointer-events: none;
                image-rendering: -webkit-optimize-contrast;
                image-rendering: crisp-edges;
                image-rendering: pixelated;
            }
            .leaflet-tile-loaded {
                opacity: 1 !important;
            }
            /* Ensure smooth rendering and prevent blurring */
            .leaflet-container {
                background: #f0f0f0;
                image-rendering: -webkit-optimize-contrast;
                image-rendering: crisp-edges;
            }
            .leaflet-zoom-animated {
                -webkit-transform: translate3d(0,0,0);
                transform: translate3d(0,0,0);
            }
            /* Fix marker rendering during zoom */
            .leaflet-marker-icon {
                -webkit-transform: translate3d(0,0,0);
                transform: translate3d(0,0,0);
            }
        </style>
    </head>
    <body>
        <div id="map"></div>
        <script>
            // Initialize map with better performance settings
            var map = L.map('map', {
                attributionControl: false,
                zoomControl: true,
                doubleClickZoom: true,
                scrollWheelZoom: true,
                boxZoom: true,
                keyboard: true,
                dragging: true,
                touchZoom: true,
                tap: true,
                zoomSnap: 1,
                zoomDelta: 1,
                wheelPxPerZoomLevel: 60,
                maxZoom: 18,
                minZoom: 4,
                preferCanvas: true,
                renderer: L.canvas()
            }).setView([${mapCenter[0]}, ${mapCenter[1]}], 12);
            
            // Move zoom control to avoid overlap
            map.zoomControl.setPosition('topright');
            
            // Add tile layer with better caching and loading options
            var tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '',
                maxZoom: 18,
                minZoom: 4,
                keepBuffer: 4,
                updateWhenIdle: true,
                updateWhenZooming: false,
                crossOrigin: true,
                detectRetina: true,
                reuseTiles: true,
                errorTileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
            });
            
            tileLayer.addTo(map);
            
            var markers = ${JSON.stringify(markers)};
            var markerLayer = L.layerGroup();
            var bounds = [];
            
            // Function to create and add markers
            function addMarkers() {
                // Clear existing markers
                markerLayer.clearLayers();
                bounds = [];
                
                // Add new markers
                markers.forEach(function(marker, index) {
                    try {
                        var leafletMarker = L.marker([marker.lat, marker.lng], {
                            riseOnHover: true
                        }).bindPopup(marker.popup, {
                            className: 'custom-popup',
                            maxWidth: 300,
                            closeButton: true,
                            autoClose: true,
                            keepInView: true
                        });
                        
                        markerLayer.addLayer(leafletMarker);
                        bounds.push([marker.lat, marker.lng]);
                    } catch (error) {
                        console.error('Error creating marker:', error);
                    }
                });
                
                // Add marker layer to map
                markerLayer.addTo(map);
                
                // Fit map to show all markers with delay
                if (bounds.length > 0) {
                    setTimeout(function() {
                        try {
                            if (bounds.length === 1) {
                                map.setView(bounds[0], 14);
                            } else {
                                map.fitBounds(bounds, { 
                                    padding: [50, 50],
                                    maxZoom: 15
                                });
                            }
                        } catch (error) {
                            console.error('Error fitting bounds:', error);
                        }
                    }, 200);
                }
            }
            
            // Add markers initially
            addMarkers();
            
            // Send ready message to React Native
            setTimeout(function() {
                try {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        action: 'mapReady'
                    }));
                } catch (error) {
                    console.error('Error sending ready message:', error);
                }
            }, 500);
            
            // Handle tile loading events
            tileLayer.on('loading', function() {
                console.log('Tiles loading...');
            });
            
            tileLayer.on('load', function() {
                console.log('Tiles loaded');
            });
            
            tileLayer.on('tileerror', function(error) {
                console.error('Tile loading error:', error);
            });
            
            // Handle zoom events to prevent rendering issues
            map.on('zoomstart', function() {
                // Close any open popups during zoom
                map.closePopup();
            });
            
            map.on('zoomend', function() {
                // Force re-render markers after zoom
                setTimeout(function() {
                    map.invalidateSize(false);
                    if (markerLayer) {
                        markerLayer.eachLayer(function(layer) {
                            if (layer._icon) {
                                layer._icon.style.transform = layer._icon.style.transform;
                            }
                        });
                    }
                }, 50);
            });
            
            // Handle move events
            map.on('moveend', function() {
                // Invalidate size after move to ensure proper rendering
                setTimeout(function() {
                    map.invalidateSize(false);
                }, 50);
            });
            
            // Handle tile events
            tileLayer.on('load', function() {
                setTimeout(function() {
                    map.invalidateSize(false);
                }, 100);
            });
            
            // Function to handle detail view
            function showDetails(index) {
                try {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        action: 'showDetails',
                        index: index
                    }));
                } catch (error) {
                    console.error('Error sending message to React Native:', error);
                }
            }
            
            // Add click handler for map
            map.on('click', function(e) {
                try {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        action: 'mapClick',
                        lat: e.latlng.lat,
                        lng: e.latlng.lng
                    }));
                } catch (error) {
                    console.error('Error sending map click message:', error);
                }
            });
            
            // Force map refresh when window resizes
            window.addEventListener('resize', function() {
                setTimeout(function() {
                    map.invalidateSize();
                }, 100);
            });
            
            // Periodic map refresh to handle rendering issues
            setInterval(function() {
                if (map && map.getContainer()) {
                    map.invalidateSize(false);
                }
            }, 5000);
            
            console.log('Map initialized with', markers.length, 'markers');
        </script>
    </body>
    </html>
    `;
  };

  const handleWebViewMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.action === 'showDetails') {
        setSelectedDairy(dairyData[data.index]);
        setModalVisible(true);
      } else if (data.action === 'mapClick') {
        console.log('Map clicked at:', data.lat, data.lng);
      } else if (data.action === 'mapReady') {
        setIsMapReady(true);
        console.log('Map is ready');
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (dairyData.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No dairy data available</Text>
        <Text style={styles.emptySubtext}>Add some dairy data to see them on the map</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        key={webViewKey} // Force refresh when data changes
        style={styles.map}
        source={{ html: generateMapHTML() }}
        onMessage={handleWebViewMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        startInLoadingState={true}
        scalesPageToFit={false}
        bounces={false}
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        onLoadStart={() => console.log('WebView loading started')}
        onLoadEnd={() => console.log('WebView loading ended')}
        onError={(error) => console.error('WebView error:', error)}
        renderError={() => (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Map failed to load</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={() => setWebViewKey(prev => prev + 1)}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          Total Dairies: {dairyData.length} | 
          Total Cows: {dairyData.reduce((sum, dairy) => sum + parseInt(dairy.numberOfCows || 0), 0)}
        </Text>
      </View>

      {/* Details Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedDairy && (
              <ScrollView>
                <Text style={styles.modalTitle}>{selectedDairy.dairyName}</Text>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Owner:</Text>
                  <Text style={styles.detailValue}>{selectedDairy.ownerName}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Village:</Text>
                  <Text style={styles.detailValue}>{selectedDairy.villageName}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Number of Cows:</Text>
                  <Text style={styles.detailValue}>{selectedDairy.numberOfCows}</Text>
                </View>
                
                {selectedDairy.dailyMilkProduction && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Daily Production:</Text>
                    <Text style={styles.detailValue}>{selectedDairy.dailyMilkProduction} Liters</Text>
                  </View>
                )}
                
                {selectedDairy.contact && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Contact:</Text>
                    <Text style={styles.detailValue}>{selectedDairy.contact}</Text>
                  </View>
                )}
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Location:</Text>
                  <Text style={styles.detailValue}>
                    {selectedDairy.location.latitude.toFixed(6)}, {selectedDairy.location.longitude.toFixed(6)}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Added:</Text>
                  <Text style={styles.detailValue}>{formatDate(selectedDairy.registrationDate)}</Text>
                </View>
              </ScrollView>
            )}
            
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#2E7D32',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSpacer: {
    width: 80, // Same width as back button to center title
  },
  map: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#2E7D32',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statsContainer: {
    position: 'absolute',
    top: 80, // Moved down to account for header
    left: 10,
    right: 100, // Leave space for zoom controls
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 12,
    borderRadius: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statsText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2E7D32',
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 12,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 15,
    textAlign: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  closeButton: {
    backgroundColor: '#2E7D32',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  }
});

export default MapScreen;