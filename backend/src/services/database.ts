import { UserRole, ItemStatus, DeviceType, LocationSource, AlertType, AlertPriority, AlertStatus, TrackingRequestType } from '@prisma/client';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  avatarUrl?: string;
  isActive: boolean;
  emailVerified: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Device {
  id: string;
  name: string;
  type: DeviceType;
  brand: string;
  model: string;
  serialNumber: string;
  imei?: string;
  phoneNumber?: string;
  color?: string;
  description?: string;
  status: ItemStatus;
  reportedBy: string;
  reportedAt: Date;
  lastKnownLocationId?: string;
  currentLocationId?: string;
  photos: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
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
  status: ItemStatus;
  reportedBy: string;
  reportedAt: Date;
  lastKnownLocationId?: string;
  currentLocationId?: string;
  photos: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Location {
  id: string;
  latitude: number;
  longitude: number;
  address?: string;
  accuracy?: number;
  source: LocationSource;
  timestamp: Date;
  createdAt: Date;
}

export interface TrackingUpdate {
  id: string;
  itemId: string;
  itemType: string;
  locationId: string;
  source: string;
  confidence: number;
  timestamp: Date;
  createdAt: Date;
}

export interface EmergencyAlert {
  id: string;
  type: AlertType;
  priority: AlertPriority;
  locationId: string;
  description: string;
  reportedBy: string;
  assignedTo?: string;
  status: AlertStatus;
  responseTime?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MobileTrackingRequest {
  id: string;
  mobileNumber: string;
  requestType: TrackingRequestType;
  priority: AlertPriority;
  officerId: string;
  courtOrderNumber?: string;
  emergencyCode?: string;
  consentToken?: string;
  success: boolean;
  locationId?: string;
  network?: string;
  accuracy?: number;
  error?: string;
  createdAt: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}