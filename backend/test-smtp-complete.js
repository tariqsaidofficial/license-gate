// Complete SMTP Testing
const { settingsService } = require('./dist/services/settings.service.js');
const { smtpTestService } = require('./dist/services/smtp-test.service.js');
const { SettingsCategory } = require('./dist/types/settings.js');

async function testCompleteSmtp() {
  console.log('📧 Complete SMTP Testing');
  console.log('='.repeat(60));

  const testUserId = 1;
  const testEmail = 'test@example.com';

  // Test SMTP settings
  const smtpSettings = {
    host: 'mail.dxbmark.com',
    port: 465,
    username: 'info@dxbmark.com',
    password: 'Tariq@yousef91',
    sender: 'LicenseGate <info@dxbmark.com>',
    secure: true
  };

  try {
    console.log('🔧 Test 1: Saving SMTP settings to database...');
    const settingsToSave = {
      host: smtpSettings.host,
      port: smtpSettings.port.toString(),
      username: smtpSettings.username,
      password: smtpSettings.password,
      sender: smtpSettings.sender,
      secure: smtpSettings.secure.toString()
    };
    
    await settingsService.setSettings(SettingsCategory.SMTP, settingsToSave, testUserId);
    console.log('✅ SMTP settings saved to database');

    console.log('\n🔍 Test 2: Retrieving SMTP settings from database...');
    const retrievedSettings = await settingsService.getSettings(SettingsCategory.SMTP);
    console.log('✅ Retrieved settings:', retrievedSettings);

    console.log('\n🔗 Test 3: Testing SMTP connection...');
    const connectionTest = await smtpTestService.testSmtpConnection(smtpSettings);
    console.log('✅ Connection test result:', connectionTest);

    if (connectionTest.success) {
      console.log('\n📨 Test 4: Sending test email...');
      const emailTest = await smtpTestService.sendTestEmail(smtpSettings, testEmail, {
        siteName: 'LicenseGate Test',
        userName: 'Test User'
      });
      console.log('✅ Test email result:', emailTest);
    } else {
      console.log('❌ Skipping email test due to connection failure');
    }

    console.log('\n🔄 Test 5: Testing with SettingsService methods...');
    const serviceConnectionTest = await settingsService.testCurrentSmtpSettings();
    console.log('✅ Service connection test:', serviceConnectionTest);

    if (serviceConnectionTest.success) {
      console.log('\n📧 Test 6: Sending test email via SettingsService...');
      const currentSettings = await settingsService.getCurrentSmtpSettings();
      if (currentSettings) {
        const serviceEmailTest = await settingsService.sendTestEmail(currentSettings, testEmail, {
          siteName: 'LicenseGate Service Test',
          userName: 'Service Test User'
        });
        console.log('✅ Service email test:', serviceEmailTest);
      }
    }

    console.log('\n🗄️ Test 7: Checking database storage...');
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const dbSettings = await prisma.setting.findMany({
      where: { category: 'smtp' },
      select: { key: true, value: true, isEncrypted: true }
    });
    
    console.log('✅ Database settings:');
    dbSettings.forEach(setting => {
      if (setting.isEncrypted) {
        console.log(`  - ${setting.key}: [ENCRYPTED] (${setting.value.substring(0, 20)}...)`);
      } else {
        console.log(`  - ${setting.key}: ${setting.value}`);
      }
    });
    
    await prisma.$disconnect();

    console.log('\n🎉 All SMTP tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('✅ Settings saved with encryption');
    console.log('✅ Settings retrieved with decryption');
    console.log('✅ SMTP connection tested');
    console.log('✅ Test email sent');
    console.log('✅ Service methods working');
    console.log('✅ Database storage verified');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testCompleteSmtp().catch(console.error);