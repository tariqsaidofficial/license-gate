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
    const timestamp = new Date().toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    });
    const testData = {
      siteName: 'LicenseGate',
      timestamp,
      ...templateData
    };

    const subject = `✅ SMTP Test Email - ${testData.siteName}`;
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SMTP Test Email</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #1f2937;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
        }
        .email-wrapper {
            max-width: 600px;
            margin: 0 auto;
        }
        .container {
            background: white;
            border-radius: 16px;
            padding: 40px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        .header {
            text-align: center;
            margin-bottom: 35px;
            padding-bottom: 25px;
            border-bottom: 3px solid #f3f4f6;
        }
        .logo {
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 50%;
            margin: 0 auto 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 32px;
        }
        .header h1 {
            color: #111827;
            margin: 15px 0 10px;
            font-size: 28px;
            font-weight: 700;
        }
        .success-badge {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 10px 20px;
            border-radius: 25px;
            font-size: 14px;
            font-weight: 600;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            margin-top: 15px;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }
        .intro-text {
            text-align: center;
            font-size: 16px;
            color: #4b5563;
            margin-bottom: 30px;
            line-height: 1.7;
        }
        .info-section {
            background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
            padding: 25px;
            border-radius: 12px;
            margin: 25px 0;
            border-left: 4px solid #667eea;
        }
        .info-section h3 {
            margin: 0 0 18px 0;
            color: #111827;
            font-size: 18px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .info-item {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #e5e7eb;
        }
        .info-item:last-child {
            border-bottom: none;
            padding-bottom: 0;
        }
        .info-label {
            font-weight: 600;
            color: #6b7280;
            font-size: 14px;
        }
        .info-value {
            color: #111827;
            font-weight: 500;
            text-align: right;
            font-size: 14px;
        }
        .checklist {
            list-style: none;
            padding: 0;
            margin: 15px 0 0 0;
        }
        .checklist li {
            padding: 10px 0;
            color: #374151;
            font-size: 14px;
            display: flex;
            align-items: flex-start;
            gap: 12px;
        }
        .checklist li:before {
            content: "✓";
            color: #10b981;
            font-weight: bold;
            font-size: 18px;
            flex-shrink: 0;
        }
        .cta-section {
            text-align: center;
            margin: 30px 0;
            padding: 25px;
            background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%);
            border-radius: 12px;
            border: 2px solid #c7d2fe;
        }
        .cta-section h3 {
            color: #4338ca;
            margin-bottom: 10px;
            font-size: 18px;
        }
        .cta-section p {
            color: #6366f1;
            font-size: 14px;
            margin: 5px 0;
        }
        .footer {
            text-align: center;
            margin-top: 35px;
            padding-top: 25px;
            border-top: 2px solid #f3f4f6;
            color: #9ca3af;
            font-size: 13px;
        }
        .footer p {
            margin: 5px 0;
        }
        .footer strong {
            color: #6b7280;
        }
        .badge {
            display: inline-block;
            padding: 4px 10px;
            background: #dbeafe;
            color: #1e40af;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 600;
            margin: 5px 0;
        }
        @media only screen and (max-width: 600px) {
            body {
                padding: 10px;
            }
            .container {
                padding: 25px;
            }
            .header h1 {
                font-size: 24px;
            }
            .info-item {
                flex-direction: column;
                gap: 5px;
            }
            .info-value {
                text-align: left;
            }
        }
    </style>
</head>
<body>
    <div class="email-wrapper">
        <div class="container">
            <div class="header">
                <div class="logo">🧪</div>
                <h1>SMTP Test Email</h1>
                <div class="success-badge">
                    <span>✅</span>
                    <span>Configuration Working Perfectly</span>
                </div>
            </div>
            
            <p class="intro-text">
                🎉 <strong>Congratulations!</strong> Your SMTP configuration is working correctly. 
                This test email was sent successfully from your <strong>${testData.siteName}</strong> application.
            </p>
            
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
                <div class="info-item">
                    <span class="info-label">Status:</span>
                    <span class="info-value"><span class="badge">✓ Delivered Successfully</span></span>
                </div>
            </div>
            
            <div class="info-section">
                <h3>🔧 What This Means</h3>
                <ul class="checklist">
                    <li>Your SMTP server settings are correctly configured</li>
                    <li>Email delivery is working properly</li>
                    <li>Authentication credentials are valid</li>
                    <li>You can now save these settings with confidence</li>
                    <li>All automated emails will use this configuration</li>
                </ul>
            </div>

            <div class="cta-section">
                <h3>🎯 Ready for Production!</h3>
                <p>Your email system is fully configured and ready to send notifications,</p>
                <p>password resets, verification emails, and more!</p>
            </div>
            
            <div class="footer">
                <p><strong>This is an automated test email from ${testData.siteName}</strong></p>
                <p>If you received this email unexpectedly, please contact your system administrator.</p>
                <p style="margin-top: 15px; color: #d1d5db; font-size: 11px;">
                    Powered by LicenseGate Email Service • Secure • Reliable • Fast
                </p>
            </div>
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