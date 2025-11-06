#!/usr/bin/env ts-node
/**
 * Send Activation Confirmation Email
 */

import 'dotenv-safe/config';
import { prisma } from '../src/prisma';
import { settingsService } from '../src/services/settings.service';

async function sendActivationEmail(): Promise<void> {
  console.log('📧 Sending Activation Confirmation Email\n');
  
  try {
    // Get current SMTP settings
    const smtpSettings = await settingsService.getCurrentSmtpSettings();
    
    if (!smtpSettings) {
      console.log('❌ SMTP not configured');
      return;
    }
    
    console.log('✅ SMTP Configuration loaded');
    console.log(`Host: ${smtpSettings.host}`);
    console.log(`Sender: ${smtpSettings.sender}`);
    
    // Send Activation Confirmation email
    console.log('\n📧 Sending Activation Confirmation Email...');
    console.log('-'.repeat(50));
    
    const templateData = {
      userName: 'Ahmed Elmonkared',
      userEmail: 'elmonkared_2007@live.com',
      dashboardUrl: 'https://licensegate.com/dashboard',
      siteName: 'LicenseGate',
      productName: 'LicenseGate Pro',
      activationDate: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      testNote: 'This is a test email sent from LicenseGate SMTP system - Activation Confirmation Template'
    };
    
    const result = await settingsService.sendTestEmail(
      smtpSettings,
      'elmonkared_2007@live.com',
      templateData
    );
    
    if (result.success) {
      console.log('✅ Activation email sent successfully!');
      console.log('📧 Email sent to: elmonkared_2007@live.com');
      console.log('📋 Template: Activation Confirmation');
      console.log('🕒 Sent at:', new Date().toLocaleString());
      console.log('📝 Message:', result.message);
      
      if (result.details) {
        console.log('📊 Details:', result.details);
      }
    } else {
      console.log('❌ Failed to send activation email');
      console.log('Error:', result.message);
      if (result.details) {
        console.log('Details:', result.details);
      }
    }
    
  } catch (error) {
    console.error('❌ Send failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Send the email
sendActivationEmail()
  .then(() => {
    console.log('\n✅ Email sending complete');
    process.exit(0);
  })
  .catch((error: any) => {
    console.error('❌ Email sending failed:', error);
    process.exit(1);
  });
