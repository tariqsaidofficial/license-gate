import crypto from 'crypto';

export interface IEncryptionService {
  encrypt(plaintext: string): Promise<string>
  decrypt(ciphertext: string): Promise<string>
  rotateKeys(): Promise<void>
  isEncrypted(value: string): boolean
}

interface EncryptedData {
  iv: string
  authTag: string
  data: string
  version: number
}

export class EncryptionService implements IEncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 16; // 128 bits
  private readonly tagLength = 16; // 128 bits
  private readonly version = 1;
  
  private encryptionKey: Buffer;
  private readonly encryptedPrefix = 'ENC:';

  constructor() {
    this.encryptionKey = this.getOrCreateEncryptionKey();
  }

  /**
   * Encrypt plaintext using AES-256-GCM
   */
  async encrypt(plaintext: string): Promise<string> {
    try {
      if (!plaintext || plaintext.trim() === '') {
        throw new Error('Cannot encrypt empty or null value');
      }

      // Generate random IV for each encryption
      const iv = crypto.randomBytes(this.ivLength);
      
      // Create cipher
      const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);
      cipher.setAAD(Buffer.from('settings-encryption'));

      // Encrypt the data
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Get authentication tag
      const authTag = cipher.getAuthTag();

      // Create encrypted data structure
      const encryptedData: EncryptedData = {
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
        data: encrypted,
        version: this.version
      };

      // Return base64 encoded JSON with prefix
      const encodedData = Buffer.from(JSON.stringify(encryptedData)).toString('base64');
      return `${this.encryptedPrefix}${encodedData}`;

    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Decrypt ciphertext using AES-256-GCM
   */
  async decrypt(ciphertext: string): Promise<string> {
    try {
      if (!ciphertext || !this.isEncrypted(ciphertext)) {
        throw new Error('Invalid encrypted data format');
      }

      // Remove prefix and decode base64
      const encodedData = ciphertext.substring(this.encryptedPrefix.length);
      const jsonData = Buffer.from(encodedData, 'base64').toString('utf8');
      
      let encryptedData: EncryptedData;
      try {
        encryptedData = JSON.parse(jsonData);
      } catch {
        throw new Error('Invalid encrypted data structure');
      }

      // Validate structure
      if (!encryptedData.iv || !encryptedData.authTag || !encryptedData.data) {
        throw new Error('Missing required encryption components');
      }

      // Convert hex strings back to buffers
      const iv = Buffer.from(encryptedData.iv, 'hex');
      const authTag = Buffer.from(encryptedData.authTag, 'hex');

      // Create decipher
      const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv);
      decipher.setAAD(Buffer.from('settings-encryption'));
      decipher.setAuthTag(authTag);

      // Decrypt the data
      let decrypted = decipher.update(encryptedData.data, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;

    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Rotate encryption keys (for future implementation)
   */
  async rotateKeys(): Promise<void> {
    try {
      // For now, this is a placeholder for key rotation functionality
      // In a production environment, this would:
      // 1. Generate new encryption key
      // 2. Re-encrypt all existing encrypted settings with new key
      // 3. Update key storage
      // 4. Clean up old keys after grace period
      
      console.log('Key rotation is not yet implemented');
      throw new Error('Key rotation functionality is not yet implemented');
      
    } catch (error) {
      console.error('Key rotation failed:', error);
      throw new Error(`Key rotation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if a value is encrypted
   */
  isEncrypted(value: string): boolean {
    if (!value || typeof value !== 'string') {
      return false;
    }
    
    return value.startsWith(this.encryptedPrefix);
  }

  /**
   * Get or create encryption key from environment or generate new one
   */
  private getOrCreateEncryptionKey(): Buffer {
    try {
      // Try to get key from environment variable
      const envKey = process.env.SETTINGS_ENCRYPTION_KEY;
      
      if (envKey) {
        // Validate key length
        const keyBuffer = Buffer.from(envKey, 'hex');
        if (keyBuffer.length === this.keyLength) {
          return keyBuffer;
        } else {
          console.warn('Invalid encryption key length in environment variable, generating new key');
        }
      }

      // Generate new key if not found or invalid
      const newKey = crypto.randomBytes(this.keyLength);
      
      // Log the key for development (remove in production)
      if (process.env.NODE_ENV === 'development') {
        console.log('Generated new encryption key:', newKey.toString('hex'));
        console.log('Add this to your .env file: SETTINGS_ENCRYPTION_KEY=' + newKey.toString('hex'));
      }

      return newKey;

    } catch (error) {
      console.error('Failed to initialize encryption key:', error);
      throw new Error('Failed to initialize encryption service');
    }
  }

  /**
   * Validate encryption key format
   */
  private isValidKey(key: string): boolean {
    try {
      const keyBuffer = Buffer.from(key, 'hex');
      return keyBuffer.length === this.keyLength;
    } catch {
      return false;
    }
  }

  /**
   * Generate a new encryption key (utility method)
   */
  static generateKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Test encryption/decryption functionality
   */
  async testEncryption(): Promise<boolean> {
    try {
      const testData = 'test-encryption-data-' + Date.now();
      const encrypted = await this.encrypt(testData);
      const decrypted = await this.decrypt(encrypted);
      
      return testData === decrypted;
    } catch (error) {
      console.error('Encryption test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const encryptionService = new EncryptionService();