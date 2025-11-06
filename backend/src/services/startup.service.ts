/**
 * Startup Service
 * 
 * This service handles application startup initialization
 * including configuration loading and service initialization
 */

import { configurationManager } from './configuration-manager.service';
import { initializeMailer } from '../utils/mailer';

export interface StartupOptions {
  skipConfigurationInit?: boolean;
  skipMailerInit?: boolean;
}

export class StartupService {
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;

  /**
   * Initialize all application services
   */
  async initialize(options: StartupOptions = {}): Promise<void> {
    if (this.isInitialized) {
      console.log('✅ Application already initialized');
      return;
    }

    if (this.initializationPromise) {
      console.log('⏳ Waiting for ongoing initialization...');
      return this.initializationPromise;
    }

    this.initializationPromise = this.performInitialization(options);
    await this.initializationPromise;
  }

  /**
   * Perform the actual initialization
   */
  private async performInitialization(options: StartupOptions): Promise<void> {
    console.log('🚀 Starting application initialization...');
    
    try {
      // Initialize configuration manager
      if (!options.skipConfigurationInit) {
        console.log('📊 Initializing configuration manager...');
        await configurationManager.initialize();
        console.log('✅ Configuration manager initialized');
      }

      // Initialize mailer with dynamic configuration
      if (!options.skipMailerInit) {
        console.log('📧 Initializing mailer...');
        initializeMailer();
        console.log('✅ Mailer initialized');
      }

      // Add more service initializations here as needed
      // Example:
      // - Database connection pools
      // - Redis connections
      // - External service connections
      // - Scheduled jobs
      // - Monitoring services

      this.isInitialized = true;
      console.log('🎉 Application initialization completed successfully');
      
    } catch (error) {
      console.error('❌ Application initialization failed:', error);
      this.initializationPromise = null;
      throw error;
    }
  }

  /**
   * Check if application is initialized
   */
  isAppInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Get initialization status
   */
  getInitializationStatus(): {
    initialized: boolean;
    configurationManager: boolean;
    mailer: boolean;
  } {
    return {
      initialized: this.isInitialized,
      configurationManager: true, // We can add more detailed checks later
      mailer: true
    };
  }

  /**
   * Reinitialize application (useful for testing or recovery)
   */
  async reinitialize(options: StartupOptions = {}): Promise<void> {
    console.log('🔄 Reinitializing application...');
    
    this.isInitialized = false;
    this.initializationPromise = null;
    
    await this.initialize(options);
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    console.log('🛑 Starting graceful shutdown...');
    
    try {
      // Add cleanup logic here
      // Example:
      // - Close database connections
      // - Stop scheduled jobs
      // - Clear caches
      // - Close external connections
      
      this.isInitialized = false;
      this.initializationPromise = null;
      
      console.log('✅ Graceful shutdown completed');
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const startupService = new StartupService();
