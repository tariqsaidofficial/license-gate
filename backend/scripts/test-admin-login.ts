#!/usr/bin/env ts-node

/**
 * Script to test admin user login
 * Usage: ts-node scripts/test-admin-login.ts
 */

import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function testAdminLogin() {
  try {
    const email = 'info@dxbmark.com';
    const password = 'SMS@dmin';
    
    console.log(`🔍 Testing login for: ${email}`);
    
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        uuid: true,
        email: true,
        passwordHash: true,
        isAdmin: true,
        isEmailVerified: true
      }
    });

    if (!user) {
      console.error(`❌ User not found: ${email}`);
      process.exit(1);
    }

    if (!user.passwordHash) {
      console.error(`❌ User has no password hash`);
      process.exit(1);
    }

    console.log(`📋 User found:`);
    console.log(`   ID: ${user.id}`);
    console.log(`   UUID: ${user.uuid}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Is Admin: ${user.isAdmin}`);
    console.log(`   Email Verified: ${user.isEmailVerified}`);

    // Test password verification
    console.log(`\n🔐 Testing password verification...`);
    const isPasswordValid = await argon2.verify(user.passwordHash, password);

    if (isPasswordValid) {
      console.log(`✅ Password verification successful!`);
      console.log(`✅ Admin user login test passed!`);
    } else {
      console.log(`❌ Password verification failed!`);
      process.exit(1);
    }

  } catch (error) {
    console.error(`❌ Error testing login:`, error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
testAdminLogin()
  .catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
