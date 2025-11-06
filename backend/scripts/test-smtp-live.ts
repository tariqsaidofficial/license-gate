#!/usr/bin/env ts-node
/**
 * Live SMTP Testing with Real Credentials
 * This tests the complete SMTP flow with database storage
 */

import 'dotenv-safe/config';
import { prisma } from '../src/prisma';
import { settingsService } from '../src/services/settings.service';
import { SettingsCategory } from '../src/types/settings';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main(): Promise<void> {
  console.log('🧪 Live SMTP Testing\n');
  console.log('='.repeat(60));
  
  try {
    // Connect to database
    console.log('\n📊 Connecting to database...');
    await prisma.$connect();
    console.log('✅ Database connected');

    // Get admin user
    const adminUser = await prisma.user.findFirst({
      where: { isAdmin: true },
      select: { id: true, email: true, fullName: true }
    });

    if (!adminUser) {
      console.log('❌ No admin user found. Please create an admin user first.');
      console.log('Run: npm run set-admin');
      process.exit(1);
    }

    console.log(`✅ Admin user: ${adminUser.email} (ID: ${adminUser.id})`);

    // Ask for SMTP configuration
    console.log('\n📧 SMTP Configuration');
    console.log('-'.repeat(60));
    
    const host = await question('SMTP Host (e.g., smtp.gmail.com): ');
    const portStr = await question('SMTP Port (default 587): ');
    const port = portStr || '587';
    const username = await question('SMTP Username (your email): ');
    const password = await question('SMTP Password (app password): ');
    const sender = await question('Sender Email (default: same as username): ');
    const secureStr = await question('Use TLS/SSL? (y/n, default: y): ');
    const secure = !secureStr || secureStr.toLowerCase() === 'y' ? 'true' : 'false';

    const smtpSettings = {
      host: host || 'smtp.gmail.com',
      port,
      username,
      password,
      sender: sender || username,
      secure
    };

    // Save to database
    console.log('\n💾 Saving SMTP settings to database...');
    try {
      await settingsService.setSettings(
        SettingsCategory.SMTP,
        smtpSettings,
        adminUser.id
      );
      console.log('✅ SMTP settings saved successfully');
    } catch (error: any) {
      console.log('❌ Failed to save settings:', error.message);
      process.exit(1);
    }

    // Test connection
    console.log('\n🔌 Testing SMTP connection...');
    const testResult = await settingsService.testCurrentSmtpSettings();
    
    if (testResult.success) {
      console.log('✅ SMTP connection successful!');
      console.log(`   ${testResult.message}`);
    } else {
      console.log('❌ SMTP connection failed');
      console.log(`   ${testResult.message}`);
      if (testResult.details) {
        console.log('   Details:', testResult.details);
      }
      
      const retry = await question('\nDo you want to retry with different settings? (y/n): ');
      if (retry.toLowerCase() === 'y') {
        rl.close();
        await prisma.$disconnect();
        return main();
      }
      process.exit(1);
    }

    // Send test email
    const sendTest = await question('\n📨 Send test email? (y/n): ');
    if (sendTest.toLowerCase() === 'y') {
      const testEmail = await question('Recipient email: ');
      
      console.log('\n📧 Sending test email...');
      
      const currentSettings = await settingsService.getCurrentSmtpSettings();
      if (!currentSettings) {
        console.log('❌ No SMTP settings found');
        process.exit(1);
      }

      const emailResult = await settingsService.sendTestEmail(
        currentSettings,
        testEmail,
        {
          siteName: 'LicenseGate',
          userName: adminUser.fullName || 'Admin'
        }
      );

      if (emailResult.success) {
        console.log('✅ Test email sent successfully!');
        console.log(`   Sent to: ${testEmail}`);
        console.log(`   Message ID: ${emailResult.details?.messageId}`);
        console.log('\n📬 Check your inbox!');
      } else {
        console.log('❌ Failed to send test email');
        console.log(`   ${emailResult.message}`);
        if (emailResult.details) {
          console.log('   Details:', emailResult.details);
        }
      }
    }

    // Show saved settings (masked)
    console.log('\n📋 Saved SMTP Settings in Database:');
    console.log('-'.repeat(60));
    const savedSettings = await settingsService.getSettings(SettingsCategory.SMTP);
    console.log(`Host: ${savedSettings.host}`);
    console.log(`Port: ${savedSettings.port}`);
    console.log(`Username: ${savedSettings.username}`);
    console.log(`Password: ${'*'.repeat(savedSettings.password?.length || 0)}`);
    console.log(`Sender: ${savedSettings.sender}`);
    console.log(`Secure: ${savedSettings.secure}`);

    // Show audit logs
    console.log('\n📜 Recent Audit Logs:');
    console.log('-'.repeat(60));
    const auditLogs = await prisma.settingAudit.findMany({
      where: {
        category: SettingsCategory.SMTP,
        userId: adminUser.id
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 5
    });

    if (auditLogs.length > 0) {
      auditLogs.forEach((log, index) => {
        console.log(`${index + 1}. ${log.action} - ${log.key} at ${log.timestamp.toLocaleString()}`);
      });
    } else {
      console.log('No audit logs found');
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 SMTP Configuration Complete!');
    console.log('='.repeat(60));
    console.log('\n✅ Settings saved to database');
    console.log('✅ Connection tested successfully');
    console.log('✅ Audit logs created');
    console.log('\n🌐 You can now use the frontend to manage SMTP settings!');
    console.log('   Visit: http://localhost:5173/settings/smtp');

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

// Run
main()
  .then(() => process.exit(0))
  .catch((error: any) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

