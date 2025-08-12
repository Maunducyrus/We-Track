// Kenya-specific validation utilities

export class KenyaValidators {
  // Validate Kenya phone number format
  static isValidKenyaPhone(phone: string): boolean {
    const kenyaPhoneRegex = /^\+254[0-9]{9}$/;
    return kenyaPhoneRegex.test(phone);
  }

  // Validate Kenya number plate format
  static isValidKenyaNumberPlate(numberPlate: string): boolean {
    const kenyaPlateRegex = /^K[A-Z]{2}\s?[0-9]{3}[A-Z]$/;
    return kenyaPlateRegex.test(numberPlate.toUpperCase());
  }

  // Validate coordinates are within Kenya bounds
  static isWithinKenyaBounds(latitude: number, longitude: number): boolean {
    const KENYA_BOUNDS = {
      north: 5.5,
      south: -4.7,
      east: 41.9,
      west: 33.9
    };

    return latitude >= KENYA_BOUNDS.south &&
           latitude <= KENYA_BOUNDS.north &&
           longitude >= KENYA_BOUNDS.west &&
           longitude <= KENYA_BOUNDS.east;
  }

  // Validate Kenya ID number format
  static isValidKenyaID(idNumber: string): boolean {
    const kenyaIDRegex = /^[0-9]{8}$/;
    return kenyaIDRegex.test(idNumber);
  }

  // Validate IMEI number
  static isValidIMEI(imei: string): boolean {
    if (!/^[0-9]{15}$/.test(imei)) {
      return false;
    }

    // Luhn algorithm check for IMEI
    let sum = 0;
    for (let i = 0; i < 14; i++) {
      let digit = parseInt(imei[i]);
      if (i % 2 === 1) {
        digit *= 2;
        if (digit > 9) {
          digit = Math.floor(digit / 10) + (digit % 10);
        }
      }
      sum += digit;
    }

    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit === parseInt(imei[14]);
  }

  // Validate VIN/Chassis number
  static isValidVIN(vin: string): boolean {
    const vinRegex = /^[A-HJ-NPR-Z0-9]{17}$/;
    return vinRegex.test(vin.toUpperCase());
  }

  // Validate email format
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validate password strength
  static isStrongPassword(password: string): { valid: boolean; message?: string } {
    if (password.length < 8) {
      return { valid: false, message: 'Password must be at least 8 characters long' };
    }

    if (!/[a-z]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one lowercase letter' };
    }

    if (!/[A-Z]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one uppercase letter' };
    }

    if (!/[0-9]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one number' };
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one special character' };
    }

    return { valid: true };
  }

  // Sanitize input to prevent XSS
  static sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove < and >
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  }

  // Validate Kenya county name
  static isValidKenyaCounty(county: string): boolean {
    const kenyaCounties = [
      'Baringo', 'Bomet', 'Bungoma', 'Busia', 'Elgeyo-Marakwet', 'Embu',
      'Garissa', 'Homa Bay', 'Isiolo', 'Kajiado', 'Kakamega', 'Kericho',
      'Kiambu', 'Kilifi', 'Kirinyaga', 'Kisii', 'Kisumu', 'Kitui',
      'Kwale', 'Laikipia', 'Lamu', 'Machakos', 'Makueni', 'Mandera',
      'Marsabit', 'Meru', 'Migori', 'Mombasa', 'Murang\'a', 'Nairobi',
      'Nakuru', 'Nandi', 'Narok', 'Nyamira', 'Nyandarua', 'Nyeri',
      'Samburu', 'Siaya', 'Taita-Taveta', 'Tana River', 'Tharaka-Nithi',
      'Trans Nzoia', 'Turkana', 'Uasin Gishu', 'Vihiga', 'Wajir', 'West Pokot'
    ];

    return kenyaCounties.includes(county);
  }

  // Format Kenya phone number
  static formatKenyaPhone(phone: string): string {
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');
    
    // Handle different input formats
    if (digits.startsWith('254')) {
      return '+' + digits;
    } else if (digits.startsWith('0')) {
      return '+254' + digits.substring(1);
    } else if (digits.length === 9) {
      return '+254' + digits;
    }
    
    return phone; // Return original if can't format
  }

  // Format Kenya number plate
  static formatKenyaNumberPlate(plate: string): string {
    const cleaned = plate.replace(/\s/g, '').toUpperCase();
    
    if (cleaned.length === 7 && cleaned.match(/^K[A-Z]{2}[0-9]{3}[A-Z]$/)) {
      return cleaned.substring(0, 3) + ' ' + cleaned.substring(3);
    }
    
    return plate;
  }
}

export default KenyaValidators;