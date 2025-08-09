export interface Device {
    id: string;
    name: string;
    type: 'phone' | 'laptop' | 'tablet' | 'other';
    brand: string;
    model: string;
    serialNumber: string;
    imei?: string;
    phoneNumber?: string;
    color?: string;
    description?: string;
    status: 'lost' | 'found' | 'returned';
    reportedBy: string;
    reportedAt: Date;
    lastKnownLocation?: Location;
    currentLocation?: Location;
    photos?: string[];
    isActive: boolean;
  }
  
  export interface Vehicle {
    id: string;
    numberPlate: string;
    make: string;
    model: string;
    year?: number;
    color: string;
    chassisNumber?: string;
    engineNumber?: string;
    description?: string;
    status: 'lost' | 'found' | 'returned';
    reportedBy: string;
    reportedAt: Date;
    lastKnownLocation?: Location;
    currentLocation?: Location;
    photos?: string[];
    isActive: boolean;
  }
  
  export interface Location {
    id: string;
    latitude: number;
    longitude: number;
    address?: string;
    timestamp: Date;
    accuracy?: number;
    source: 'gps' | 'network' | 'manual' | 'witness';
  }
  
  export interface Report {
    id: string;
    type: 'device' | 'vehicle';
    itemId: string;
    reportType: 'lost' | 'found' | 'sighting';
    reportedBy: string;
    location?: Location;
    description: string;
    photos?: string[];
    contactInfo?: string;
    timestamp: Date;
    status: 'pending' | 'verified' | 'resolved';
    assignedTo?: string;
  }
  
  export interface TrackingUpdate {
    id: string;
    itemId: string;
    itemType: 'device' | 'vehicle';
    location: Location;
    timestamp: Date;
    source: string;
    confidence: number;
  }