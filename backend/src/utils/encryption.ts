import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

class EncryptionService {
  private key: Buffer;

  constructor() {
    const encryptionKey = process.env.ENCRYPTION_KEY;
    if (!encryptionKey || encryptionKey.length < 32) {
      throw new Error('ENCRYPTION_KEY must be at least 32 characters long');
    }
    this.key = crypto.scryptSync(encryptionKey, 'salt', KEY_LENGTH);
  }

  encrypt(text: string): string {
    try {
      const iv = crypto.randomBytes(IV_LENGTH);
      const cipher = crypto.createCipher(ALGORITHM, this.key);
      cipher.setAAD(Buffer.from('SecureTrack-Kenya', 'utf8'));

      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const tag = cipher.getAuthTag();
      
      // Combine iv, tag, and encrypted data
      return iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted;
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  decrypt(encryptedData: string): string {
    try {
      const parts = encryptedData.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format');
      }

      const iv = Buffer.from(parts[0], 'hex');
      const tag = Buffer.from(parts[1], 'hex');
      const encrypted = parts[2];

      const decipher = crypto.createDecipher(ALGORITHM, this.key);
      decipher.setAAD(Buffer.from('SecureTrack-Kenya', 'utf8'));
      decipher.setAuthTag(tag);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  // Hash sensitive data (one-way)
  hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  // Generate secure random token
  generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  // Encrypt sensitive fields in database records
  encryptSensitiveFields(data: any, fields: string[]): any {
    const encrypted = { ...data };
    
    for (const field of fields) {
      if (encrypted[field]) {
        encrypted[field] = this.encrypt(encrypted[field]);
      }
    }
    
    return encrypted;
  }

  // Decrypt sensitive fields from database records
  decryptSensitiveFields(data: any, fields: string[]): any {
    const decrypted = { ...data };
    
    for (const field of fields) {
      if (decrypted[field]) {
        try {
          decrypted[field] = this.decrypt(decrypted[field]);
        } catch (error) {
          console.error(`Failed to decrypt field ${field}:`, error);
          // Keep original value if decryption fails
        }
      }
    }
    
    return decrypted;
  }
}

export const encryptionService = new EncryptionService();