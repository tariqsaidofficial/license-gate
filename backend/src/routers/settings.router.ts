import { z } from 'zod';
import { settingsService } from '../services/settings.service';
import { protectedProcedure, router } from '../trpc';
import { SettingsCategory } from '../types/settings';
import { ShowError } from '../utils/ShowError';
import {
  smtpSettingsSchema,
  oauthSettingsSchema,
  generalSettingsSchema,
  securitySettingsSchema,
  testEmailSchema,
  settingsCategorySchema,
  convertToStringRecord
} from '../utils/validation.schemas';

// Helper function to check admin access
const requireAdmin = async (userId: number) => {
  const { prisma } = await import('../prisma');
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isAdmin: true }
  });
  
  if (!user?.isAdmin) {
    throw new ShowError("Admin access required", "unauthorized");
  }
};

export const settingsRouter = router({
  // Get settings by category
  getSettings: protectedProcedure
    .input(z.object({
      category: settingsCategorySchema
    }))
    .query(async ({ ctx, input }) => {
      await requireAdmin(ctx.userId);
      
      try {
        const settings = await settingsService.getSettings(input.category);
        return {
          success: true,
          data: settings
        };
      } catch (error) {
        console.error(`Failed to get ${input.category} settings:`, error);
        throw new ShowError(`Failed to get ${input.category} settings`, "internal-server-error");
      }
    }),

  // Update SMTP settings
  updateSmtpSettings: protectedProcedure
    .input(smtpSettingsSchema)
    .mutation(async ({ ctx, input }) => {
      await requireAdmin(ctx.userId);
      
      try {
        console.log('📧 Updating SMTP settings:', {
          host: input.host,
          port: input.port,
          username: input.username,
          sender: input.sender,
          secure: input.secure
        });

        // Convert to string format for storage
        const settingsToSave = convertToStringRecord(input);

        await settingsService.setSettings(SettingsCategory.SMTP, settingsToSave, ctx.userId);
        
        console.log('✅ SMTP settings saved successfully');
        
        return {
          success: true,
          message: 'SMTP settings updated successfully'
        };
      } catch (error) {
        console.error('❌ Failed to update SMTP settings:', error);
        
        // More specific error message
        if (error instanceof Error) {
          throw new ShowError(error.message || "Failed to update SMTP settings", "internal-server-error");
        }
        
        throw new ShowError("Failed to update SMTP settings", "internal-server-error");
      }
    }),

  // Update OAuth settings
  updateOAuthSettings: protectedProcedure
    .input(oauthSettingsSchema)
    .mutation(async ({ ctx, input }) => {
      await requireAdmin(ctx.userId);
      
      try {
        // Convert to string format for storage (filters out undefined)
        const settingsToSave = convertToStringRecord(input);

        await settingsService.setSettings(SettingsCategory.OAUTH, settingsToSave, ctx.userId);
        
        return {
          success: true,
          message: 'OAuth settings updated successfully'
        };
      } catch (error) {
        console.error('Failed to update OAuth settings:', error);
        throw new ShowError("Failed to update OAuth settings", "internal-server-error");
      }
    }),

  // Update general settings
  updateGeneralSettings: protectedProcedure
    .input(generalSettingsSchema)
    .mutation(async ({ ctx, input }) => {
      await requireAdmin(ctx.userId);
      
      try {
        // Convert to string format for storage (filters out undefined)
        const settingsToSave = convertToStringRecord(input);

        await settingsService.setSettings(SettingsCategory.GENERAL, settingsToSave, ctx.userId);
        
        return {
          success: true,
          message: 'General settings updated successfully'
        };
      } catch (error) {
        console.error('Failed to update general settings:', error);
        throw new ShowError("Failed to update general settings", "internal-server-error");
      }
    }),

  // Update security settings
  updateSecuritySettings: protectedProcedure
    .input(securitySettingsSchema)
    .mutation(async ({ ctx, input }) => {
      await requireAdmin(ctx.userId);
      
      try {
        // Convert to string format for storage (filters out undefined)
        const settingsToSave = convertToStringRecord(input);

        await settingsService.setSettings(SettingsCategory.SECURITY, settingsToSave, ctx.userId);
        
        return {
          success: true,
          message: 'Security settings updated successfully'
        };
      } catch (error) {
        console.error('Failed to update security settings:', error);
        throw new ShowError("Failed to update security settings", "internal-server-error");
      }
    }),

  // Test SMTP connection
  testSmtpConnection: protectedProcedure
    .input(smtpSettingsSchema)
    .mutation(async ({ ctx, input }) => {
      await requireAdmin(ctx.userId);
      
      try {
        const result = await settingsService.testSmtpSettings(input);
        return result;
      } catch (error) {
        console.error('SMTP connection test failed:', error);
        throw new ShowError("SMTP connection test failed", "internal-server-error");
      }
    }),

  // Send test email
  sendTestEmail: protectedProcedure
    .input(testEmailSchema)
    .mutation(async ({ ctx, input }) => {
      await requireAdmin(ctx.userId);
      
      try {
        const result = await settingsService.sendTestEmail(
          input.smtpSettings, 
          input.recipientEmail, 
          input.templateData
        );
        return result;
      } catch (error) {
        console.error('Test email sending failed:', error);
        throw new ShowError("Test email sending failed", "internal-server-error");
      }
    }),

  // Test current SMTP settings
  testCurrentSmtp: protectedProcedure
    .mutation(async ({ ctx }) => {
      await requireAdmin(ctx.userId);
      
      try {
        const result = await settingsService.testCurrentSmtpSettings();
        return result;
      } catch (error) {
        console.error('Current SMTP test failed:', error);
        throw new ShowError("Current SMTP test failed", "internal-server-error");
      }
    }),

  // Send test email with current settings
  sendTestEmailCurrent: protectedProcedure
    .input(z.object({
      recipientEmail: z.string().email("Invalid recipient email"),
      templateData: z.object({
        siteName: z.string().optional(),
        userName: z.string().optional()
      }).optional()
    }))
    .mutation(async ({ ctx, input }) => {
      await requireAdmin(ctx.userId);
      
      try {
        const currentSettings = await settingsService.getCurrentSmtpSettings();
        
        if (!currentSettings) {
          return {
            success: false,
            message: 'No SMTP settings configured',
            details: {}
          };
        }

        const result = await settingsService.sendTestEmail(
          currentSettings, 
          input.recipientEmail, 
          input.templateData
        );
        return result;
      } catch (error) {
        console.error('Test email with current settings failed:', error);
        throw new ShowError("Test email with current settings failed", "internal-server-error");
      }
    }),

  // Get all settings
  getAllSettings: protectedProcedure
    .query(async ({ ctx }) => {
      await requireAdmin(ctx.userId);
      
      try {
        const allSettings = await settingsService.getAllSettings();
        return {
          success: true,
          data: allSettings
        };
      } catch (error) {
        console.error('Failed to get all settings:', error);
        throw new ShowError("Failed to get all settings", "internal-server-error");
      }
    }),

  // Validate settings
  validateSettings: protectedProcedure
    .input(z.object({
      category: settingsCategorySchema,
      settings: z.record(z.string())
    }))
    .mutation(async ({ ctx, input }) => {
      await requireAdmin(ctx.userId);
      
      try {
        const result = await settingsService.validateSettings(input.category, input.settings);
        return {
          success: true,
          data: result
        };
      } catch (error) {
        console.error('Settings validation failed:', error);
        throw new ShowError("Settings validation failed", "internal-server-error");
      }
    })
});