#!/usr/bin/env ts-node
/**
 * Fix Password Encryption Issue
 */

import 'dotenv-safe/config';
import { prisma } from '../src/prisma';
import { settingsService } from '../src/services/settings.service';
import { SettingsCategory } from '../src/types/settings';

async function fixPasswordEncryption(): Promise<void> {
  console.log('🔧 Fixing Password Encryption\n');
  
  try {
    // Delete old encrypted password
    console.log('🗑️ Removing old encrypted password...');
    await prisma.setting.deleteMany({
      where: {
        category: 'smtp',
        key: 'password'
      }
    });
    console.log('✅ Old password removed');
    
    // Set new password (will be encrypted automatically)
    console.log('\n🔐 Setting new password...');
    await settingsService.setSetting(
      SettingsCategory.SMTP,
      'password',
      'Tariq@yousef91',
      1 // Admin user ID
    );
    console.log('✅ New password set and encrypted');
    
    // Verify all settings
    console.log('\n📋 Verifying SMTP Configuration:');
    console.log('-'.repeat(50));
    
    const finalSettings = await settingsService.getCurrentSmtpSettings();
    if (finalSettings) {
      console.log('✅ SMTP Configuration Complete:');
      console.log(`Host: ${finalSettings.host}`);
      console.log(`Port: ${finalSettings.port}`);
      console.log(`Username: ${finalSettings.username}`);
      console.log(`Password: ${finalSettings.password ? '[SET - ' + finalSettings.password.length + ' chars]' : '[MISSING]'}`);
      console.log(`Sender: ${finalSettings.sender}`);
      console.log(`Secure: ${finalSettings.secure}`);
      
      // Now send the Activation email
      console.log('\n📧 Sending Activation Confirmation Email:');
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
        testNote: 'This is the Activation Confirmation template email sent from LicenseGate'
      };
      
      const result = await settingsService.sendTestEmail(
        finalSettings,
        'elmonkared_2007@live.com',
        templateData
      );
      
      if (result.success) {
        console.log('🎉 SUCCESS! Activation email sent!');
        console.log('📧 Recipient: elmonkared_2007@live.com');
        console.log('📋 Template: Activation Confirmation');
        console.log('🕒 Sent at:', new Date().toLocaleString());
        console.log('📝 Message:', result.message);
        
        if (result.details) {
          console.log('📊 Email Details:');
          console.log(`  Message ID: ${result.details.messageId || 'N/A'}`);
          console.log(`  Response: ${result.details.response || 'N/A'}`);
          console.log(`  Accepted: ${result.details.accepted || 'N/A'}`);
          console.log(`  Rejected: ${result.details.rejected || 'N/A'}`);
        }
      } else {
        console.log('❌ Failed to send activation email');
        console.log('Error:', result.message);
        if (result.details) {
          console.log('Details:', result.details);
        }
      }
      
    } else {
      console.log('❌ SMTP Configuration still incomplete');
    }
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run fix
fixPasswordEncryption()
  .then(() => {
    console.log('\n✅ Fix and email sending complete');
    process.exit(0);
  })
  .catch((error: any) => {
    console.error('❌ Process failed:', error);
    process.exit(1);
  });
