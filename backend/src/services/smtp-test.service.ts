import nodemailer from 'nodemailer';
import { SmtpSettings, TestResult } from '../types/settings';

export interface ISmtpTestService {
  testSmtpConnection(settings: SmtpSettings): Promise<TestResult>
  sendTestEmail(settings: SmtpSettings, recipientEmail: string, templateData?: any): Promise<TestResult>
}

export class SmtpTestService implements ISmtpTestService {
  
  /**
   * Test SMTP connection without sending email
   */
  async testSmtpConnection(settings: SmtpSettings): Promise<TestResult> {
    try {
      // Validate settings first
      const validation = this.validateSmtpSettings(settings);
      if (!validation.isValid) {
        return {
          success: false,
          message: 'Invalid SMTP settings',
          details: { errors: validation.errors }
        };
      }

      // Create transporter
      const transporter = this.createTransporter(settings);

      // Test connection
      await transporter.verify();

      return {
        success: true,
        message: 'SMTP connection successful',
        details: {
          host: settings.host,
          port: settings.port,
          secure: settings.secure,
          username: settings.username
        }
      };

    } catch (error) {
      console.error('SMTP connection test failed:', error);
      
      return {
        success: false,
        message: this.getErrorMessage(error),
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          code: (error as any)?.code || 'UNKNOWN'
        }
      };
    }
  }

  /**
   * Send test email using SMTP settings
   */
  async sendTestEmail(
    settings: SmtpSettings, 
    recipientEmail: string, 
    templateData?: any
  ): Promise<TestResult> {
    try {
      // Validate settings
      const validation = this.validateSmtpSettings(settings);
      if (!validation.isValid) {
        return {
          success: false,
          message: 'Invalid SMTP settings',
          details: { errors: validation.errors }
        };
      }

      // Validate recipient email
      if (!this.isValidEmail(recipientEmail)) {
        return {
          success: false,
          message: 'Invalid recipient email address',
          details: { recipientEmail }
        };
      }

      // Create transporter
      const transporter = this.createTransporter(settings);

      // Generate test email content
      const emailContent = this.generateTestEmailContent(templateData);

      // Send email
      const info = await transporter.sendMail({
        from: settings.sender,
        to: recipientEmail,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text
      });

      return {
        success: true,
        message: 'Test email sent successfully',
        details: {
          messageId: info.messageId,
          recipientEmail,
          sender: settings.sender,
          response: info.response,
          accepted: info.accepted,
          rejected: info.rejected
        }
      };

    } catch (error) {
      console.error('Test email sending failed:', error);
      
      return {
        success: false,
        message: this.getErrorMessage(error),
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          code: (error as any)?.code || 'UNKNOWN',
          recipientEmail
        }
      };
    }
  }

  /**
   * Create nodemailer transporter from SMTP settings
   */
  private createTransporter(settings: SmtpSettings) {
    return nodemailer.createTransport({
      host: settings.host,
      port: settings.port,
      secure: settings.secure, // true for 465, false for other ports
      auth: {
        user: settings.username,
        pass: settings.password
      },
      // Additional options for better compatibility
      tls: {
        rejectUnauthorized: false // Allow self-signed certificates in development
      },
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 5000, // 5 seconds
      socketTimeout: 10000 // 10 seconds
    });
  }

  /**
   * Generate test email content
   */
  private generateTestEmailContent(templateData?: any) {
    const timestamp = new Date().toLocaleString();
    const testData = {
      siteName: 'LicenseGate',
      timestamp,
      ...templateData
    };

    const subject = `🧪 SMTP Test Email - ${testData.siteName}`;
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SMTP Test Email</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .container {
            background: white;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e9ecef;
        }
        .header h1 {
            color: #2563eb;
            margin: 0;
            font-size: 28px;
        }
        .success-badge {
            background: #10b981;
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
            display: inline-block;
            margin-top: 10px;
        }
        .info-section {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 6px;
            margin: 20px 0;
        }
        .info-section h3 {
            margin-top: 0;
            color: #374151;
        }
        .info-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
        }
        .info-item:last-child {
            border-bottom: none;
        }
        .info-label {
            font-weight: 600;
            color: #6b7280;
        }
        .info-value {
            color: #374151;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
            color: #6b7280;
            font-size: 14px;
        }
        .emoji {
            font-size: 24px;
            margin-right: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1><span class="emoji">🧪</span>SMTP Test Email</h1>
            <div class="success-badge">✅ Configuration Working</div>
        </div>
        
        <p>Congratulations! Your SMTP configuration is working correctly. This test email was sent successfully from your <strong>${testData.siteName}</strong> application.</p>
        
        <div class="info-section">
            <h3>📧 Email Details</h3>
            <div class="info-item">
                <span class="info-label">Sent At:</span>
                <span class="info-value">${testData.timestamp}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Application:</span>
                <span class="info-value">${testData.siteName}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Test Type:</span>
                <span class="info-value">SMTP Configuration Test</span>
            </div>
        </div>
        
        <div class="info-section">
            <h3>🔧 Next Steps</h3>
            <ul>
                <li>Your SMTP settings are correctly configured</li>
                <li>Email delivery is working properly</li>
                <li>You can now save these settings with confidence</li>
                <li>All automated emails will use this configuration</li>
            </ul>
        </div>
        
        <div class="footer">
            <p>This is an automated test email from ${testData.siteName}<br>
            If you received this email unexpectedly, please contact your system administrator.</p>
        </div>
    </div>
</body>
</html>`;

    const text = `
🧪 SMTP Test Email - ${testData.siteName}

✅ Configuration Working

Congratulations! Your SMTP configuration is working correctly. This test email was sent successfully from your ${testData.siteName} application.

📧 Email Details:
- Sent At: ${testData.timestamp}
- Application: ${testData.siteName}
- Test Type: SMTP Configuration Test

🔧 Next Steps:
- Your SMTP settings are correctly configured
- Email delivery is working properly
- You can now save these settings with confidence
- All automated emails will use this configuration

This is an automated test email from ${testData.siteName}
If you received this email unexpectedly, please contact your system administrator.
`;

    return { subject, html, text };
  }

  /**
   * Validate SMTP settings
   */
  private validateSmtpSettings(settings: SmtpSettings): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!settings.host || settings.host.trim() === '') {
      errors.push('SMTP host is required');
    }

    if (!settings.port || settings.port < 1 || settings.port > 65535) {
      errors.push('SMTP port must be between 1 and 65535');
    }

    if (!settings.username || settings.username.trim() === '') {
      errors.push('SMTP username is required');
    } else if (!this.isValidEmail(settings.username)) {
      errors.push('SMTP username must be a valid email address');
    }

    if (!settings.password || settings.password.trim() === '') {
      errors.push('SMTP password is required');
    }

    if (!settings.sender || settings.sender.trim() === '') {
      errors.push('SMTP sender is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Get user-friendly error message from error object
   */
  private getErrorMessage(error: any): string {
    if (!error) return 'Unknown error occurred';

    // Common SMTP error codes and messages
    const errorMessages: Record<string, string> = {
      'ECONNREFUSED': 'Connection refused - Check host and port settings',
      'ENOTFOUND': 'Host not found - Check SMTP host address',
      'ETIMEDOUT': 'Connection timeout - Check host and firewall settings',
      'EAUTH': 'Authentication failed - Check username and password',
      'ESOCKET': 'Socket error - Check network connection',
      'EENVELOPE': 'Invalid sender or recipient email address',
      'EMESSAGE': 'Invalid email message format'
    };

    // Check for specific error codes
    if (error.code && errorMessages[error.code]) {
      return errorMessages[error.code];
    }

    // Check for authentication errors
    if (error.message && error.message.includes('auth')) {
      return 'Authentication failed - Please check your username and password';
    }

    // Check for connection errors
    if (error.message && (error.message.includes('connect') || error.message.includes('ECONNREFUSED'))) {
      return 'Cannot connect to SMTP server - Please check host and port settings';
    }

    // Check for DNS errors
    if (error.message && error.message.includes('ENOTFOUND')) {
      return 'SMTP host not found - Please check the host address';
    }

    // Return original error message if no specific handling
    return error.message || 'SMTP configuration test failed';
  }
}

// Export singleton instance
export const smtpTestService = new SmtpTestService();