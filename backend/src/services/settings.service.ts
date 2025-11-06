import { prisma } from '../prisma';
import {
    DEFAULT_SETTINGS,
    SENSITIVE_KEYS,
    SettingAuditAction,
    SettingsCategory,
    SmtpSettings,
    TestResult,
    ValidationError,
    ValidationResult
} from '../types/settings';
import { encryptionService } from './encryption.service';
import { smtpTestService } from './smtp-test.service';

export interface ISettingsService {
  // CRUD Operations
  getSetting(category: string, key: string): Promise<string | null>
  getSettings(category: string): Promise<Record<string, string>>
  setSetting(category: string, key: string, value: string, userId: number, isEncrypted?: boolean): Promise<void>
  deleteSetting(category: string, key: string, userId: number): Promise<void>
  
  // Bulk Operations
  setSettings(category: string, settings: Record<string, string>, userId: number): Promise<void>
  getAllSettings(): Promise<Record<string, Record<string, string>>>
  
  // Utility Methods
  isSettingEncrypted(key: string): boolean
  getDefaultSettings(category: SettingsCategory): Record<string, string>
  
  // Testing Methods
  testSmtpSettings(settings: SmtpSettings): Promise<TestResult>
  sendTestEmail(settings: SmtpSettings, recipientEmail: string, templateData?: any): Promise<TestResult>
}

export class SettingsService implements ISettingsService {
  
  /**
   * Get a single setting value
   */
  async getSetting(category: string, key: string): Promise<string | null> {
    try {
      const setting = await prisma.setting.findUnique({
        where: {
          category_key: {
            category,
            key
          }
        }
      });

      if (!setting || !setting.isActive) {
        return null;
      }

      // Decrypt if encrypted
      if (setting.isEncrypted && setting.value && encryptionService.isEncrypted(setting.value)) {
        return await encryptionService.decrypt(setting.value);
      }

      return setting.value;
    } catch (error) {
      console.error(`Error getting setting ${category}.${key}:`, error);
      throw new Error(`Failed to get setting: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all settings for a category
   */
  async getSettings(category: string): Promise<Record<string, string>> {
    try {
      const settings = await prisma.setting.findMany({
        where: {
          category,
          isActive: true
        },
        orderBy: {
          key: 'asc'
        }
      });

      const result: Record<string, string> = {};
      
      for (const setting of settings) {
        if (setting.value !== null) {
          // Decrypt if encrypted
          if (setting.isEncrypted && encryptionService.isEncrypted(setting.value)) {
            try {
              result[setting.key] = await encryptionService.decrypt(setting.value);
            } catch (error) {
              console.error(`Failed to decrypt setting ${setting.category}.${setting.key}:`, error);
              // Skip this setting if decryption fails
              continue;
            }
          } else {
            result[setting.key] = setting.value;
          }
        }
      }

      return result;
    } catch (error) {
      console.error(`Error getting settings for category ${category}:`, error);
      throw new Error(`Failed to get settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Set a single setting value
   */
  async setSetting(
    category: string, 
    key: string, 
    value: string, 
    userId: number,
    isEncrypted?: boolean
  ): Promise<void> {
    try {
      // Determine if setting should be encrypted
      const shouldEncrypt = isEncrypted ?? this.isSettingEncrypted(key);
      
      // Encrypt value if needed
      let finalValue = value;
      if (shouldEncrypt && value) {
        finalValue = await encryptionService.encrypt(value);
      }
      
      // Get existing setting for audit trail
      const existingSetting = await prisma.setting.findUnique({
        where: {
          category_key: {
            category,
            key
          }
        }
      });

      const oldValue = existingSetting?.value || null;
      
      // Upsert the setting
      const setting = await prisma.setting.upsert({
        where: {
          category_key: {
            category,
            key
          }
        },
        update: {
          value: finalValue,
          isEncrypted: shouldEncrypt,
          updatedBy: userId,
          updatedAt: new Date()
        },
        create: {
          category,
          key,
          value: finalValue,
          isEncrypted: shouldEncrypt,
          createdBy: userId,
          updatedBy: userId
        }
      });

      // Create audit record
      await this.createAuditRecord({
        settingId: setting.id,
        category,
        key,
        oldValue,
        newValue: value,
        action: existingSetting ? SettingAuditAction.UPDATE : SettingAuditAction.CREATE,
        userId
      });

    } catch (error) {
      console.error(`Error setting ${category}.${key}:`, error);
      throw new Error(`Failed to set setting: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a setting
   */
  async deleteSetting(category: string, key: string, userId: number): Promise<void> {
    try {
      const existingSetting = await prisma.setting.findUnique({
        where: {
          category_key: {
            category,
            key
          }
        }
      });

      if (!existingSetting) {
        throw new Error(`Setting ${category}.${key} not found`);
      }

      // Soft delete by setting isActive to false
      await prisma.setting.update({
        where: {
          category_key: {
            category,
            key
          }
        },
        data: {
          isActive: false,
          updatedBy: userId,
          updatedAt: new Date()
        }
      });

      // Create audit record
      await this.createAuditRecord({
        settingId: existingSetting.id,
        category,
        key,
        oldValue: existingSetting.value,
        newValue: null,
        action: SettingAuditAction.DELETE,
        userId
      });

    } catch (error) {
      console.error(`Error deleting setting ${category}.${key}:`, error);
      throw new Error(`Failed to delete setting: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Set multiple settings for a category
   */
  async setSettings(
    category: string, 
    settings: Record<string, string>, 
    userId: number
  ): Promise<void> {
    try {
      // Use transaction to ensure all settings are updated together
      await prisma.$transaction(async (tx) => {
        for (const [key, value] of Object.entries(settings)) {
          const shouldEncrypt = this.isSettingEncrypted(key);
          
          // Encrypt value if needed
          let finalValue = value;
          if (shouldEncrypt && value) {
            finalValue = await encryptionService.encrypt(value);
          }
          
          // Get existing setting for audit trail
          const existingSetting = await tx.setting.findUnique({
            where: {
              category_key: {
                category,
                key
              }
            }
          });

          const oldValue = existingSetting?.value || null;
          
          // Upsert the setting
          const setting = await tx.setting.upsert({
            where: {
              category_key: {
                category,
                key
              }
            },
            update: {
              value: finalValue,
              isEncrypted: shouldEncrypt,
              updatedBy: userId,
              updatedAt: new Date()
            },
            create: {
              category,
              key,
              value: finalValue,
              isEncrypted: shouldEncrypt,
              createdBy: userId,
              updatedBy: userId
            }
          });

          // Create audit record
          await tx.settingAudit.create({
            data: {
              settingId: setting.id,
              category,
              key,
              oldValue,
              newValue: value,
              action: existingSetting ? SettingAuditAction.UPDATE : SettingAuditAction.CREATE,
              userId,
              timestamp: new Date()
            }
          });
        }
      });

    } catch (error) {
      console.error(`Error setting multiple settings for category ${category}:`, error);
      throw new Error(`Failed to set settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all settings grouped by category
   */
  async getAllSettings(): Promise<Record<string, Record<string, string>>> {
    try {
      const settings = await prisma.setting.findMany({
        where: {
          isActive: true
        },
        orderBy: [
          { category: 'asc' },
          { key: 'asc' }
        ]
      });

      const result: Record<string, Record<string, string>> = {};
      
      for (const setting of settings) {
        if (!result[setting.category]) {
          result[setting.category] = {};
        }
        
        if (setting.value !== null) {
          // Decrypt if encrypted
          if (setting.isEncrypted && encryptionService.isEncrypted(setting.value)) {
            try {
              result[setting.category][setting.key] = await encryptionService.decrypt(setting.value);
            } catch (error) {
              console.error(`Failed to decrypt setting ${setting.category}.${setting.key}:`, error);
              // Skip this setting if decryption fails
              continue;
            }
          } else {
            result[setting.category][setting.key] = setting.value;
          }
        }
      }

      return result;
    } catch (error) {
      console.error('Error getting all settings:', error);
      throw new Error(`Failed to get all settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if a setting key should be encrypted
   */
  isSettingEncrypted(key: string): boolean {
    return SENSITIVE_KEYS.some(sensitiveKey => 
      key.toLowerCase().includes(sensitiveKey.toLowerCase())
    );
  }

  /**
   * Get default settings for a category
   */
  getDefaultSettings(category: SettingsCategory): Record<string, string> {
    return DEFAULT_SETTINGS[category] || {};
  }

  /**
   * Create audit record for setting changes
   */
  private async createAuditRecord(data: {
    settingId: number;
    category: string;
    key: string;
    oldValue: string | null;
    newValue: string | null;
    action: SettingAuditAction;
    userId: number;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    try {
      await prisma.settingAudit.create({
        data: {
          settingId: data.settingId,
          category: data.category,
          key: data.key,
          oldValue: data.oldValue,
          newValue: data.newValue,
          action: data.action,
          userId: data.userId,
          timestamp: new Date(),
          ipAddress: data.ipAddress || null,
          userAgent: data.userAgent || null
        }
      });
    } catch (error) {
      console.error('Error creating audit record:', error);
      // Don't throw here to avoid breaking the main operation
    }
  }

  /**
   * Validate settings for a category
   */
  async validateSettings(category: string, settings: Record<string, string>): Promise<ValidationResult> {
    const errors: ValidationError[] = [];

    try {
      // Basic validation based on category
      switch (category) {
        case SettingsCategory.SMTP:
          errors.push(...this.validateSmtpSettings(settings));
          break;
        case SettingsCategory.OAUTH:
          errors.push(...this.validateOAuthSettings(settings));
          break;
        case SettingsCategory.GENERAL:
          errors.push(...this.validateGeneralSettings(settings));
          break;
        case SettingsCategory.SECURITY:
          errors.push(...this.validateSecuritySettings(settings));
          break;
      }

      return {
        isValid: errors.length === 0,
        errors
      };
    } catch (error) {
      console.error(`Error validating settings for category ${category}:`, error);
      return {
        isValid: false,
        errors: [{
          field: 'general',
          message: 'Validation failed due to internal error',
          code: 'VALIDATION_ERROR'
        }]
      };
    }
  }

  /**
   * Validate SMTP settings
   */
  private validateSmtpSettings(settings: Record<string, string>): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!settings.host || settings.host.trim() === '') {
      errors.push({
        field: 'host',
        message: 'SMTP host is required',
        code: 'REQUIRED'
      });
    }

    if (settings.port) {
      const port = parseInt(settings.port);
      if (isNaN(port) || port < 1 || port > 65535) {
        errors.push({
          field: 'port',
          message: 'SMTP port must be between 1 and 65535',
          code: 'INVALID_RANGE'
        });
      }
    }

    if (settings.username && !this.isValidEmail(settings.username)) {
      errors.push({
        field: 'username',
        message: 'SMTP username must be a valid email address',
        code: 'INVALID_EMAIL'
      });
    }

    if (!settings.sender || settings.sender.trim() === '') {
      errors.push({
        field: 'sender',
        message: 'SMTP sender is required',
        code: 'REQUIRED'
      });
    }

    return errors;
  }

  /**
   * Validate OAuth settings
   */
  private validateOAuthSettings(settings: Record<string, string>): ValidationError[] {
    const errors: ValidationError[] = [];

    // Google OAuth validation
    if (settings.googleClientId && !settings.googleClientSecret) {
      errors.push({
        field: 'googleClientSecret',
        message: 'Google Client Secret is required when Client ID is provided',
        code: 'REQUIRED'
      });
    }

    if (settings.googleClientSecret && !settings.googleClientId) {
      errors.push({
        field: 'googleClientId',
        message: 'Google Client ID is required when Client Secret is provided',
        code: 'REQUIRED'
      });
    }

    // GitHub OAuth validation
    if (settings.githubClientId && !settings.githubClientSecret) {
      errors.push({
        field: 'githubClientSecret',
        message: 'GitHub Client Secret is required when Client ID is provided',
        code: 'REQUIRED'
      });
    }

    if (settings.githubClientSecret && !settings.githubClientId) {
      errors.push({
        field: 'githubClientId',
        message: 'GitHub Client ID is required when Client Secret is provided',
        code: 'REQUIRED'
      });
    }

    return errors;
  }

  /**
   * Validate general settings
   */
  private validateGeneralSettings(settings: Record<string, string>): ValidationError[] {
    const errors: ValidationError[] = [];

    if (settings.supportEmail && !this.isValidEmail(settings.supportEmail)) {
      errors.push({
        field: 'supportEmail',
        message: 'Support email must be a valid email address',
        code: 'INVALID_EMAIL'
      });
    }

    return errors;
  }

  /**
   * Validate security settings
   */
  private validateSecuritySettings(settings: Record<string, string>): ValidationError[] {
    const errors: ValidationError[] = [];

    if (settings.sessionTimeout) {
      const timeout = parseInt(settings.sessionTimeout);
      if (isNaN(timeout) || timeout < 300 || timeout > 86400) {
        errors.push({
          field: 'sessionTimeout',
          message: 'Session timeout must be between 300 and 86400 seconds',
          code: 'INVALID_RANGE'
        });
      }
    }

    if (settings.maxLoginAttempts) {
      const attempts = parseInt(settings.maxLoginAttempts);
      if (isNaN(attempts) || attempts < 1 || attempts > 20) {
        errors.push({
          field: 'maxLoginAttempts',
          message: 'Max login attempts must be between 1 and 20',
          code: 'INVALID_RANGE'
        });
      }
    }

    if (settings.passwordMinLength) {
      const length = parseInt(settings.passwordMinLength);
      if (isNaN(length) || length < 6 || length > 128) {
        errors.push({
          field: 'passwordMinLength',
          message: 'Password minimum length must be between 6 and 128',
          code: 'INVALID_RANGE'
        });
      }
    }

    return errors;
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Test SMTP settings without saving
   */
  async testSmtpSettings(settings: SmtpSettings): Promise<TestResult> {
    try {
      return await smtpTestService.testSmtpConnection(settings);
    } catch (error) {
      console.error('SMTP test failed:', error);
      return {
        success: false,
        message: `SMTP test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error }
      };
    }
  }

  /**
   * Send test email using provided SMTP settings
   */
  async sendTestEmail(
    settings: SmtpSettings, 
    recipientEmail: string, 
    templateData?: any
  ): Promise<TestResult> {
    try {
      return await smtpTestService.sendTestEmail(settings, recipientEmail, templateData);
    } catch (error) {
      console.error('Test email sending failed:', error);
      return {
        success: false,
        message: `Test email failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error, recipientEmail }
      };
    }
  }

  /**
   * Get current SMTP settings from database
   */
  async getCurrentSmtpSettings(): Promise<SmtpSettings | null> {
    try {
      const smtpSettings = await this.getSettings(SettingsCategory.SMTP);
      
      if (!smtpSettings.host) {
        return null;
      }

      return {
        host: smtpSettings.host,
        port: parseInt(smtpSettings.port) || 587,
        username: smtpSettings.username || '',
        password: smtpSettings.password || '',
        sender: smtpSettings.sender || '',
        secure: smtpSettings.secure === 'true'
      };
    } catch (error) {
      console.error('Failed to get current SMTP settings:', error);
      return null;
    }
  }

  /**
   * Test current SMTP settings from database
   */
  async testCurrentSmtpSettings(): Promise<TestResult> {
    try {
      const currentSettings = await this.getCurrentSmtpSettings();
      
      if (!currentSettings) {
        return {
          success: false,
          message: 'No SMTP settings found in database',
          details: {}
        };
      }

      return await this.testSmtpSettings(currentSettings);
    } catch (error) {
      console.error('Failed to test current SMTP settings:', error);
      return {
        success: false,
        message: `Failed to test current SMTP settings: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error }
      };
    }
  }
}

// Export singleton instance
export const settingsService = new SettingsService();