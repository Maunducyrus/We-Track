import axios from 'axios';
import { PrismaClient, TrackingRequestType, AlertPriority } from '@prisma/client';
import { geocodingService } from './geocoding';

const prisma = new PrismaClient();

export interface MobileTrackingRequest {
  mobileNumber: string;
  requestType: TrackingRequestType;
  priority: AlertPriority;
  officerId: string;
  courtOrderNumber?: string;
  emergencyCode?: string;
  consentToken?: string;
}

export interface MobileTrackingResult {
  success: boolean;
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
    address?: string;
    network: string;
    timestamp: Date;
  };
  error?: string;
  requestId: string;
}

class MobileTrackingService {
  private readonly NETWORKS = {
    SAFARICOM: {
      apiUrl: process.env.SAFARICOM_API_URL || 'https://api.safaricom.co.ke',
      apiKey: process.env.SAFARICOM_API_KEY,
      secret: process.env.SAFARICOM_API_SECRET
    },
    AIRTEL: {
      apiUrl: process.env.AIRTEL_API_URL || 'https://api.airtel.co.ke',
      apiKey: process.env.AIRTEL_API_KEY,
      secret: process.env.AIRTEL_API_SECRET
    },
    TELKOM: {
      apiUrl: process.env.TELKOM_API_URL || 'https://api.telkom.co.ke',
      apiKey: process.env.TELKOM_API_KEY,
      secret: process.env.TELKOM_API_SECRET
    }
  };

  async trackMobileNumber(request: MobileTrackingRequest): Promise<MobileTrackingResult> {
    try {
      // Validate request authorization
      const isAuthorized = await this.validateTrackingRequest(request);
      if (!isAuthorized) {
        throw new Error('Unauthorized tracking request');
      }

      // Log the tracking request for audit
      const trackingRequest = await prisma.mobileTrackingRequest.create({
        data: {
          mobileNumber: request.mobileNumber,
          requestType: request.requestType,
          priority: request.priority,
          officerId: request.officerId,
          courtOrderNumber: request.courtOrderNumber,
          emergencyCode: request.emergencyCode,
          consentToken: request.consentToken
        }
      });

      // Determine network provider
      const network = this.identifyNetwork(request.mobileNumber);
      
      // Attempt tracking based on network
      let trackingResult: MobileTrackingResult;
      
      switch (network) {
        case 'SAFARICOM':
          trackingResult = await this.trackWithSafaricom(request, trackingRequest.id);
          break;
        case 'AIRTEL':
          trackingResult = await this.trackWithAirtel(request, trackingRequest.id);
          break;
        case 'TELKOM':
          trackingResult = await this.trackWithTelkom(request, trackingRequest.id);
          break;
        default:
          throw new Error('Unknown network provider');
      }

      // Update tracking request with result
      await prisma.mobileTrackingRequest.update({
        where: { id: trackingRequest.id },
        data: {
          success: trackingResult.success,
          network,
          accuracy: trackingResult.location?.accuracy,
          error: trackingResult.error,
          locationId: trackingResult.location ? await this.saveLocation(trackingResult.location) : undefined
        }
      });

      return {
        ...trackingResult,
        requestId: trackingRequest.id
      };

    } catch (error) {
      console.error('Mobile tracking error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId: ''
      };
    }
  }

  private async validateTrackingRequest(request: MobileTrackingRequest): Promise<boolean> {
    // Check if officer exists and has proper permissions
    const officer = await prisma.user.findUnique({
      where: { id: request.officerId },
      select: { role: true, isActive: true }
    });

    if (!officer || !officer.isActive) {
      return false;
    }

    if (!['POLICE', 'ADMIN'].includes(officer.role)) {
      return false;
    }

    // Validate based on request type
    switch (request.requestType) {
      case 'EMERGENCY':
        return request.emergencyCode !== undefined;
      case 'COURT_ORDER':
        return request.courtOrderNumber !== undefined;
      case 'CONSENT':
        return request.consentToken !== undefined;
      case 'LOST_DEVICE':
        return true; // Basic validation for lost device tracking
      default:
        return false;
    }
  }

  private identifyNetwork(mobileNumber: string): string {
    // Remove country code and get first 3 digits
    const number = mobileNumber.replace('+254', '');
    const prefix = number.substring(0, 3);

    // Safaricom prefixes
    if (['701', '702', '703', '704', '705', '706', '707', '708', '709', '710', '711', '712', '713', '714', '715', '716', '717', '718', '719', '720', '721', '722', '723', '724', '725', '726', '727', '728', '729'].includes(prefix)) {
      return 'SAFARICOM';
    }

    // Airtel prefixes
    if (['730', '731', '732', '733', '734', '735', '736', '737', '738', '739', '750', '751', '752', '753', '754', '755', '756', '757', '758', '759'].includes(prefix)) {
      return 'AIRTEL';
    }

    // Telkom prefixes
    if (['770', '771', '772', '773', '774', '775', '776', '777', '778', '779'].includes(prefix)) {
      return 'TELKOM';
    }

    return 'UNKNOWN';
  }

  private async trackWithSafaricom(request: MobileTrackingRequest, requestId: string): Promise<MobileTrackingResult> {
    try {
      // In production, this would make actual API calls to Safaricom
      // For now, we'll simulate the response
      
      if (!this.NETWORKS.SAFARICOM.apiKey) {
        throw new Error('Safaricom API not configured');
      }

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simulate successful tracking (in production, replace with actual API call)
      const mockLocation = this.generateMockLocation();
      
      return {
        success: true,
        location: {
          ...mockLocation,
          network: 'SAFARICOM',
          timestamp: new Date()
        },
        requestId
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Safaricom tracking failed',
        requestId
      };
    }
  }

  private async trackWithAirtel(request: MobileTrackingRequest, requestId: string): Promise<MobileTrackingResult> {
    try {
      if (!this.NETWORKS.AIRTEL.apiKey) {
        throw new Error('Airtel API not configured');
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      const mockLocation = this.generateMockLocation();
      
      return {
        success: true,
        location: {
          ...mockLocation,
          network: 'AIRTEL',
          timestamp: new Date()
        },
        requestId
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Airtel tracking failed',
        requestId
      };
    }
  }

  private async trackWithTelkom(request: MobileTrackingRequest, requestId: string): Promise<MobileTrackingResult> {
    try {
      if (!this.NETWORKS.TELKOM.apiKey) {
        throw new Error('Telkom API not configured');
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1800));

      const mockLocation = this.generateMockLocation();
      
      return {
        success: true,
        location: {
          ...mockLocation,
          network: 'TELKOM',
          timestamp: new Date()
        },
        requestId
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Telkom tracking failed',
        requestId
      };
    }
  }

  private generateMockLocation() {
    // Generate random location within Nairobi for demo purposes
    const nairobiCenter = { lat: -1.2921, lng: 36.8219 };
    const radius = 0.1; // ~10km radius
    
    const latitude = nairobiCenter.lat + (Math.random() - 0.5) * radius;
    const longitude = nairobiCenter.lng + (Math.random() - 0.5) * radius;
    const accuracy = Math.random() * 100 + 10; // 10-110 meters

    return {
      latitude,
      longitude,
      accuracy
    };
  }

  private async saveLocation(location: { latitude: number; longitude: number; accuracy: number }) {
    // Get address for the location
    const addressResult = await geocodingService.reverseGeocode(location.latitude, location.longitude);
    
    const savedLocation = await prisma.location.create({
      data: {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        address: addressResult?.address,
        source: 'NETWORK'
      }
    });

    return savedLocation.id;
  }

  async getTrackingHistory(officerId: string, limit: number = 50) {
    const officer = await prisma.user.findUnique({
      where: { id: officerId },
      select: { role: true }
    });

    if (!officer || !['POLICE', 'ADMIN'].includes(officer.role)) {
      throw new Error('Unauthorized access to tracking history');
    }

    return await prisma.mobileTrackingRequest.findMany({
      where: officer.role === 'ADMIN' ? {} : { officerId },
      include: {
        officer: {
          select: { name: true, email: true }
        },
        location: true
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  }

  async sendSMSAlert(mobileNumber: string, message: string) {
    try {
      // In production, integrate with SMS gateway (e.g., Africa's Talking)
      console.log(`SMS Alert to ${mobileNumber}: ${message}`);
      
      // Simulate SMS sending
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return { success: true, message: 'SMS sent successfully' };
    } catch (error) {
      console.error('SMS sending error:', error);
      return { success: false, error: 'Failed to send SMS' };
    }
  }
}

export const mobileTrackingService = new MobileTrackingService();