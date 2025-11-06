import { createTransport } from "nodemailer";
import fs from "fs";
import type { SmtpSettings } from "../types/settings";
import { configurationManager } from "../services/configuration-manager.service";
import { SettingsCategory } from "../types/settings";

// Cache for mailer instances
let cachedMailer: any = null;
let lastSmtpConfig: any = null;

type MailTemplateName = 
  | "verify-email" 
  | "reset-password" 
  | "welcome-new-user"
  | "license-ready"
  | "activation-confirmation"
  | "verification-reminder";

/**
 * Get or create mailer instance with dynamic configuration
 */
async function getMailer(customSmtpSettings?: SmtpSettings): Promise<any> {
  // If custom settings provided, create new mailer
  if (customSmtpSettings) {
    return createTransport({
      host: customSmtpSettings.host,
      port: customSmtpSettings.port,
      secure: customSmtpSettings.secure,
      auth: {
        user: customSmtpSettings.username,
        pass: customSmtpSettings.password,
      },
    });
  }

  // Get current SMTP configuration from configuration manager
  const currentSmtpConfig = await configurationManager.getSmtpConfig();
  
  // Check if we need to create a new mailer (config changed)
  if (!cachedMailer || JSON.stringify(lastSmtpConfig) !== JSON.stringify(currentSmtpConfig)) {
    console.log('📧 Creating new mailer with updated SMTP configuration');
    
    cachedMailer = createTransport({
      host: currentSmtpConfig.host,
      port: currentSmtpConfig.port,
      secure: currentSmtpConfig.secure,
      auth: {
        user: currentSmtpConfig.username,
        pass: currentSmtpConfig.password,
      },
    });
    
    lastSmtpConfig = { ...currentSmtpConfig };
  }

  return cachedMailer;
}

/**
 * Send email with dynamic SMTP configuration
 */
export async function sendMail(
  email: string,
  subject: string,
  templateName: MailTemplateName,
  templateVariables: { [key: string]: string },
  smtpSettings?: SmtpSettings // Optional: Use custom SMTP settings instead of dynamic config
) {
  try {
    // Get mailer instance (either custom or dynamic)
    const mailer = await getMailer(smtpSettings);
    
    // Get sender from custom settings or dynamic config
    let sender: string;
    if (smtpSettings?.sender) {
      sender = smtpSettings.sender;
    } else {
      const smtpConfig = await configurationManager.getSmtpConfig();
      sender = smtpConfig.sender || process.env.SMTP_SENDER || 'noreply@localhost';
    }

    // Load and process email template
    const mailTemplate = fs.readFileSync(
      `src/assets/mail/${templateName}.html`,
      "utf8"
    );
    
    const mailBody = Object.keys(templateVariables).reduce((acc, key) => {
      return acc.replace(
        new RegExp(`{{${key.toUpperCase()}}}`, "g"),
        templateVariables[key]
      );
    }, mailTemplate);

    // Send email
    return new Promise((resolve, reject) => {
      mailer.sendMail(
        {
          from: sender,
          to: email,
          subject: subject,
          html: mailBody,
        },
        (err: any, info: any) => {
          if (err) {
            console.error('❌ Email sending failed:', err);
            reject(err);
          } else {
            console.log('✅ Email sent successfully:', info.messageId);
            resolve(info);
          }
        }
      );
    });
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    throw error;
  }
}

/**
 * Clear mailer cache (useful when SMTP config changes)
 */
export function clearMailerCache(): void {
  cachedMailer = null;
  lastSmtpConfig = null;
  console.log('🗑️ Mailer cache cleared');
}

/**
 * Initialize mailer with configuration change watching
 */
export function initializeMailer(): void {
  // Watch for SMTP configuration changes
  configurationManager.watchConfiguration(SettingsCategory.SMTP, (event) => {
    console.log('📧 SMTP configuration changed, clearing mailer cache');
    clearMailerCache();
  });
  
  console.log('📧 Mailer initialized with dynamic configuration');
}
