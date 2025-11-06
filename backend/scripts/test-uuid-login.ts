#!/usr/bin/env ts-node

/**
 * Script to test login and see the UUID
 * Usage: ts-node scripts/test-uuid-login.ts
 */

import { PrismaClient } from '@prisma/client';
import { loginWithPassword } from '../src/controller/auth-flows';

const prisma = new PrismaClient();

async function testUuidLogin() {
  try {
    const email = 'info@dxbmark.com';
    const password = 'SMS@dmin';
    
    console.log(`🔍 Testing login with UUID return for: ${email}`);
    
    // Test the loginWithPassword function directly
    const result = await loginWithPassword(email, password);
    
    console.log(`✅ Login successful!`);
    console.log(`📋 Login result:`);
    console.log(`   User ID (UUID): ${result.userId}`);
    console.log(`   Access Token: ${result.accessToken.substring(0, 20)}...`);
    console.log(`   Refresh Token: ${result.refreshToken.substring(0, 20)}...`);

    // Also get the user details to verify
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        uuid: true,
        email: true,
        isAdmin: true,
        isEmailVerified: true
      }
    });

    if (user) {
      console.log(`\n📋 User details from database:`);
      console.log(`   Internal ID: ${user.id}`);
      console.log(`   UUID: ${user.uuid}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Is Admin: ${user.isAdmin}`);
      console.log(`   Email Verified: ${user.isEmailVerified}`);
      
      console.log(`\n✅ UUID matches: ${result.userId === user.uuid ? 'Yes' : 'No'}`);
    }

  } catch (error) {
    console.error(`❌ Error testing login:`, error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
testUuidLogin()
  .catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
