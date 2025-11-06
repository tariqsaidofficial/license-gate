/**
 * Configuration Management Router
 * 
 * This router provides endpoints for managing dynamic configuration
 * including hot-reload, cache management, and configuration monitoring
 */

import { z } from 'zod';
import { protectedProcedure, router } from '../trpc';
import { configurationManager } from '../services/configuration-manager.service';
import { configurationLoader } from '../services/configuration-loader.service';
import { SettingsCategory } from '../types/settings';
import { ShowError } from '../utils/ShowError';

// Helper function to check admin access
async function requireAdmin(userId: number): Promise<void> {
  const { prisma } = await import('../prisma');
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isAdmin: true }
  });

  if (!user?.isAdmin) {
    throw new ShowError("Admin access required", "forbidden");
  }
}

// Validation schemas
const settingsCategorySchema = z.nativeEnum(SettingsCategory);

export const configurationRouter = router({
  // Get configuration status and summary
  getStatus: protectedProcedure
    .query(async ({ ctx }) => {
      await requireAdmin(ctx.userId);
      
      try {
        const status = await configurationManager.getConfigurationStatus();
        return {
          success: true,
          data: status
        };
      } catch (error) {
        console.error('Failed to get configuration status:', error);
        throw new ShowError("Failed to get configuration status", "internal-server-error");
      }
    }),

  // Get specific configuration
  getConfiguration: protectedProcedure
    .input(z.object({
      category: settingsCategorySchema
    }))
    .query(async ({ ctx, input }) => {
      await requireAdmin(ctx.userId);
      
      try {
        let config;
        
        switch (input.category) {
          case SettingsCategory.SMTP:
            config = await configurationManager.getSmtpConfig();
            break;
          case SettingsCategory.OAUTH:
            config = await configurationManager.getOAuthConfig();
            break;
          case SettingsCategory.GENERAL:
            config = await configurationManager.getGeneralConfig();
            break;
          case SettingsCategory.SECURITY:
            config = await configurationManager.getSecurityConfig();
            break;
          default:
            throw new ShowError(`Unknown configuration category: ${input.category}`, "invalid-schema");
        }
        
        return {
          success: true,
          data: config,
          category: input.category
        };
      } catch (error) {
        console.error(`Failed to get ${input.category} configuration:`, error);
        throw new ShowError(`Failed to get ${input.category} configuration`, "internal-server-error");
      }
    }),

  // Reload configuration (hot-reload)
  reloadConfiguration: protectedProcedure
    .input(z.object({
      category: settingsCategorySchema.optional()
    }))
    .mutation(async ({ ctx, input }) => {
      await requireAdmin(ctx.userId);
      
      try {
        console.log(`🔄 Admin ${ctx.userId} requested configuration reload${input.category ? ` for ${input.category}` : ''}`);
        
        await configurationManager.reloadConfiguration(input.category);
        
        return {
          success: true,
          message: `Configuration${input.category ? ` for ${input.category}` : 's'} reloaded successfully`,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        console.error('Failed to reload configuration:', error);
        throw new ShowError("Failed to reload configuration", "internal-server-error");
      }
    }),

  // Force refresh all configurations from database
  forceRefresh: protectedProcedure
    .mutation(async ({ ctx }) => {
      await requireAdmin(ctx.userId);
      
      try {
        console.log(`🔄 Admin ${ctx.userId} requested force refresh of all configurations`);
        
        await configurationManager.forceRefresh();
        
        return {
          success: true,
          message: 'All configurations force refreshed successfully',
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        console.error('Failed to force refresh configurations:', error);
        throw new ShowError("Failed to force refresh configurations", "internal-server-error");
      }
    }),

  // Clear configuration cache
  clearCache: protectedProcedure
    .input(z.object({
      category: settingsCategorySchema.optional()
    }))
    .mutation(async ({ ctx, input }) => {
      await requireAdmin(ctx.userId);
      
      try {
        console.log(`🗑️ Admin ${ctx.userId} requested cache clear${input.category ? ` for ${input.category}` : ''}`);
        
        configurationLoader.clearCache(input.category);
        
        return {
          success: true,
          message: `Cache${input.category ? ` for ${input.category}` : ''} cleared successfully`,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        console.error('Failed to clear cache:', error);
        throw new ShowError("Failed to clear cache", "internal-server-error");
      }
    }),

  // Get cache statistics
  getCacheStats: protectedProcedure
    .query(async ({ ctx }) => {
      await requireAdmin(ctx.userId);
      
      try {
        const stats = configurationManager.getCacheStats();
        
        return {
          success: true,
          data: stats
        };
      } catch (error) {
        console.error('Failed to get cache stats:', error);
        throw new ShowError("Failed to get cache stats", "internal-server-error");
      }
    }),

  // Validate all configurations
  validateConfigurations: protectedProcedure
    .query(async ({ ctx }) => {
      await requireAdmin(ctx.userId);
      
      try {
        const validation = await configurationManager.validateConfigurations();
        
        return {
          success: true,
          data: validation
        };
      } catch (error) {
        console.error('Failed to validate configurations:', error);
        throw new ShowError("Failed to validate configurations", "internal-server-error");
      }
    }),

  // Get configuration summary
  getSummary: protectedProcedure
    .query(async ({ ctx }) => {
      await requireAdmin(ctx.userId);
      
      try {
        const summary = await configurationLoader.getConfigurationSummary();
        const cacheStats = configurationManager.getCacheStats();
        const validation = await configurationManager.validateConfigurations();
        
        return {
          success: true,
          data: {
            configurations: summary,
            cache: cacheStats,
            validation,
            timestamp: new Date().toISOString()
          }
        };
      } catch (error) {
        console.error('Failed to get configuration summary:', error);
        throw new ShowError("Failed to get configuration summary", "internal-server-error");
      }
    }),

  // Initialize configuration manager (for startup)
  initialize: protectedProcedure
    .mutation(async ({ ctx }) => {
      await requireAdmin(ctx.userId);
      
      try {
        console.log(`🚀 Admin ${ctx.userId} requested configuration manager initialization`);
        
        await configurationManager.initialize();
        
        return {
          success: true,
          message: 'Configuration manager initialized successfully',
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        console.error('Failed to initialize configuration manager:', error);
        throw new ShowError("Failed to initialize configuration manager", "internal-server-error");
      }
    }),

  // Get configuration change history (placeholder for future implementation)
  getChangeHistory: protectedProcedure
    .input(z.object({
      category: settingsCategorySchema.optional(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0)
    }))
    .query(async ({ ctx, input }) => {
      await requireAdmin(ctx.userId);
      
      try {
        // This would be implemented to return actual change history
        // For now, return empty array
        const history = configurationManager.getChangeHistory();
        
        return {
          success: true,
          data: {
            changes: history.slice(input.offset, input.offset + input.limit),
            total: history.length,
            limit: input.limit,
            offset: input.offset
          }
        };
      } catch (error) {
        console.error('Failed to get change history:', error);
        throw new ShowError("Failed to get change history", "internal-server-error");
      }
    }),

  // Test configuration (dry run)
  testConfiguration: protectedProcedure
    .input(z.object({
      category: settingsCategorySchema,
      testData: z.record(z.string()).optional()
    }))
    .mutation(async ({ ctx, input }) => {
      await requireAdmin(ctx.userId);
      
      try {
        console.log(`🧪 Admin ${ctx.userId} requested configuration test for ${input.category}`);
        
        // Get current configuration
        const config = await configurationLoader.getConfiguration(input.category);
        
        // This could be extended to actually test the configuration
        // For now, just return the current config
        return {
          success: true,
          data: {
            category: input.category,
            configuration: config,
            testResult: 'Configuration loaded successfully',
            timestamp: new Date().toISOString()
          }
        };
      } catch (error) {
        console.error(`Failed to test ${input.category} configuration:`, error);
        throw new ShowError(`Failed to test ${input.category} configuration`, "internal-server-error");
      }
    })
});
