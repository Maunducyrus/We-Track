import { Location, TrackingUpdate } from '../types';

export interface GPSOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  trackingInterval?: number;
  distanceFilter?: number;
}

export interface GPSPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  altitudeAccuracy?: number;
  heading?: number;
  speed?: number;
  timestamp: number;
}

class GPSService {
  private watchId: number | null = null;
  private isTracking = false;
  private callbacks: Map<string, (position: GPSPosition) => void> = new Map();
  private lastKnownPosition: GPSPosition | null = null;
  private trackingInterval: number = 5000; // 5 seconds
  private distanceFilter: number = 10; // 10 meters

  private defaultOptions: GPSOptions = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 30000,
    trackingInterval: 5000,
    distanceFilter: 10
  };

  constructor(options?: GPSOptions) {
    if (options) {
      this.defaultOptions = { ...this.defaultOptions, ...options };
      this.trackingInterval = options.trackingInterval || 5000;
      this.distanceFilter = options.distanceFilter || 10;
    }
  }

  // Check if geolocation is supported
  isSupported(): boolean {
    return 'geolocation' in navigator;
  }

  // Get current position once
  async getCurrentPosition(options?: GPSOptions): Promise<GPSPosition> {
    return new Promise((resolve, reject) => {
      if (!this.isSupported()) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      const opts = { ...this.defaultOptions, ...options };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const gpsPosition: GPSPosition = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude || undefined,
            altitudeAccuracy: position.coords.altitudeAccuracy || undefined,
            heading: position.coords.heading || undefined,
            speed: position.coords.speed || undefined,
            timestamp: position.timestamp
          };
          
          this.lastKnownPosition = gpsPosition;
          resolve(gpsPosition);
        },
        (error) => {
          reject(this.handleGeolocationError(error));
        },
        {
          enableHighAccuracy: opts.enableHighAccuracy,
          timeout: opts.timeout,
          maximumAge: opts.maximumAge
        }
      );
    });
  }

  // Start continuous tracking
  startTracking(itemId: string, callback: (position: GPSPosition) => void, options?: GPSOptions): void {
    if (!this.isSupported()) {
      throw new Error('Geolocation is not supported');
    }

    this.callbacks.set(itemId, callback);
    
    if (!this.isTracking) {
      this.isTracking = true;
      this.beginTracking(options);
    }
  }

  // Stop tracking for specific item
  stopTracking(itemId: string): void {
    this.callbacks.delete(itemId);
    
    if (this.callbacks.size === 0 && this.isTracking) {
      this.stopAllTracking();
    }
  }

  // Stop all tracking
  stopAllTracking(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    
    this.isTracking = false;
    this.callbacks.clear();
  }

  // Get last known position
  getLastKnownPosition(): GPSPosition | null {
    return this.lastKnownPosition;
  }

  // Calculate distance between two points (Haversine formula)
  calculateDistance(pos1: { latitude: number; longitude: number }, pos2: { latitude: number; longitude: number }): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = pos1.latitude * Math.PI / 180;
    const φ2 = pos2.latitude * Math.PI / 180;
    const Δφ = (pos2.latitude - pos1.latitude) * Math.PI / 180;
    const Δλ = (pos2.longitude - pos1.longitude) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  }

  // Calculate bearing between two points
  calculateBearing(pos1: { latitude: number; longitude: number }, pos2: { latitude: number; longitude: number }): number {
    const φ1 = pos1.latitude * Math.PI / 180;
    const φ2 = pos2.latitude * Math.PI / 180;
    const Δλ = (pos2.longitude - pos1.longitude) * Math.PI / 180;

    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

    const θ = Math.atan2(y, x);
    return (θ * 180 / Math.PI + 360) % 360; // Bearing in degrees
  }

  // Format distance for display
  formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    } else if (meters < 10000) {
      return `${(meters / 1000).toFixed(1)}km`;
    } else {
      return `${Math.round(meters / 1000)}km`;
    }
  }

  // Get location accuracy description
  getAccuracyDescription(accuracy: number): string {
    if (accuracy <= 5) return 'Excellent';
    if (accuracy <= 10) return 'Good';
    if (accuracy <= 50) return 'Fair';
    if (accuracy <= 100) return 'Poor';
    return 'Very Poor';
  }

  // Check if position has significantly changed
  hasSignificantChange(oldPos: GPSPosition, newPos: GPSPosition): boolean {
    if (!oldPos) return true;
    
    const distance = this.calculateDistance(oldPos, newPos);
    return distance >= this.distanceFilter;
  }

  // Convert GPS position to Location type
  toLocation(position: GPSPosition, address?: string): Location {
    return {
      id: `gps_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      latitude: position.latitude,
      longitude: position.longitude,
      accuracy: position.accuracy,
      timestamp: new Date(position.timestamp),
      source: 'gps',
      address
    };
  }

  // Reverse geocoding (mock implementation - in production use a real service)
  async reverseGeocode(latitude: number, longitude: number): Promise<string> {
    try {
      // Mock implementation - replace with actual geocoding service
      return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    } catch (error) {
      return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    }
  }

  private beginTracking(options?: GPSOptions): void {
    const opts = { ...this.defaultOptions, ...options };

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const gpsPosition: GPSPosition = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude || undefined,
          altitudeAccuracy: position.coords.altitudeAccuracy || undefined,
          heading: position.coords.heading || undefined,
          speed: position.coords.speed || undefined,
          timestamp: position.timestamp
        };

        // Only update if position has changed significantly
        if (!this.lastKnownPosition || this.hasSignificantChange(this.lastKnownPosition, gpsPosition)) {
          this.lastKnownPosition = gpsPosition;
          
          // Notify all callbacks
          this.callbacks.forEach((callback) => {
            callback(gpsPosition);
          });
        }
      },
      (error) => {
        console.error('GPS tracking error:', this.handleGeolocationError(error));
      },
      {
        enableHighAccuracy: opts.enableHighAccuracy,
        timeout: opts.timeout,
        maximumAge: opts.maximumAge
      }
    );
  }

  private handleGeolocationError(error: GeolocationPositionError): Error {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return new Error('Location access denied by user');
      case error.POSITION_UNAVAILABLE:
        return new Error('Location information unavailable');
      case error.TIMEOUT:
        return new Error('Location request timed out');
      default:
        return new Error('Unknown location error');
    }
  }
}

export const gpsService = new GPSService({
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 30000,
  trackingInterval: 5000,
  distanceFilter: 10
});