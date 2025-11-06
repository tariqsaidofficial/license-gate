/**
 * Configuration Manager Service
 * 
 * This service manages configuration hot-reload and provides
 * a centralized way to access configurations across the application
 */

import { EventEmitter } from 'events';
import { configurationLoader, AppConfiguration } from './configuration-loader.service';
import { SettingsCategory } from '../types/settings';

// Configuration change events
export interface ConfigurationChangeEvent {
  category: SettingsCategory;
  oldConfig: any;
  newConfig: any;
  timestamp: Date;
  source: 'database' | 'manual' | 'startup';
}

export interface IConfigurationManager {
  // Configuration access
  getSmtpConfig(): Promise<any>;
  getOAuthConfig(): Promise<any>;
  getGeneralConfig(): Promise<any>;
  getSecurityConfig(): Promise<any>;
  
  // Configuration management
  reloadConfiguration(category?: SettingsCategory): Promise<void>;
  watchConfiguration(category: SettingsCategory, callback: (event: ConfigurationChangeEvent) => void): void;
  unwatchConfiguration(category: SettingsCategory, callback: (event: ConfigurationChangeEvent) => void): void;
  
  // Status and monitoring
  getConfigurationStatus(): Promise<Record<string, any>>;
  getCacheStats(): { hits: number; misses: number; size: number };
}

export class ConfigurationManager extends EventEmitter implements IConfigurationManager {
  private watchers: Map<SettingsCategory, Set<(event: ConfigurationChangeEvent) => void>> = new Map();
  private lastConfigurations: Map<SettingsCategory, any> = new Map();
  private isInitialized = false;

  constructor() {
    super();
    this.setMaxListeners(50); // Allow many listeners
  }

  /**
   * Initialize the configuration manager
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('🚀 Initializing Configuration Manager...');
    
    try {
      // Preload all configurations
      await configurationLoader.preloadConfigurations();
      
      // Store initial configurations for change detection
      await this.storeInitialConfigurations();
      
      this.isInitialized = true;
      console.log('✅ Configuration Manager initialized');
      
      // Emit initialization event
      this.emit('initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Configuration Manager:', error);
      throw error;
    }
  }

  /**
   * Get SMTP configuration
   */
  async getSmtpConfig(): Promise<any> {
    return configurationLoader.getSmtpConfig();
  }

  /**
   * Get OAuth configuration
   */
  async getOAuthConfig(): Promise<any> {
    return configurationLoader.getOAuthConfig();
  }

  /**
   * Get General configuration
   */
  async getGeneralConfig(): Promise<any> {
    return configurationLoader.getGeneralConfig();
  }

  /**
   * Get Security configuration
   */
  async getSecurityConfig(): Promise<any> {
    return configurationLoader.getSecurityConfig();
  }

  /**
   * Reload configuration and detect changes
   */
  async reloadConfiguration(category?: SettingsCategory): Promise<void> {
    console.log(`🔄 Reloading configuration${category ? ` for ${category}` : 's'}...`);
    
    if (category) {
      await this.reloadSingleConfiguration(category);
    } else {
      // Reload all configurations
      for (const cat of Object.values(SettingsCategory)) {
        await this.reloadSingleConfiguration(cat);
      }
    }
  }

  /**
   * Reload a single configuration category
   */
  private async reloadSingleConfiguration(category: SettingsCategory): Promise<void> {
    try {
      // Get old configuration
      const oldConfig = this.lastConfigurations.get(category);
      
      // Clear cache and reload
      configurationLoader.clearCache(category);
      const newConfig = await configurationLoader.loadConfiguration(category);
      
      // Store new configuration
      this.lastConfigurations.set(category, newConfig);
      
      // Check for changes
      if (this.hasConfigurationChanged(oldConfig, newConfig)) {
        const changeEvent: ConfigurationChangeEvent = {
          category,
          oldConfig,
          newConfig,
          timestamp: new Date(),
          source: 'manual'
        };
        
        // Emit change event
        this.emit('configurationChanged', changeEvent);
        this.emit(`${category}Changed`, changeEvent);
        
        // Notify watchers
        this.notifyWatchers(category, changeEvent);
        
        console.log(`✅ Configuration changed for ${category}`);
      } else {
        console.log(`📊 No changes detected for ${category}`);
      }
    } catch (error) {
      console.error(`❌ Failed to reload ${category} configuration:`, error);
      throw error;
    }
  }

  /**
   * Watch for configuration changes
   */
  watchConfiguration(category: SettingsCategory, callback: (event: ConfigurationChangeEvent) => void): void {
    if (!this.watchers.has(category)) {
      this.watchers.set(category, new Set());
    }
    
    this.watchers.get(category)!.add(callback);
    console.log(`👁️ Added watcher for ${category} configuration`);
  }

  /**
   * Stop watching configuration changes
   */
  unwatchConfiguration(category: SettingsCategory, callback: (event: ConfigurationChangeEvent) => void): void {
    const categoryWatchers = this.watchers.get(category);
    if (categoryWatchers) {
      categoryWatchers.delete(callback);
      console.log(`👁️ Removed watcher for ${category} configuration`);
    }
  }

  /**
   * Get configuration status
   */
  async getConfigurationStatus(): Promise<Record<string, any>> {
    const summary = await configurationLoader.getConfigurationSummary();
    const cacheStats = this.getCacheStats();
    
    return {
      initialized: this.isInitialized,
      configurations: summary,
      cache: cacheStats,
      watchers: Object.fromEntries(
        Array.from(this.watchers.entries()).map(([category, watchers]) => [
          category,
          watchers.size
        ])
      ),
      lastUpdate: new Date().toISOString()
    };
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { hits: number; misses: number; size: number } {
    return configurationLoader.getCacheStats();
  }

  /**
   * Store initial configurations for change detection
   */
  private async storeInitialConfigurations(): Promise<void> {
    for (const category of Object.values(SettingsCategory)) {
      try {
        const config = await configurationLoader.loadConfiguration(category);
        this.lastConfigurations.set(category, config);
      } catch (error) {
        console.warn(`⚠️ Failed to store initial configuration for ${category}:`, error);
      }
    }
  }

  /**
   * Check if configuration has changed
   */
  private hasConfigurationChanged(oldConfig: any, newConfig: any): boolean {
    if (!oldConfig && !newConfig) return false;
    if (!oldConfig || !newConfig) return true;
    
    return JSON.stringify(oldConfig) !== JSON.stringify(newConfig);
  }

  /**
   * Notify watchers of configuration changes
   */
  private notifyWatchers(category: SettingsCategory, event: ConfigurationChangeEvent): void {
    const categoryWatchers = this.watchers.get(category);
    if (categoryWatchers) {
      categoryWatchers.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error(`❌ Error in configuration watcher for ${category}:`, error);
        }
      });
    }
  }

  /**
   * Force refresh all configurations from database
   */
  async forceRefresh(): Promise<void> {
    console.log('🔄 Force refreshing all configurations...');
    
    // Clear all caches
    configurationLoader.clearCache();
    
    // Reload all configurations
    await this.reloadConfiguration();
    
    console.log('✅ Force refresh completed');
  }

  /**
   * Get configuration change history (if needed for debugging)
   */
  getChangeHistory(): ConfigurationChangeEvent[] {
    // This could be implemented to store change history
    // For now, return empty array
    return [];
  }

  /**
   * Validate configuration integrity
   */
  async validateConfigurations(): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    try {
      // Validate SMTP configuration
      const smtpConfig = await this.getSmtpConfig();
      if (!smtpConfig.host) {
        errors.push('SMTP host is missing');
      }
      if (!smtpConfig.sender) {
        errors.push('SMTP sender is missing');
      }
      
      // Validate General configuration
      const generalConfig = await this.getGeneralConfig();
      if (!generalConfig.siteName) {
        errors.push('Site name is missing');
      }
      if (!generalConfig.supportEmail) {
        errors.push('Support email is missing');
      }
      
      // Add more validations as needed
      
    } catch (error) {
      errors.push(`Configuration validation error: ${(error as Error).message}`);
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Export singleton instance
export const configurationManager = new ConfigurationManager();
