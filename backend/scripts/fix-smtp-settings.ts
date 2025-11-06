#!/usr/bin/env ts-node
/**
 * Fix SMTP Settings - Activate them
 */

import 'dotenv-safe/config';
import { prisma } from '../src/prisma';
import { settingsService } from '../src/services/settings.service';
import { SettingsCategory } from '../src/types/settings';

async function fixSmtpSettings(): Promise<void> {
  console.log('🔧 Fixing SMTP Settings\n');
  
  try {
    // Activate all SMTP settings
    console.log('📊 Activating SMTP Settings:');
    console.log('-'.repeat(50));
    
    const result = await prisma.setting.updateMany({
      where: { 
        category: 'smtp',
        isActive: false 
      },
      data: { 
        isActive: true 
      }
    });
    
    console.log(`✅ Activated ${result.count} SMTP settings`);
    
    // Update with real SMTP settings
    console.log('\n🔧 Setting Real SMTP Configuration:');
    console.log('-'.repeat(50));
    
    const realSmtpSettings = {
      host: 'mail.dxbmark.com',
      port: '465',
      username: 'info@dxbmark.com',
      password: 'Tariq@yousef91',
      sender: 'info@dxbmark.com',
      secure: 'true'
    };
    
    // Save real settings
    await settingsService.setSettings(
      SettingsCategory.SMTP,
      realSmtpSettings,
      1 // Admin user ID
    );
    
    console.log('✅ Real SMTP settings saved');
    
    // Verify settings
    console.log('\n📋 Verifying SMTP Configuration:');
    console.log('-'.repeat(50));
    
    const finalSettings = await settingsService.getCurrentSmtpSettings();
    if (finalSettings) {
      console.log('✅ SMTP Configuration Complete:');
      console.log(`Host: ${finalSettings.host}`);
      console.log(`Port: ${finalSettings.port}`);
      console.log(`Username: ${finalSettings.username}`);
      console.log(`Password: ${finalSettings.password ? '[SET]' : '[MISSING]'}`);
      console.log(`Sender: ${finalSettings.sender}`);
      console.log(`Secure: ${finalSettings.secure}`);
      
      // Test email sending
      console.log('\n📧 Sending Test Email:');
      console.log('-'.repeat(50));
      
      try {
        const testResult = await settingsService.sendTestEmail(
          finalSettings,
          'elmonkared_2007@live.com',
          {
            userName: 'Test User',
            userEmail: 'elmonkared_2007@live.com',
            siteName: 'LicenseGate',
            testNote: 'This is a test email from SMTP configuration'
          }
        );
        
        if (testResult.success) {
          console.log('✅ Test email sent successfully!');
          console.log('Message:', testResult.message);
        } else {
          console.log('❌ Test email failed:', testResult.message);
        }
      } catch (error) {
        console.log('❌ Test email error:', (error as Error).message);
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
fixSmtpSettings()
  .then(() => {
    console.log('\n✅ Fix complete');
    process.exit(0);
  })
  .catch((error: any) => {
    console.error('❌ Fix failed:', error);
    process.exit(1);
  });
