import { Device, Vehicle, Location, TrackingUpdate } from '../types';
import { gpsService } from './gpsService';

class TrackingService {
  private devices: Map<string, Device> = new Map();
  private vehicles: Map<string, Vehicle> = new Map();
  private trackingUpdates: Map<string, TrackingUpdate[]> = new Map();
  private locationUpdateCallbacks: Map<string, (update: TrackingUpdate) => void> = new Map();
  private realTimeTracking: Map<string, boolean> = new Map();
  private trackingIntervals: Map<string, NodeJS.Timeout> = new Map();

  // Initialize with mock data
  constructor() {
    this.initializeMockData();
    this.startRealTimeTracking();
  }

  private initializeMockData() {
    // Mock devices
    const mockDevices: Device[] = [
      {
        id: '1',
        name: 'iPhone 15 Pro',
        type: 'phone',
        brand: 'Apple',
        model: 'iPhone 15 Pro',
        serialNumber: 'F2LLD0XAHQ',
        imei: '356728101234567',
        phoneNumber: '+1234567890',
        color: 'Space Black',
        status: 'lost',
        reportedBy: 'user1',
        reportedAt: new Date('2025-01-15T10:30:00'),
        lastKnownLocation: {
          id: 'loc1',
          latitude: 40.7128,
          longitude: -74.0060,
          address: 'New York, NY',
          timestamp: new Date('2025-01-15T10:30:00'),
          source: 'gps'
        },
        currentLocation: {
          id: 'loc1_current',
          latitude: 40.7128 + (Math.random() - 0.5) * 0.01,
          longitude: -74.0060 + (Math.random() - 0.5) * 0.01,
          address: 'New York, NY',
          timestamp: new Date(),
          source: 'gps',
          accuracy: 5
        },
        isActive: true
      },
      {
        id: '2',
        name: 'MacBook Pro',
        type: 'laptop',
        brand: 'Apple',
        model: 'MacBook Pro 16"',
        serialNumber: 'C02XD0XAHV29',
        color: 'Space Gray',
        status: 'lost',
        reportedBy: 'user2',
        reportedAt: new Date('2025-01-14T15:45:00'),
        lastKnownLocation: {
          id: 'loc2',
          latitude: 40.7589,
          longitude: -73.9851,
          address: 'Times Square, NY',
          timestamp: new Date('2025-01-14T15:45:00'),
          source: 'network'
        },
        currentLocation: {
          id: 'loc2_current',
          latitude: 40.7589 + (Math.random() - 0.5) * 0.01,
          longitude: -73.9851 + (Math.random() - 0.5) * 0.01,
          address: 'Times Square, NY',
          timestamp: new Date(),
          source: 'network',
          accuracy: 20
        },
        isActive: true
      }
    ];

    // Mock vehicles
    const mockVehicles: Vehicle[] = [
      {
        id: '1',
        numberPlate: 'ABC-123',
        make: 'Toyota',
        model: 'Camry',
        year: 2022,
        color: 'White',
        chassisNumber: '1HGBH41JXMN109186',
        status: 'lost',
        reportedBy: 'user3',
        reportedAt: new Date('2025-01-13T08:20:00'),
        lastKnownLocation: {
          id: 'loc3',
          latitude: 40.7505,
          longitude: -73.9934,
          address: 'Brooklyn Bridge, NY',
          timestamp: new Date('2025-01-13T08:20:00'),
          source: 'gps'
        },
        currentLocation: {
          id: 'loc3_current',
          latitude: 40.7505 + (Math.random() - 0.5) * 0.01,
          longitude: -73.9934 + (Math.random() - 0.5) * 0.01,
          address: 'Brooklyn Bridge, NY',
          timestamp: new Date(),
          source: 'gps',
          accuracy: 3
        },
        isActive: true
      },
      {
        id: '2',
        numberPlate: 'XYZ-789',
        make: 'Honda',
        model: 'Civic',
        year: 2021,
        color: 'Blue',
        status: 'found',
        reportedBy: 'user4',
        reportedAt: new Date('2025-01-12T14:10:00'),
        lastKnownLocation: {
          id: 'loc4',
          latitude: 40.7282,
          longitude: -74.0776,
          address: 'Jersey City, NJ',
          timestamp: new Date('2025-01-12T14:10:00'),
          source: 'witness'
        },
        currentLocation: {
          id: 'loc4_current',
          latitude: 40.7282 + (Math.random() - 0.5) * 0.005,
          longitude: -74.0776 + (Math.random() - 0.5) * 0.005,
          address: 'Jersey City, NJ',
          timestamp: new Date(),
          source: 'witness',
          accuracy: 50
        },
        isActive: true
      }
    ];

    mockDevices.forEach(device => this.devices.set(device.id, device));
    mockVehicles.forEach(vehicle => this.vehicles.set(vehicle.id, vehicle));
  }

  private startRealTimeTracking() {
    // Start real-time tracking for all active items
    [...this.devices.values(), ...this.vehicles.values()].forEach(item => {
      if (item.isActive && item.status === 'lost') {
        this.enableRealTimeTracking(item.id);
      }
    });
  }

  // Enable real-time tracking for an item
  enableRealTimeTracking(itemId: string): void {
    if (this.realTimeTracking.get(itemId)) return;

    this.realTimeTracking.set(itemId, true);
    
    // Start location updates every 5 seconds
    setInterval(() => {
      this.updateItemLocationRealTime(itemId);
    }, 5000);
  }

  // Disable real-time tracking for an item
  disableRealTimeTracking(itemId: string): void {
    this.realTimeTracking.set(itemId, false);
    
    const interval = this.trackingIntervals.get(itemId);
    if (interval) {
      clearInterval(interval);
      this.trackingIntervals.delete(itemId);
    }
  }

  // Update item location in real-time
  private updateItemLocationRealTime(itemId: string): void {
    const device = this.devices.get(itemId);
    const vehicle = this.vehicles.get(itemId);
    const item = device || vehicle;

    if (!item || !item.isActive || item.status !== 'lost') return;

    const lastLocation = item.currentLocation || item.lastKnownLocation;
    if (!lastLocation) return;

    // Simulate realistic movement (small changes)
    const movementRadius = 0.002; // ~200 meters
    const newLocation: Location = {
      id: `realtime_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      latitude: lastLocation.latitude + (Math.random() - 0.5) * movementRadius,
      longitude: lastLocation.longitude + (Math.random() - 0.5) * movementRadius,
      timestamp: new Date(),
      source: 'gps',
      accuracy: Math.random() * 20 + 3 // 3-23 meters accuracy
    };

    // Only update if there's significant movement (>10 meters)
    const distance = gpsService.calculateDistance(
      { latitude: lastLocation.latitude, longitude: lastLocation.longitude },
      { latitude: newLocation.latitude, longitude: newLocation.longitude }
    );

    if (distance >= 10) {
      const update: TrackingUpdate = {
        id: `update_${Date.now()}`,
        itemId: item.id,
        itemType: 'type' in item ? 'device' : 'vehicle',
        location: newLocation,
        timestamp: new Date(),
        source: 'Real-time GPS',
        confidence: Math.random() * 0.2 + 0.8 // 80-100% confidence
      };

      // Update item location
      item.currentLocation = newLocation;
      
      // Store tracking update
      const updates = this.trackingUpdates.get(item.id) || [];
      updates.push(update);
      
      // Keep only last 100 updates to prevent memory issues
      if (updates.length > 100) {
        updates.splice(0, updates.length - 100);
      }
      
      this.trackingUpdates.set(item.id, updates);

      // Notify callbacks
      const callback = this.locationUpdateCallbacks.get(item.id);
      if (callback) {
        callback(update);
      }
    }
  }

  // Device methods
  addDevice(device: Omit<Device, 'id' | 'reportedAt'>): Device {
    const newDevice: Device = {
      ...device,
      id: `device_${Date.now()}`,
      reportedAt: new Date()
    };
    this.devices.set(newDevice.id, newDevice);
    
    // Enable real-time tracking for lost devices
    if (newDevice.status === 'lost' && newDevice.isActive) {
      this.enableRealTimeTracking(newDevice.id);
    }
    
    return newDevice;
  }

  getDevices(): Device[] {
    return Array.from(this.devices.values());
  }

  getDevice(id: string): Device | undefined {
    return this.devices.get(id);
  }

  updateDevice(id: string, updates: Partial<Device>): Device | undefined {
    const device = this.devices.get(id);
    if (device) {
      const updatedDevice = { ...device, ...updates };
      this.devices.set(id, updatedDevice);
      
      // Manage real-time tracking based on status
      if (updatedDevice.status === 'lost' && updatedDevice.isActive) {
        this.enableRealTimeTracking(id);
      } else {
        this.disableRealTimeTracking(id);
      }
      
      return updatedDevice;
    }
    return undefined;
  }

  searchDevices(query: string): Device[] {
    const devices = Array.from(this.devices.values());
    const lowerQuery = query.toLowerCase();
    
    return devices.filter(device => 
      device.name.toLowerCase().includes(lowerQuery) ||
      device.serialNumber.toLowerCase().includes(lowerQuery) ||
      device.imei?.toLowerCase().includes(lowerQuery) ||
      device.phoneNumber?.includes(query) ||
      device.brand.toLowerCase().includes(lowerQuery) ||
      device.model.toLowerCase().includes(lowerQuery) ||
      device.id.toLowerCase().includes(lowerQuery)
    );
  }

  // Vehicle methods
  addVehicle(vehicle: Omit<Vehicle, 'id' | 'reportedAt'>): Vehicle {
    const newVehicle: Vehicle = {
      ...vehicle,
      id: `vehicle_${Date.now()}`,
      reportedAt: new Date()
    };
    this.vehicles.set(newVehicle.id, newVehicle);
    
    // Enable real-time tracking for lost vehicles
    if (newVehicle.status === 'lost' && newVehicle.isActive) {
      this.enableRealTimeTracking(newVehicle.id);
    }
    
    return newVehicle;
  }

  getVehicles(): Vehicle[] {
    return Array.from(this.vehicles.values());
  }

  getVehicle(id: string): Vehicle | undefined {
    return this.vehicles.get(id);
  }

  updateVehicle(id: string, updates: Partial<Vehicle>): Vehicle | undefined {
    const vehicle = this.vehicles.get(id);
    if (vehicle) {
      const updatedVehicle = { ...vehicle, ...updates };
      this.vehicles.set(id, updatedVehicle);
      
      // Manage real-time tracking based on status
      if (updatedVehicle.status === 'lost' && updatedVehicle.isActive) {
        this.enableRealTimeTracking(id);
      } else {
        this.disableRealTimeTracking(id);
      }
      
      return updatedVehicle;
    }
    return undefined;
  }

  searchVehicles(query: string): Vehicle[] {
    const vehicles = Array.from(this.vehicles.values());
    const lowerQuery = query.toLowerCase();
    
    return vehicles.filter(vehicle => 
      vehicle.numberPlate.toLowerCase().includes(lowerQuery) ||
      vehicle.make.toLowerCase().includes(lowerQuery) ||
      vehicle.model.toLowerCase().includes(lowerQuery) ||
      vehicle.chassisNumber?.toLowerCase().includes(lowerQuery) ||
      vehicle.color.toLowerCase().includes(lowerQuery) ||
      vehicle.id.toLowerCase().includes(lowerQuery)
    );
  }

  // Tracking methods
  getTrackingHistory(itemId: string): TrackingUpdate[] {
    return this.trackingUpdates.get(itemId) || [];
  }

  subscribeToLocationUpdates(itemId: string, callback: (update: TrackingUpdate) => void) {
    this.locationUpdateCallbacks.set(itemId, callback);
  }

  unsubscribeFromLocationUpdates(itemId: string) {
    this.locationUpdateCallbacks.delete(itemId);
  }

  // Get all items for map display
  getAllItems(): (Device | Vehicle)[] {
    return [...this.devices.values(), ...this.vehicles.values()];
  }

  // Get items by status
  getItemsByStatus(status: 'lost' | 'found' | 'returned'): (Device | Vehicle)[] {
    return this.getAllItems().filter(item => item.status === status);
  }

  // Update item location manually
  updateItemLocation(itemId: string, location: Location, itemType: 'device' | 'vehicle') {
    const item = itemType === 'device' ? this.devices.get(itemId) : this.vehicles.get(itemId);
    if (item) {
      item.currentLocation = location;
      
      const update: TrackingUpdate = {
        id: `update_${Date.now()}`,
        itemId,
        itemType,
        location,
        timestamp: new Date(),
        source: 'Manual Update',
        confidence: 1.0
      };

      const updates = this.trackingUpdates.get(itemId) || [];
      updates.push(update);
      this.trackingUpdates.set(itemId, updates);

      // Notify callbacks
      const callback = this.locationUpdateCallbacks.get(itemId);
      if (callback) {
        callback(update);
      }
      return update;
    }
    return null;
  }

  // Get items within radius of a location
  getItemsNearLocation(centerLocation: Location, radiusMeters: number): (Device | Vehicle)[] {
    const allItems = this.getAllItems();
    
    return allItems.filter(item => {
      const itemLocation = item.currentLocation || item.lastKnownLocation;
      if (!itemLocation) return false;
      
      const distance = gpsService.calculateDistance(
        { latitude: centerLocation.latitude, longitude: centerLocation.longitude },
        { latitude: itemLocation.latitude, longitude: itemLocation.longitude }
      );
      
      return distance <= radiusMeters;
    });
  }

  // Get distance between item and location
  getDistanceToItem(itemId: string, targetLocation: Location): number | null {
    const device = this.devices.get(itemId);
    const vehicle = this.vehicles.get(itemId);
    const item = device || vehicle;
    
    if (!item) return null;
    
    const itemLocation = item.currentLocation || item.lastKnownLocation;
    if (!itemLocation) return null;
    
    return gpsService.calculateDistance(
      { latitude: targetLocation.latitude, longitude: targetLocation.longitude },
      { latitude: itemLocation.latitude, longitude: itemLocation.longitude }
    );
  }

  // Check if item is moving
  isItemMoving(itemId: string): boolean {
    const updates = this.trackingUpdates.get(itemId) || [];
    if (updates.length < 2) return false;
    
    const recent = updates.slice(-5); // Last 5 updates
    let totalDistance = 0;
    
    for (let i = 1; i < recent.length; i++) {
      const distance = gpsService.calculateDistance(
        { latitude: recent[i-1].location.latitude, longitude: recent[i-1].location.longitude },
        { latitude: recent[i].location.latitude, longitude: recent[i].location.longitude }
      );
      totalDistance += distance;
    }
    
    return totalDistance > 50; // Moving if total distance > 50 meters
  }

  // Get movement speed (meters per second)
  getItemSpeed(itemId: string): number | null {
    const updates = this.trackingUpdates.get(itemId) || [];
    if (updates.length < 2) return null;
    
    const recent = updates.slice(-2);
    const distance = gpsService.calculateDistance(
      { latitude: recent[0].location.latitude, longitude: recent[0].location.longitude },
      { latitude: recent[1].location.latitude, longitude: recent[1].location.longitude }
    );
    
    const timeDiff = (recent[1].timestamp.getTime() - recent[0].timestamp.getTime()) / 1000;
    return timeDiff > 0 ? distance / timeDiff : 0;
  }
}

export const trackingService = new TrackingService();