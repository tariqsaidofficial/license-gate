import { z } from 'zod';
import { settingsService } from '../services/settings.service';
import { protectedProcedure, router } from '../trpc';
import { SettingsCategory } from '../types/settings';
import { ShowError } from '../utils/ShowError';

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

// Validation schemas
const smtpSettingsSchema = z.object({
  host: z.string().min(1, "SMTP host is required"),
  port: z.number().min(1).max(65535, "Port must be between 1 and 65535"),
  username: z.string().email("Username must be a valid email"),
  password: z.string().min(1, "Password is required"),
  sender: z.string().min(1, "Sender is required"),
  secure: z.boolean().default(true)
});

const oauthSettingsSchema = z.object({
  googleClientId: z.string().optional(),
  googleClientSecret: z.string().optional(),
  githubClientId: z.string().optional(),
  githubClientSecret: z.string().optional()
});

const generalSettingsSchema = z.object({
  siteName: z.string().optional(),
  supportEmail: z.string().email().optional(),
  maintenanceMode: z.boolean().optional(),
  registrationEnabled: z.boolean().optional()
});

const securitySettingsSchema = z.object({
  sessionTimeout: z.number().min(300).max(86400).optional(),
  maxLoginAttempts: z.number().min(1).max(20).optional(),
  passwordMinLength: z.number().min(6).max(128).optional(),
  requireTwoFactor: z.boolean().optional()
});

export const settingsRouter = router({
  // Get settings by category
  getSettings: protectedProcedure
    .input(z.object({
      category: z.enum(['smtp', 'oauth', 'general', 'security'])
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
        // Convert to string format for storage
        const settingsToSave = {
          host: input.host,
          port: input.port.toString(),
          username: input.username,
          password: input.password,
          sender: input.sender,
          secure: input.secure.toString()
        };

        await settingsService.setSettings(SettingsCategory.SMTP, settingsToSave, ctx.userId);
        
        return {
          success: true,
          message: 'SMTP settings updated successfully'
        };
      } catch (error) {
        console.error('Failed to update SMTP settings:', error);
        throw new ShowError("Failed to update SMTP settings", "internal-server-error");
      }
    }),

  // Update OAuth settings
  updateOAuthSettings: protectedProcedure
    .input(oauthSettingsSchema)
    .mutation(async ({ ctx, input }) => {
      await requireAdmin(ctx.userId);
      
      try {
        // Filter out undefined values
        const settingsToSave: Record<string, string> = {};
        if (input.googleClientId !== undefined) settingsToSave.googleClientId = input.googleClientId;
        if (input.googleClientSecret !== undefined) settingsToSave.googleClientSecret = input.googleClientSecret;
        if (input.githubClientId !== undefined) settingsToSave.githubClientId = input.githubClientId;
        if (input.githubClientSecret !== undefined) settingsToSave.githubClientSecret = input.githubClientSecret;

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
        // Filter out undefined values and convert to strings
        const settingsToSave: Record<string, string> = {};
        if (input.siteName !== undefined) settingsToSave.siteName = input.siteName;
        if (input.supportEmail !== undefined) settingsToSave.supportEmail = input.supportEmail;
        if (input.maintenanceMode !== undefined) settingsToSave.maintenanceMode = input.maintenanceMode.toString();
        if (input.registrationEnabled !== undefined) settingsToSave.registrationEnabled = input.registrationEnabled.toString();

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
        // Filter out undefined values and convert to strings
        const settingsToSave: Record<string, string> = {};
        if (input.sessionTimeout !== undefined) settingsToSave.sessionTimeout = input.sessionTimeout.toString();
        if (input.maxLoginAttempts !== undefined) settingsToSave.maxLoginAttempts = input.maxLoginAttempts.toString();
        if (input.passwordMinLength !== undefined) settingsToSave.passwordMinLength = input.passwordMinLength.toString();
        if (input.requireTwoFactor !== undefined) settingsToSave.requireTwoFactor = input.requireTwoFactor.toString();

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
    .input(z.object({
      smtpSettings: smtpSettingsSchema,
      recipientEmail: z.string().email("Invalid recipient email"),
      templateData: z.object({
        siteName: z.string().optional(),
        userName: z.string().optional()
      }).optional()
    }))
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
      category: z.enum(['smtp', 'oauth', 'general', 'security']),
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