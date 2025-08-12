import axios from 'axios';

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  address: string;
  county?: string;
  constituency?: string;
  ward?: string;
  accuracy: number;
}

export interface ReverseGeocodeResult {
  address: string;
  county?: string;
  constituency?: string;
  ward?: string;
  landmark?: string;
  distance?: number;
}

class GeocodingService {
  private readonly KENYA_BOUNDS = {
    north: 5.5,
    south: -4.7,
    east: 41.9,
    west: 33.9
  };

  private readonly KENYA_COUNTIES = [
    'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika', 'Malindi',
    'Kitale', 'Garissa', 'Kakamega', 'Machakos', 'Meru', 'Nyeri', 'Kericho',
    'Embu', 'Migori', 'Homa Bay', 'Siaya', 'Busia', 'Vihiga', 'Bomet',
    'Nandi', 'Baringo', 'Laikipia', 'Samburu', 'Trans Nzoia', 'Uasin Gishu',
    'Elgeyo Marakwet', 'West Pokot', 'Turkana', 'Marsabit', 'Isiolo',
    'Meru', 'Tharaka Nithi', 'Embu', 'Kitui', 'Machakos', 'Makueni',
    'Nyandarua', 'Nyeri', 'Kirinyaga', 'Murang\'a', 'Kiambu', 'Kajiado',
    'Narok', 'Kwale', 'Kilifi', 'Tana River', 'Lamu', 'Taita Taveta', 'Garissa',
    'Wajir', 'Mandera'
  ];

  private readonly MAJOR_LANDMARKS = {
    'Nairobi': [
      { name: 'KICC', lat: -1.2921, lng: 36.8219 },
      { name: 'Uhuru Park', lat: -1.2941, lng: 36.8122 },
      { name: 'Wilson Airport', lat: -1.3218, lng: 36.8158 },
      { name: 'JKIA', lat: -1.3192, lng: 36.9278 },
      { name: 'University of Nairobi', lat: -1.2966, lng: 36.8083 },
      { name: 'Westgate Mall', lat: -1.2676, lng: 36.8062 }
    ],
    'Mombasa': [
      { name: 'Fort Jesus', lat: -4.0619, lng: 39.6774 },
      { name: 'Moi International Airport', lat: -4.0347, lng: 39.5942 },
      { name: 'Nyali Bridge', lat: -4.0435, lng: 39.7006 }
    ],
    'Kisumu': [
      { name: 'Kisumu Airport', lat: -0.0861, lng: 34.7289 },
      { name: 'Lake Victoria', lat: -0.0917, lng: 34.7680 }
    ]
  };

  async geocodeAddress(address: string): Promise<GeocodeResult | null> {
    try {
      // First try with Google Maps API if available
      if (process.env.GOOGLE_MAPS_API_KEY) {
        return await this.geocodeWithGoogle(address);
      }

      // Fallback to OpenStreetMap Nominatim
      return await this.geocodeWithNominatim(address);
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }

  async reverseGeocode(latitude: number, longitude: number): Promise<ReverseGeocodeResult | null> {
    try {
      // Validate coordinates are within Kenya
      if (!this.isWithinKenya(latitude, longitude)) {
        throw new Error('Coordinates are outside Kenya bounds');
      }

      // First try with Google Maps API if available
      if (process.env.GOOGLE_MAPS_API_KEY) {
        return await this.reverseGeocodeWithGoogle(latitude, longitude);
      }

      // Fallback to OpenStreetMap Nominatim
      return await this.reverseGeocodeWithNominatim(latitude, longitude);
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return null;
    }
  }

  private async geocodeWithGoogle(address: string): Promise<GeocodeResult | null> {
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address: `${address}, Kenya`,
        key: process.env.GOOGLE_MAPS_API_KEY,
        region: 'ke'
      }
    });

    if (response.data.results && response.data.results.length > 0) {
      const result = response.data.results[0];
      const location = result.geometry.location;
      
      return {
        latitude: location.lat,
        longitude: location.lng,
        address: result.formatted_address,
        county: this.extractCounty(result.address_components),
        accuracy: this.getGoogleAccuracy(result.geometry.location_type)
      };
    }

    return null;
  }

  private async geocodeWithNominatim(address: string): Promise<GeocodeResult | null> {
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: `${address}, Kenya`,
        format: 'json',
        limit: 1,
        countrycodes: 'ke'
      },
      headers: {
        'User-Agent': 'SecureTrack-Kenya/1.0'
      }
    });

    if (response.data && response.data.length > 0) {
      const result = response.data[0];
      
      return {
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        address: result.display_name,
        accuracy: 0.8 // Default accuracy for Nominatim
      };
    }

    return null;
  }

  private async reverseGeocodeWithGoogle(latitude: number, longitude: number): Promise<ReverseGeocodeResult | null> {
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        latlng: `${latitude},${longitude}`,
        key: process.env.GOOGLE_MAPS_API_KEY,
        region: 'ke'
      }
    });

    if (response.data.results && response.data.results.length > 0) {
      const result = response.data.results[0];
      
      return {
        address: result.formatted_address,
        county: this.extractCounty(result.address_components),
        landmark: this.findNearestLandmark(latitude, longitude)
      };
    }

    return null;
  }

  private async reverseGeocodeWithNominatim(latitude: number, longitude: number): Promise<ReverseGeocodeResult | null> {
    const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
      params: {
        lat: latitude,
        lon: longitude,
        format: 'json',
        zoom: 18
      },
      headers: {
        'User-Agent': 'SecureTrack-Kenya/1.0'
      }
    });

    if (response.data) {
      return {
        address: response.data.display_name,
        county: response.data.address?.county || response.data.address?.state,
        landmark: this.findNearestLandmark(latitude, longitude)
      };
    }

    return null;
  }

  private isWithinKenya(latitude: number, longitude: number): boolean {
    return latitude >= this.KENYA_BOUNDS.south &&
           latitude <= this.KENYA_BOUNDS.north &&
           longitude >= this.KENYA_BOUNDS.west &&
           longitude <= this.KENYA_BOUNDS.east;
  }

  private extractCounty(addressComponents: any[]): string | undefined {
    for (const component of addressComponents) {
      if (component.types.includes('administrative_area_level_1')) {
        return component.long_name;
      }
    }
    return undefined;
  }

  private getGoogleAccuracy(locationType: string): number {
    switch (locationType) {
      case 'ROOFTOP': return 1.0;
      case 'RANGE_INTERPOLATED': return 0.8;
      case 'GEOMETRIC_CENTER': return 0.6;
      case 'APPROXIMATE': return 0.4;
      default: return 0.5;
    }
  }

  private findNearestLandmark(latitude: number, longitude: number): string | undefined {
    let nearestLandmark: string | undefined;
    let minDistance = Infinity;

    // Check major cities first
    for (const [city, landmarks] of Object.entries(this.MAJOR_LANDMARKS)) {
      for (const landmark of landmarks) {
        const distance = this.calculateDistance(latitude, longitude, landmark.lat, landmark.lng);
        if (distance < minDistance && distance < 5) { // Within 5km
          minDistance = distance;
          nearestLandmark = `Near ${landmark.name}, ${city}`;
        }
      }
    }

    return nearestLandmark;
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // Get popular Kenya locations for quick selection
  getPopularLocations() {
    return [
      { name: 'Nairobi CBD', lat: -1.2921, lng: 36.8219, county: 'Nairobi' },
      { name: 'Westlands, Nairobi', lat: -1.2676, lng: 36.8062, county: 'Nairobi' },
      { name: 'Mombasa Old Town', lat: -4.0619, lng: 39.6774, county: 'Mombasa' },
      { name: 'Kisumu City', lat: -0.0917, lng: 34.7680, county: 'Kisumu' },
      { name: 'Nakuru Town', lat: -0.3031, lng: 36.0800, county: 'Nakuru' },
      { name: 'Eldoret Town', lat: 0.5143, lng: 35.2698, county: 'Uasin Gishu' },
      { name: 'Thika Town', lat: -1.0332, lng: 37.0692, county: 'Kiambu' },
      { name: 'Malindi Town', lat: -3.2175, lng: 40.1167, county: 'Kilifi' }
    ];
  }
}

export const geocodingService = new GeocodingService();