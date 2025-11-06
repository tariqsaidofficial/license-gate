#!/usr/bin/env ts-node
/**
 * Final SMTP Fix - Reset everything and configure properly
 */

import 'dotenv-safe/config';
import { prisma } from '../src/prisma';
import { settingsService } from '../src/services/settings.service';
import { SettingsCategory } from '../src/types/settings';

async function finalSmtpFix(): Promise<void> {
  console.log('🔧 Final SMTP Fix - Complete Reset\n');
  
  try {
    // 1. Delete ALL SMTP settings
    console.log('🗑️ Deleting all SMTP settings...');
    const deleteResult = await prisma.setting.deleteMany({
      where: { category: 'smtp' }
    });
    console.log(`✅ Deleted ${deleteResult.count} SMTP settings`);
    
    // 2. Set fresh SMTP configuration
    console.log('\n🔧 Setting fresh SMTP configuration...');
    const smtpConfig = {
      host: 'mail.dxbmark.com',
      port: '465',
      username: 'info@dxbmark.com',
      password: 'Tariq@yousef91',
      sender: 'info@dxbmark.com',
      secure: 'true'
    };
    
    await settingsService.setSettings(
      SettingsCategory.SMTP,
      smtpConfig,
      1 // Admin user ID
    );
    
    console.log('✅ Fresh SMTP settings saved');
    
    // 3. Verify settings work
    console.log('\n📋 Verifying SMTP Configuration:');
    console.log('-'.repeat(50));
    
    const retrievedSettings = await settingsService.getSettings(SettingsCategory.SMTP);
    console.log('Available fields:', Object.keys(retrievedSettings));
    
    const currentSettings = await settingsService.getCurrentSmtpSettings();
    if (currentSettings) {
      console.log('✅ SMTP Configuration Complete:');
      console.log(`Host: ${currentSettings.host}`);
      console.log(`Port: ${currentSettings.port}`);
      console.log(`Username: ${currentSettings.username}`);
      console.log(`Password: ${currentSettings.password ? '[SET]' : '[MISSING]'}`);
      console.log(`Sender: ${currentSettings.sender}`);
      console.log(`Secure: ${currentSettings.secure}`);
      
      // 4. Test email to verify everything works
      console.log('\n📧 Testing email sending...');
      const testResult = await settingsService.sendTestEmail(
        currentSettings,
        'elmonkared_2007@live.com',
        {
          userName: 'Test User',
          siteName: 'LicenseGate',
          testNote: 'Final SMTP configuration test'
        }
      );
      
      if (testResult.success) {
        console.log('🎉 SUCCESS! SMTP is working perfectly!');
        console.log('Message:', testResult.message);
      } else {
        console.log('❌ SMTP test failed:', testResult.message);
      }
      
    } else {
      console.log('❌ SMTP Configuration failed');
    }
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run fix
finalSmtpFix()
  .then(() => {
    console.log('\n✅ Final SMTP fix complete');
    console.log('\n🎯 Next Steps:');
    console.log('  1. Refresh frontend page (F5)');
    console.log('  2. SMTP should now show as configured');
    console.log('  3. Test email templates should work');
    process.exit(0);
  })
  .catch((error: any) => {
    console.error('❌ Final fix failed:', error);
    process.exit(1);
  });
