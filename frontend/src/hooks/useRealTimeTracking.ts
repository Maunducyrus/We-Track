import { useState, useEffect, useCallback, useRef } from 'react';
import { Device, Vehicle, Location, TrackingUpdate } from '../types';
import { gpsService, GPSPosition } from '../services/gpsService';
import { trackingService } from '../services/trackingService';

interface UseRealTimeTrackingOptions {
  enableGPS?: boolean;
  trackingInterval?: number;
  distanceFilter?: number;
  enableBatteryOptimization?: boolean;
}

interface TrackingState {
  isTracking: boolean;
  currentLocation: Location | null;
  accuracy: number;
  lastUpdate: Date | null;
  error: string | null;
  batteryLevel?: number;
}

export const useRealTimeTracking = (
  item: Device | Vehicle | null,
  options: UseRealTimeTrackingOptions = {}
) => {
  const [trackingState, setTrackingState] = useState<TrackingState>({
    isTracking: false,
    currentLocation: null,
    accuracy: 0,
    lastUpdate: null,
    error: null
  });

  const [nearbyItems, setNearbyItems] = useState<(Device | Vehicle)[]>([]);
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const trackingRef = useRef<boolean>(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const {
    enableGPS = true,
    trackingInterval = 5000,
    distanceFilter = 10,
    enableBatteryOptimization = true
  } = options;

  // Start tracking
  const startTracking = useCallback(async () => {
    if (!item || trackingRef.current) return;

    try {
      setTrackingState(prev => ({ ...prev, isTracking: true, error: null }));
      trackingRef.current = true;

      if (enableGPS && gpsService.isSupported()) {
        // Start GPS tracking
        gpsService.startTracking(
          item.id,
          (position: GPSPosition) => {
            const location: Location = {
              id: `gps_${Date.now()}`,
              latitude: position.latitude,
              longitude: position.longitude,
              accuracy: position.accuracy,
              timestamp: new Date(position.timestamp),
              source: 'gps'
            };

            // Update item location
            const itemType = 'type' in item ? 'device' : 'vehicle';
            trackingService.updateItemLocation(item.id, location, itemType);

            setTrackingState(prev => ({
              ...prev,
              currentLocation: location,
              accuracy: position.accuracy,
              lastUpdate: new Date()
            }));

            // Find nearby items
            updateNearbyItems(location);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 30000,
            trackingInterval,
            distanceFilter
          }
        );
      }

      // Battery monitoring (if supported)
      if (enableBatteryOptimization && 'getBattery' in navigator) {
        try {
          const battery = await (navigator as any).getBattery();
          setTrackingState(prev => ({
            ...prev,
            batteryLevel: Math.round(battery.level * 100)
          }));

          battery.addEventListener('levelchange', () => {
            setTrackingState(prev => ({
              ...prev,
              batteryLevel: Math.round(battery.level * 100)
            }));
          });
        } catch (error) {
          console.warn('Battery API not supported');
        }
      }

    } catch (error) {
      setTrackingState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Tracking failed',
        isTracking: false
      }));
      trackingRef.current = false;
    }
  }, [item, enableGPS, trackingInterval, distanceFilter, enableBatteryOptimization]);

  // Stop tracking
  const stopTracking = useCallback(() => {
    if (!item || !trackingRef.current) return;

    gpsService.stopTracking(item.id);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setTrackingState(prev => ({ ...prev, isTracking: false }));
    trackingRef.current = false;
  }, [item]);

  // Get user's current location
  const getUserLocation = useCallback(async () => {
    try {
      const position = await gpsService.getCurrentPosition();
      const location: Location = {
        id: `user_${Date.now()}`,
        latitude: position.latitude,
        longitude: position.longitude,
        accuracy: position.accuracy,
        timestamp: new Date(),
        source: 'gps'
      };
      
      setUserLocation(location);
      return location;
    } catch (error) {
      console.error('Failed to get user location:', error);
      return null;
    }
  }, []);

  // Calculate distance from user location
  const getDistanceFromUser = useCallback((targetLocation: Location): number | null => {
    if (!userLocation) return null;
    
    return gpsService.calculateDistance(
      { latitude: userLocation.latitude, longitude: userLocation.longitude },
      { latitude: targetLocation.latitude, longitude: targetLocation.longitude }
    );
  }, [userLocation]);

  // Calculate distance between two locations
  const calculateDistance = useCallback((loc1: Location, loc2: Location): number => {
    return gpsService.calculateDistance(
      { latitude: loc1.latitude, longitude: loc1.longitude },
      { latitude: loc2.latitude, longitude: loc2.longitude }
    );
  }, []);

  // Format distance for display
  const formatDistance = useCallback((meters: number): string => {
    return gpsService.formatDistance(meters);
  }, []);

  // Update nearby items
  const updateNearbyItems = useCallback((currentLocation: Location) => {
    const allItems = trackingService.getAllItems();
    const nearby = allItems.filter(otherItem => {
      if (otherItem.id === item?.id) return false;
      
      const otherLocation = otherItem.currentLocation || otherItem.lastKnownLocation;
      if (!otherLocation) return false;

      const distance = calculateDistance(currentLocation, otherLocation);
      return distance <= 5000; // Within 5km
    });

    setNearbyItems(nearby);
  }, [item, calculateDistance]);

  // Get tracking history
  const getTrackingHistory = useCallback(() => {
    if (!item) return [];
    return trackingService.getTrackingHistory(item.id);
  }, [item]);

  // Manual location update
  const updateLocation = useCallback(async (latitude: number, longitude: number, address?: string) => {
    if (!item) return;

    const location: Location = {
      id: `manual_${Date.now()}`,
      latitude,
      longitude,
      timestamp: new Date(),
      source: 'manual',
      address
    };

    const itemType = 'type' in item ? 'device' : 'vehicle';
    trackingService.updateItemLocation(item.id, location, itemType);

    setTrackingState(prev => ({
      ...prev,
      currentLocation: location,
      lastUpdate: new Date()
    }));
  }, [item]);

  // Auto-start tracking when item changes
  useEffect(() => {
    if (item && enableGPS) {
      startTracking();
    }

    return () => {
      stopTracking();
    };
  }, [item, enableGPS, startTracking, stopTracking]);

  // Get user location on mount
  useEffect(() => {
    getUserLocation();
  }, [getUserLocation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  return {
    // State
    ...trackingState,
    nearbyItems,
    userLocation,
    
    // Actions
    startTracking,
    stopTracking,
    getUserLocation,
    updateLocation,
    
    // Utilities
    getDistanceFromUser,
    calculateDistance,
    formatDistance,
    getTrackingHistory,
    
    // GPS Service utilities
    isGPSSupported: gpsService.isSupported(),
    getAccuracyDescription: (accuracy: number) => gpsService.getAccuracyDescription(accuracy)
  };
};