#!/usr/bin/env ts-node
/**
 * Debug SMTP Settings in Database
 */

import 'dotenv-safe/config';
import { prisma } from '../src/prisma';
import { settingsService } from '../src/services/settings.service';
import { SettingsCategory } from '../src/types/settings';

async function debugSmtpSettings(): Promise<void> {
  console.log('🔍 Debugging SMTP Settings in Database\n');
  
  try {
    // Check raw database entries
    console.log('📊 Raw Database Entries:');
    console.log('-'.repeat(50));
    
    const rawSettings = await prisma.setting.findMany({
      where: { category: 'smtp' },
      select: {
        key: true,
        value: true,
        isEncrypted: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    console.log(`Found ${rawSettings.length} SMTP settings in database:`);
    rawSettings.forEach((setting, index) => {
      console.log(`${index + 1}. Key: ${setting.key}`);
      console.log(`   Value: ${setting.value ? (setting.isEncrypted ? '[ENCRYPTED]' : setting.value) : '[NULL]'}`);
      console.log(`   Encrypted: ${setting.isEncrypted}`);
      console.log(`   Active: ${setting.isActive}`);
      console.log(`   Updated: ${setting.updatedAt}`);
      console.log('');
    });
    
    // Check through settings service
    console.log('🔧 Settings Service Results:');
    console.log('-'.repeat(50));
    
    const serviceSettings = await settingsService.getSettings(SettingsCategory.SMTP);
    console.log('Available fields:', Object.keys(serviceSettings));
    console.log('Settings:', serviceSettings);
    
    // Check specific fields
    console.log('\n🎯 Field-by-Field Check:');
    console.log('-'.repeat(50));
    
    const fields = ['host', 'port', 'username', 'password', 'sender', 'secure'];
    for (const field of fields) {
      const value = await settingsService.getSetting(SettingsCategory.SMTP, field);
      console.log(`${field}: ${value ? 'EXISTS' : 'MISSING'}`);
    }
    
    // Fix missing host if needed
    console.log('\n🔧 Fixing Missing Host:');
    console.log('-'.repeat(50));
    
    const hostValue = await settingsService.getSetting(SettingsCategory.SMTP, 'host');
    if (!hostValue) {
      console.log('❌ Host is missing! Adding default host...');
      
      // Add host setting
      await settingsService.setSetting(
        SettingsCategory.SMTP,
        'host',
        'mail.dxbmark.com',
        1 // Admin user ID
      );
      
      console.log('✅ Host added successfully');
      
      // Verify
      const newHostValue = await settingsService.getSetting(SettingsCategory.SMTP, 'host');
      console.log(`✅ Host verified: ${newHostValue}`);
    } else {
      console.log(`✅ Host exists: ${hostValue}`);
    }
    
    // Final check
    console.log('\n📋 Final SMTP Configuration:');
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
    } else {
      console.log('❌ SMTP Configuration incomplete');
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run debug
debugSmtpSettings()
  .then(() => {
    console.log('\n✅ Debug complete');
    process.exit(0);
  })
  .catch((error: any) => {
    console.error('❌ Debug failed:', error);
    process.exit(1);
  });
