/**
 * Configuration Loading System
 * 
 * This service implements a priority-based configuration loading system:
 * Priority: Database > Environment Variables > Default Values
 * 
 * Features:
 * - Dynamic configuration loading from multiple sources
 * - Memory caching for performance
 * - Configuration refresh mechanism
 * - Type-safe configuration access
 * - Hot-reload support
 */

import { settingsService } from './settings.service';
import { SettingsCategory } from '../types/settings';

// Configuration cache interface
interface ConfigCache {
  [key: string]: {
    value: any;
    timestamp: number;
    ttl: number; // Time to live in milliseconds
  };
}

// Configuration source priorities
enum ConfigSource {
  DATABASE = 1,
  ENVIRONMENT = 2,
  DEFAULT = 3
}

// Configuration types
export interface SmtpConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  sender: string;
  secure: boolean;
}

export interface OAuthConfig {
  googleClientId?: string;
  googleClientSecret?: string;
  githubClientId?: string;
  githubClientSecret?: string;
}

export interface GeneralConfig {
  siteName: string;
  supportEmail: string;
  maintenanceMode: boolean;
  registrationEnabled: boolean;
}

export interface SecurityConfig {
  sessionTimeout: number;
  maxLoginAttempts: number;
  passwordMinLength: number;
  requireTwoFactor: boolean;
}

export interface AppConfiguration {
  smtp: SmtpConfig;
  oauth: OAuthConfig;
  general: GeneralConfig;
  security: SecurityConfig;
}

export interface IConfigurationLoader {
  // Core loading methods
  loadConfiguration<T>(category: SettingsCategory): Promise<T>;
  getConfiguration<T>(category: SettingsCategory): Promise<T>;
  refreshConfiguration(category?: SettingsCategory): Promise<void>;
  
  // Specific configuration getters
  getSmtpConfig(): Promise<SmtpConfig>;
  getOAuthConfig(): Promise<OAuthConfig>;
  getGeneralConfig(): Promise<GeneralConfig>;
  getSecurityConfig(): Promise<SecurityConfig>;
  
  // Cache management
  clearCache(category?: SettingsCategory): void;
  getCacheStats(): { hits: number; misses: number; size: number };
}

export class ConfigurationLoader implements IConfigurationLoader {
  private cache: ConfigCache = {};
  private defaultCacheTTL = 5 * 60 * 1000; // 5 minutes
  private cacheStats = { hits: 0, misses: 0 };

  // Default configurations
  private readonly defaultConfigs = {
    [SettingsCategory.SMTP]: {
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '587'),
      username: process.env.SMTP_USERNAME || '',
      password: process.env.SMTP_PASSWORD || '',
      sender: process.env.SMTP_SENDER || 'noreply@localhost',
      secure: process.env.SMTP_SECURE === 'true'
    },
    [SettingsCategory.OAUTH]: {
      googleClientId: process.env.GOOGLE_CLIENT_ID || '',
      googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      githubClientId: process.env.GITHUB_CLIENT_ID || '',
      githubClientSecret: process.env.GITHUB_CLIENT_SECRET || ''
    },
    [SettingsCategory.GENERAL]: {
      siteName: process.env.SITE_NAME || 'LicenseGate',
      supportEmail: process.env.SUPPORT_EMAIL || 'support@licensegate.com',
      maintenanceMode: process.env.MAINTENANCE_MODE === 'true',
      registrationEnabled: process.env.REGISTRATION_ENABLED !== 'false'
    },
    [SettingsCategory.SECURITY]: {
      sessionTimeout: parseInt(process.env.SESSION_TIMEOUT || '3600'),
      maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5'),
      passwordMinLength: parseInt(process.env.PASSWORD_MIN_LENGTH || '8'),
      requireTwoFactor: process.env.REQUIRE_TWO_FACTOR === 'true'
    }
  };

  /**
   * Load configuration with priority-based loading
   * Priority: Database > Environment > Defaults
   */
  async loadConfiguration<T>(category: SettingsCategory): Promise<T> {
    const cacheKey = `config:${category}`;
    
    // Check cache first
    if (this.isCacheValid(cacheKey)) {
      this.cacheStats.hits++;
      return this.cache[cacheKey].value as T;
    }

    this.cacheStats.misses++;
    
    try {
      // Priority 1: Try to load from database
      const dbConfig = await this.loadFromDatabase(category);
      if (dbConfig && Object.keys(dbConfig).length > 0) {
        const config = this.mergeWithDefaults(category, dbConfig);
        this.setCache(cacheKey, config);
        console.log(`📊 Configuration loaded from DATABASE for ${category}`);
        return config as T;
      }
    } catch (error) {
      console.warn(`⚠️ Failed to load ${category} from database:`, error);
    }

    // Priority 2: Load from environment variables + defaults
    const envConfig = this.loadFromEnvironment(category);
    this.setCache(cacheKey, envConfig);
    console.log(`📊 Configuration loaded from ENVIRONMENT for ${category}`);
    return envConfig as T;
  }

  /**
   * Get configuration (alias for loadConfiguration)
   */
  async getConfiguration<T>(category: SettingsCategory): Promise<T> {
    return this.loadConfiguration<T>(category);
  }

  /**
   * Refresh configuration by clearing cache and reloading
   */
  async refreshConfiguration(category?: SettingsCategory): Promise<void> {
    if (category) {
      this.clearCache(category);
      await this.loadConfiguration(category);
      console.log(`🔄 Configuration refreshed for ${category}`);
    } else {
      // Refresh all configurations
      this.clearCache();
      for (const cat of Object.values(SettingsCategory)) {
        await this.loadConfiguration(cat);
      }
      console.log('🔄 All configurations refreshed');
    }
  }

  /**
   * Get SMTP configuration
   */
  async getSmtpConfig(): Promise<SmtpConfig> {
    return this.loadConfiguration<SmtpConfig>(SettingsCategory.SMTP);
  }

  /**
   * Get OAuth configuration
   */
  async getOAuthConfig(): Promise<OAuthConfig> {
    return this.loadConfiguration<OAuthConfig>(SettingsCategory.OAUTH);
  }

  /**
   * Get General configuration
   */
  async getGeneralConfig(): Promise<GeneralConfig> {
    return this.loadConfiguration<GeneralConfig>(SettingsCategory.GENERAL);
  }

  /**
   * Get Security configuration
   */
  async getSecurityConfig(): Promise<SecurityConfig> {
    return this.loadConfiguration<SecurityConfig>(SettingsCategory.SECURITY);
  }

  /**
   * Load configuration from database
   */
  private async loadFromDatabase(category: SettingsCategory): Promise<Record<string, any> | null> {
    try {
      const settings = await settingsService.getSettings(category);
      
      if (!settings || Object.keys(settings).length === 0) {
        return null;
      }

      // Convert string values to appropriate types
      return this.convertTypes(category, settings);
    } catch (error) {
      console.error(`Failed to load ${category} from database:`, error);
      return null;
    }
  }

  /**
   * Load configuration from environment variables
   */
  private loadFromEnvironment(category: SettingsCategory): Record<string, any> {
    return this.defaultConfigs[category] || {};
  }

  /**
   * Merge database config with defaults
   */
  private mergeWithDefaults(category: SettingsCategory, dbConfig: Record<string, any>): Record<string, any> {
    const defaults = this.defaultConfigs[category] || {};
    return { ...defaults, ...dbConfig };
  }

  /**
   * Convert string values from database to appropriate types
   */
  private convertTypes(category: SettingsCategory, settings: Record<string, string>): Record<string, any> {
    const converted: Record<string, any> = {};

    for (const [key, value] of Object.entries(settings)) {
      // Convert based on expected types
      if (key === 'port' || key === 'sessionTimeout' || key === 'maxLoginAttempts' || key === 'passwordMinLength') {
        converted[key] = parseInt(value) || 0;
      } else if (key === 'secure' || key === 'maintenanceMode' || key === 'registrationEnabled' || key === 'requireTwoFactor') {
        converted[key] = value === 'true';
      } else {
        converted[key] = value;
      }
    }

    return converted;
  }

  /**
   * Check if cache entry is valid
   */
  private isCacheValid(key: string): boolean {
    const entry = this.cache[key];
    if (!entry) return false;
    
    const now = Date.now();
    return now - entry.timestamp < entry.ttl;
  }

  /**
   * Set cache entry
   */
  private setCache(key: string, value: any, ttl: number = this.defaultCacheTTL): void {
    this.cache[key] = {
      value,
      timestamp: Date.now(),
      ttl
    };
  }

  /**
   * Clear cache
   */
  clearCache(category?: SettingsCategory): void {
    if (category) {
      const cacheKey = `config:${category}`;
      delete this.cache[cacheKey];
    } else {
      this.cache = {};
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { hits: number; misses: number; size: number } {
    return {
      hits: this.cacheStats.hits,
      misses: this.cacheStats.misses,
      size: Object.keys(this.cache).length
    };
  }

  /**
   * Preload all configurations
   */
  async preloadConfigurations(): Promise<void> {
    console.log('🚀 Preloading all configurations...');
    
    const categories = Object.values(SettingsCategory);
    const promises = categories.map(category => 
      this.loadConfiguration(category).catch(error => 
        console.error(`Failed to preload ${category}:`, error)
      )
    );
    
    await Promise.all(promises);
    console.log('✅ All configurations preloaded');
  }

  /**
   * Get configuration summary
   */
  async getConfigurationSummary(): Promise<Record<string, any>> {
    const summary: Record<string, any> = {};
    
    for (const category of Object.values(SettingsCategory)) {
      try {
        const config = await this.loadConfiguration(category);
        summary[category] = {
          loaded: true,
          keys: Object.keys(config as object),
          source: this.isCacheValid(`config:${category}`) ? 'cache' : 'fresh'
        };
      } catch (error) {
        summary[category] = {
          loaded: false,
          error: (error as Error).message
        };
      }
    }
    
    return summary;
  }
}

// Export singleton instance
export const configurationLoader = new ConfigurationLoader();
