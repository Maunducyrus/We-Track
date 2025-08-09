import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon, LatLngBounds } from 'leaflet';
import { Device, Vehicle, TrackingUpdate } from '../../types';
import { trackingService } from '../../services/trackingService';
import { MapPin, Smartphone, Laptop, Car, Clock, Navigation, Activity, Signal, Battery } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { gpsService } from '../../services/gpsService';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface TrackingMapProps {
  selectedItem?: Device | Vehicle;
  showAllItems?: boolean;
  height?: string;
  onItemSelect?: (item: Device | Vehicle) => void;
  userLocation?: { latitude: number; longitude: number } | null;
  showUserLocation?: boolean;
  showDistances?: boolean;
  realTimeUpdates?: boolean;
}

const MapUpdater: React.FC<{ items: (Device | Vehicle)[] }> = ({ items }) => {
  const map = useMap();

  useEffect(() => {
    if (items.length > 0) {
      const bounds = new LatLngBounds([]);
      items.forEach(item => {
        const location = item.currentLocation || item.lastKnownLocation;
        if (location) {
          bounds.extend([location.latitude, location.longitude]);
        }
      });
      
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [20, 20] });
      }
    }
  }, [map, items]);

  return null;
};

const TrackingMap: React.FC<TrackingMapProps> = ({ 
  selectedItem, 
  showAllItems = false, 
  height = '400px',
  onItemSelect,
  userLocation,
  showUserLocation = true,
  showDistances = true,
  realTimeUpdates = true
}) => {
  const [items, setItems] = useState<(Device | Vehicle)[]>([]);
  const [trackingUpdates, setTrackingUpdates] = useState<Map<string, TrackingUpdate[]>>(new Map());
  const [currentUserLocation, setCurrentUserLocation] = useState<{ latitude: number; longitude: number } | null>(userLocation || null);

  useEffect(() => {
    if (showAllItems) {
      setItems(trackingService.getAllItems());
    } else if (selectedItem) {
      setItems([selectedItem]);
    }
  }, [selectedItem, showAllItems]);

  // Get user location if not provided
  useEffect(() => {
    if (showUserLocation && !userLocation) {
      gpsService.getCurrentPosition()
        .then(position => {
          setCurrentUserLocation({
            latitude: position.latitude,
            longitude: position.longitude
          });
        })
        .catch(error => {
          console.warn('Could not get user location:', error);
        });
    } else if (userLocation) {
      setCurrentUserLocation(userLocation);
    }
  }, [showUserLocation, userLocation]);
  useEffect(() => {
    if (!realTimeUpdates) return;
    
    // Subscribe to real-time updates for all items
    const subscriptions: string[] = [];
    
    items.forEach(item => {
      const callback = (update: TrackingUpdate) => {
        setTrackingUpdates(prev => {
          const newMap = new Map(prev);
          const updates = newMap.get(item.id) || [];
          updates.push(update);
          
          // Keep only last 50 updates per item to prevent memory issues
          if (updates.length > 50) {
            updates.splice(0, updates.length - 50);
          }
          
          newMap.set(item.id, updates);
          return newMap;
        });
        
        // Update items state to trigger re-render
        setItems(prevItems => 
          prevItems.map(prevItem => 
            prevItem.id === item.id ? { ...prevItem, currentLocation: update.location } : prevItem
          )
        );
      };
      
      trackingService.subscribeToLocationUpdates(item.id, callback);
      subscriptions.push(item.id);
      
      // Load existing tracking history
      const history = trackingService.getTrackingHistory(item.id);
      if (history.length > 0) {
        setTrackingUpdates(prev => {
          const newMap = new Map(prev);
          newMap.set(item.id, history);
          return newMap;
        });
      }
    });

    return () => {
      subscriptions.forEach(id => {
        trackingService.unsubscribeFromLocationUpdates(id);
      });
    };
  }, [items, realTimeUpdates]);

  const getItemIcon = (item: Device | Vehicle) => {
    const isDevice = 'type' in item;
    const status = item.status;
    
    let color = '#3B82F6'; // blue for lost
    if (status === 'found') color = '#10B981'; // green
    if (status === 'returned') color = '#6B7280'; // gray

    return isDevice ? 
      <Smartphone className="w-4 h-4" style={{ color }} /> : 
      <Car className="w-4 h-4" style={{ color }} />;
  };

  const getItemLocation = (item: Device | Vehicle) => {
    return item.currentLocation || item.lastKnownLocation;
  };

  const renderItemPopup = (item: Device | Vehicle) => {
    const isDevice = 'type' in item;
    const location = getItemLocation(item);
    const updates = trackingUpdates.get(item.id) || [];
    const lastUpdate = updates[updates.length - 1];
    const isMoving = trackingService.isItemMoving(item.id);
    const speed = trackingService.getItemSpeed(item.id);
    
    // Calculate distance from user location
    let distanceFromUser: number | null = null;
    if (currentUserLocation && location) {
      distanceFromUser = gpsService.calculateDistance(
        currentUserLocation,
        { latitude: location.latitude, longitude: location.longitude }
      );
    }

    return (
      <Popup>
        <div className="p-3 min-w-[280px]">
          <div className="flex items-center space-x-2 mb-2">
            {getItemIcon(item)}
            <h3 className="font-semibold text-gray-900">
              {isDevice ? (item as Device).name : `${(item as Vehicle).make} ${(item as Vehicle).model}`}
            </h3>
            {isMoving && (
              <div className="flex items-center space-x-1">
                <Activity className="w-3 h-3 text-green-600 animate-pulse" />
                <span className="text-xs text-green-600 font-medium">MOVING</span>
              </div>
            )}
          </div>
          
          <div className="space-y-1 text-sm text-gray-600">
            {isDevice ? (
              <>
                <p><strong>Type:</strong> {(item as Device).type}</p>
                <p><strong>Serial:</strong> {(item as Device).serialNumber}</p>
                {(item as Device).imei && <p><strong>IMEI:</strong> {(item as Device).imei}</p>}
                {(item as Device).phoneNumber && <p><strong>Phone:</strong> {(item as Device).phoneNumber}</p>}
              </>
            ) : (
              <>
                <p><strong>Plate:</strong> {(item as Vehicle).numberPlate}</p>
                <p><strong>Color:</strong> {(item as Vehicle).color}</p>
                {(item as Vehicle).chassisNumber && <p><strong>VIN:</strong> {(item as Vehicle).chassisNumber}</p>}
              </>
            )}
            
            <p><strong>Status:</strong> 
              <span className={`ml-1 px-2 py-1 rounded-full text-xs ${
                item.status === 'lost' ? 'bg-red-100 text-red-800' :
                item.status === 'found' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {item.status.toUpperCase()}
              </span>
            </p>
            
            {location && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                {location.accuracy && (
                  <div className="flex items-center space-x-1 text-xs text-gray-500 mb-1">
                    <Signal className="w-3 h-3" />
                    <span>Accuracy: ±{Math.round(location.accuracy)}m</span>
                  </div>
                )}
                
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  <MapPin className="w-3 h-3" />
                  <span>{location.address || `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`}</span>
                </div>
                
                <div className="flex items-center space-x-1 text-xs text-gray-500 mt-1">
                  <Clock className="w-3 h-3" />
                  <span>{formatDistanceToNow(location.timestamp, { addSuffix: true })}</span>
                </div>
                
                {showDistances && distanceFromUser !== null && (
                  <div className="text-xs text-blue-600 mt-1">
                    <strong>Distance from you: {gpsService.formatDistance(distanceFromUser)}</strong>
                  </div>
                )}
              </div>
            )}
            
            {lastUpdate && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <div className="flex items-center space-x-1 text-xs text-blue-600">
                  <Navigation className="w-3 h-3" />
                  <span>Last tracked: {formatDistanceToNow(lastUpdate.timestamp, { addSuffix: true })}</span>
                </div>
                <div className="text-xs text-gray-500">
                  Confidence: {Math.round(lastUpdate.confidence * 100)}%
                </div>
                
                {speed !== null && speed > 0 && (
                  <div className="text-xs text-green-600">
                    Speed: {(speed * 3.6).toFixed(1)} km/h
                  </div>
                )}
              </div>
            )}
            
            {updates.length > 1 && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <div className="text-xs text-gray-500">
                  {updates.length} location updates recorded
                </div>
              </div>
            )}
          </div>
          
          {onItemSelect && (
            <button
              onClick={() => onItemSelect(item)}
              className="mt-2 w-full bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
            >
              View Details
            </button>
          )}
        </div>
      </Popup>
    );
  };

  const defaultCenter: [number, number] = [40.7128, -74.0060]; // New York City

  return (
    <div className="relative" style={{ height }}>
      <MapContainer
        center={defaultCenter}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapUpdater items={items} />
        
        {/* User Location Marker */}
        {showUserLocation && currentUserLocation && (
          <Marker
            position={[currentUserLocation.latitude, currentUserLocation.longitude]}
            icon={new Icon({
              iconUrl: 'data:image/svg+xml;base64,' + btoa(`
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #3B82F6;">
                  <circle cx="12" cy="12" r="10"/>
                  <circle cx="12" cy="12" r="4"/>
                </svg>
              `),
              iconSize: [24, 24],
              iconAnchor: [12, 12],
              popupAnchor: [0, -12]
            })}
          >
            <Popup>
              <div className="p-2">
                <div className="flex items-center space-x-2 mb-2">
                  <Navigation className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold text-blue-900">Your Location</span>
                </div>
                <div className="text-xs text-gray-500 font-mono">
                  {currentUserLocation.latitude.toFixed(6)}, {currentUserLocation.longitude.toFixed(6)}
                </div>
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* Item Markers */}
        {items.map(item => {
          const location = getItemLocation(item);
          if (!location) return null;
          
          const isMoving = trackingService.isItemMoving(item.id);
          const isDevice = 'type' in item;
          
          // Create custom icon based on item type and status
          const iconColor = item.status === 'lost' ? '#EF4444' : 
                           item.status === 'found' ? '#10B981' : '#6B7280';
          
          const customIcon = new Icon({
            iconUrl: 'data:image/svg+xml;base64,' + btoa(`
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: ${iconColor};">
                ${isDevice ? 
                  '<rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>' :
                  '<path d="M14 16H9m10 0h3m-3 0l3-3m-3 3l3 3M7 16H4m3 0L4 13m3 3L4 19m5-3V9l3-3 3 3v7"/>'
                }
                ${isMoving ? '<circle cx="18" cy="6" r="3" fill="currentColor" opacity="0.8"/>' : ''}
              </svg>
            `),
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -32]
          });
          
          return (
            <Marker
              key={item.id}
              position={[location.latitude, location.longitude]}
              icon={customIcon}
            >
              {renderItemPopup(item)}
            </Marker>
          );
        })}
      </MapContainer>
      
      {/* Real-time indicator */}
      {realTimeUpdates && (
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-gray-700">Live Tracking</span>
          </div>
        </div>
      )}
      
      {/* Map Controls */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg">
        <div className="flex flex-col space-y-1 text-xs text-gray-600">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>Lost Items</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Found Items</span>
          </div>
          {showUserLocation && (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>Your Location</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrackingMap;