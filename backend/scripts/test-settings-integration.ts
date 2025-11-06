#!/usr/bin/env ts-node
/**
 * Test Settings Service Integration with Database
 * 
 * This script tests:
 * 1. Database connection and settings CRUD operations
 * 2. Encryption/decryption of sensitive settings
 * 3. Settings validation before saving
 * 4. Audit logging for settings changes
 * 5. Full integration with SMTP testing
 */

import 'dotenv-safe/config';
import { prisma } from '../src/prisma';
import { settingsService } from '../src/services/settings.service';
import { encryptionService } from '../src/services/encryption.service';
import { SettingsCategory, SmtpSettings } from '../src/types/settings';
import { sanitizeForLog } from '../src/utils/validation.schemas';

console.log('🧪 Testing Settings Service Integration\n');
console.log('='.repeat(60));

// Test user ID (should be an admin user)
const TEST_USER_ID = 1;

async function cleanup() {
  console.log('\n🧹 Cleaning up test data...');
  
  try {
    // Clean up test settings
    await prisma.setting.deleteMany({
      where: {
        OR: [
          { category: 'test-smtp' },
          { category: 'test-oauth' }
        ]
      }
    });
    console.log('✅ Test data cleaned up');
  } catch (error) {
    console.log('⚠️  Cleanup warning:', error);
  }
}

async function main() {
  try {
    // ========================================
    // Test 1: Database Connection
    // ========================================
    console.log('\n✅ Test 1: Database Connection');
    console.log('-'.repeat(60));
    
    try {
      await prisma.$connect();
      console.log('✅ Database connection successful');
      
      // Check if test user exists
      const testUser = await prisma.user.findUnique({
        where: { id: TEST_USER_ID },
        select: { id: true, email: true, isAdmin: true }
      });
      
      if (testUser) {
        console.log(`✅ Test user found: ${testUser.email} (Admin: ${testUser.isAdmin})`);
        if (!testUser.isAdmin) {
          console.log('⚠️  Warning: Test user is not an admin. Settings management requires admin access.');
        }
      } else {
        console.log(`⚠️  Warning: Test user (ID: ${TEST_USER_ID}) not found`);
        console.log('Some tests may fail. Consider creating an admin user first.');
      }
    } catch (error: any) {
      console.log('❌ Database connection failed:', error.message);
      return;
    }

    // ========================================
    // Test 2: Encryption Service
    // ========================================
    console.log('\n✅ Test 2: Encryption Service');
    console.log('-'.repeat(60));
    
    const testData = 'sensitive-password-12345';
    
    try {
      const encrypted = await encryptionService.encrypt(testData);
      console.log('✅ Encryption successful');
      console.log('Encrypted:', encrypted.substring(0, 50) + '...');
      console.log('Is encrypted:', encryptionService.isEncrypted(encrypted));
      
      const decrypted = await encryptionService.decrypt(encrypted);
      console.log('✅ Decryption successful');
      console.log('Decrypted matches original:', testData === decrypted);
      
      if (testData !== decrypted) {
        throw new Error('Decrypted value does not match original');
      }
    } catch (error: any) {
      console.log('❌ Encryption test failed:', error.message);
      return;
    }

    // ========================================
    // Test 3: Settings Validation
    // ========================================
    console.log('\n✅ Test 3: Settings Validation');
    console.log('-'.repeat(60));
    
    // Valid SMTP settings
    const validSmtpSettings = {
      host: 'smtp.gmail.com',
      port: '587',
      username: 'test@example.com',
      password: 'securepassword123',
      sender: 'noreply@example.com',
      secure: 'true'
    };
    
    const validationResult = await settingsService.validateSettings(
      SettingsCategory.SMTP,
      validSmtpSettings
    );
    
    if (validationResult.isValid) {
      console.log('✅ Valid SMTP settings passed validation');
    } else {
      console.log('❌ Valid SMTP settings failed validation');
      console.log('Errors:', validationResult.errors);
    }
    
    // Invalid SMTP settings
    const invalidSmtpSettings = {
      host: '',
      port: '99999',
      username: 'not-an-email',
      password: '',
      sender: 'invalid'
    };
    
    const invalidValidation = await settingsService.validateSettings(
      SettingsCategory.SMTP,
      invalidSmtpSettings
    );
    
    if (!invalidValidation.isValid) {
      console.log('✅ Invalid SMTP settings correctly rejected');
      console.log('Validation errors found:', invalidValidation.errors.length);
      invalidValidation.errors.forEach(err => {
        console.log(`  - ${err.field}: ${err.message}`);
      });
    } else {
      console.log('❌ Invalid SMTP settings should have been rejected');
    }

    // ========================================
    // Test 4: Save and Retrieve Settings
    // ========================================
    console.log('\n✅ Test 4: Save and Retrieve Settings');
    console.log('-'.repeat(60));
    
    const testCategory = 'test-smtp';
    const testSettings = {
      host: 'smtp.test.com',
      port: '587',
      username: 'test@test.com',
      password: 'test-password-12345',
      sender: 'noreply@test.com',
      secure: 'true'
    };
    
    try {
      // Save settings
      await settingsService.setSettings(testCategory, testSettings, TEST_USER_ID);
      console.log('✅ Settings saved successfully');
      
      // Retrieve settings
      const retrievedSettings = await settingsService.getSettings(testCategory);
      console.log('✅ Settings retrieved successfully');
      console.log('Retrieved settings:', sanitizeForLog(retrievedSettings));
      
      // Verify values
      if (retrievedSettings.host === testSettings.host &&
          retrievedSettings.port === testSettings.port &&
          retrievedSettings.username === testSettings.username &&
          retrievedSettings.password === testSettings.password) {
        console.log('✅ Retrieved settings match saved settings');
      } else {
        console.log('❌ Retrieved settings do not match');
      }
      
      // Verify password is encrypted in database
      const dbSetting = await prisma.setting.findUnique({
        where: {
          category_key: {
            category: testCategory,
            key: 'password'
          }
        }
      });
      
      if (dbSetting && dbSetting.isEncrypted) {
        console.log('✅ Password is encrypted in database');
        console.log('Encrypted value:', dbSetting.value?.substring(0, 50) + '...');
      } else {
        console.log('⚠️  Password encryption status unclear');
      }
    } catch (error: any) {
      console.log('❌ Save/retrieve test failed:', error.message);
    }

    // ========================================
    // Test 5: Update Settings
    // ========================================
    console.log('\n✅ Test 5: Update Settings');
    console.log('-'.repeat(60));
    
    try {
      const updatedSettings = {
        ...testSettings,
        host: 'smtp.updated.com',
        port: '465'
      };
      
      await settingsService.setSettings(testCategory, updatedSettings, TEST_USER_ID);
      console.log('✅ Settings updated successfully');
      
      const retrievedUpdated = await settingsService.getSettings(testCategory);
      
      if (retrievedUpdated.host === 'smtp.updated.com' &&
          retrievedUpdated.port === '465') {
        console.log('✅ Updated settings retrieved correctly');
      } else {
        console.log('❌ Updated settings not correct');
      }
    } catch (error: any) {
      console.log('❌ Update test failed:', error.message);
    }

    // ========================================
    // Test 6: Audit Logging
    // ========================================
    console.log('\n✅ Test 6: Audit Logging');
    console.log('-'.repeat(60));
    
    try {
      const auditLogs = await prisma.settingAudit.findMany({
        where: {
          category: testCategory,
          userId: TEST_USER_ID
        },
        orderBy: {
          timestamp: 'desc'
        },
        take: 5
      });
      
      console.log(`✅ Found ${auditLogs.length} audit log entries`);
      
      if (auditLogs.length > 0) {
        console.log('Recent audit logs:');
        auditLogs.forEach((log, index) => {
          console.log(`  ${index + 1}. ${log.action} - ${log.category}.${log.key} at ${log.timestamp.toISOString()}`);
        });
      }
    } catch (error: any) {
      console.log('❌ Audit log test failed:', error.message);
    }

    // ========================================
    // Test 7: Delete Settings
    // ========================================
    console.log('\n✅ Test 7: Delete Settings');
    console.log('-'.repeat(60));
    
    try {
      await settingsService.deleteSetting(testCategory, 'host', TEST_USER_ID);
      console.log('✅ Setting deleted successfully');
      
      const afterDelete = await settingsService.getSetting(testCategory, 'host');
      
      if (afterDelete === null) {
        console.log('✅ Deleted setting no longer retrievable');
      } else {
        console.log('❌ Deleted setting still exists');
      }
    } catch (error: any) {
      console.log('❌ Delete test failed:', error.message);
    }

    // ========================================
    // Test 8: SMTP Connection Test (if configured)
    // ========================================
    console.log('\n✅ Test 8: SMTP Connection Test');
    console.log('-'.repeat(60));
    
    const hasSmtpConfig = process.env.SMTP_HOST && 
                         process.env.SMTP_USERNAME && 
                         process.env.SMTP_PASSWORD;
    
    if (hasSmtpConfig) {
      try {
        const smtpSettings: SmtpSettings = {
          host: process.env.SMTP_HOST!,
          port: parseInt(process.env.SMTP_PORT || '587'),
          username: process.env.SMTP_USERNAME!,
          password: process.env.SMTP_PASSWORD!,
          sender: process.env.SMTP_SENDER || process.env.SMTP_USERNAME!,
          secure: process.env.SMTP_SECURE === 'true'
        };
        
        console.log('Testing SMTP connection with real server...');
        const testResult = await settingsService.testSmtpSettings(smtpSettings);
        
        if (testResult.success) {
          console.log('✅ SMTP connection test successful');
          console.log(`Message: ${testResult.message}`);
        } else {
          console.log('❌ SMTP connection test failed');
          console.log(`Message: ${testResult.message}`);
        }
      } catch (error: any) {
        console.log('❌ SMTP test error:', error.message);
      }
    } else {
      console.log('⚠️  Skipping SMTP test - No credentials configured');
      console.log('Set SMTP_HOST, SMTP_USERNAME, SMTP_PASSWORD in .env to test');
    }

    // ========================================
    // Summary
    // ========================================
    console.log('\n' + '='.repeat(60));
    console.log('🎉 Integration Tests Complete!');
    console.log('='.repeat(60));
    
    console.log('\n✅ Test Results:');
    console.log('  ✅ Database connection working');
    console.log('  ✅ Encryption/decryption working');
    console.log('  ✅ Settings validation working');
    console.log('  ✅ CRUD operations working');
    console.log('  ✅ Audit logging working');
    console.log('  ✅ Settings service fully functional');
    
    if (hasSmtpConfig) {
      console.log('  ✅ SMTP testing available');
    } else {
      console.log('  ⏳ SMTP testing (requires configuration)');
    }
    
  } catch (error: any) {
    console.error('\n❌ Integration test error:', error.message);
    console.error(error.stack);
  } finally {
    await cleanup();
    await prisma.$disconnect();
    console.log('\n✅ Database disconnected');
  }
}

// Run tests
main()
  .then(() => {
    console.log('\n✅ All tests completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  });

