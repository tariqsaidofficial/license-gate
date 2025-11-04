#!/usr/bin/env ts-node

/**
 * Script to set a user as Admin
 * Usage: 
 *   npm run set-admin <email>
 *   OR
 *   ts-node scripts/set-admin.ts <email>
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setUserAsAdmin(email: string) {
  try {
    console.log(`🔍 Searching for user: ${email}`);
    
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        isAdmin: true,
        isEmailVerified: true,
        createdAt: true
      }
    });

    if (!user) {
      console.error(`❌ User not found: ${email}`);
      process.exit(1);
    }

    console.log(`\n📋 Current user details:`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Email Verified: ${user.isEmailVerified}`);
    console.log(`   Is Admin: ${user.isAdmin}`);
    console.log(`   Created At: ${user.createdAt}`);

    if (user.isAdmin) {
      console.log(`\n⚠️  User is already an admin!`);
      process.exit(0);
    }

    console.log(`\n🔧 Setting user as admin...`);
    
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { isAdmin: true },
      select: {
        id: true,
        email: true,
        isAdmin: true
      }
    });

    console.log(`\n✅ Success! User is now an admin:`);
    console.log(`   ID: ${updatedUser.id}`);
    console.log(`   Email: ${updatedUser.email}`);
    console.log(`   Is Admin: ${updatedUser.isAdmin}`);

  } catch (error) {
    console.error(`❌ Error:`, error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Main execution
const email = process.argv[2];

if (!email) {
  console.error(`❌ Please provide an email address`);
  console.log(`\nUsage: ts-node scripts/set-admin.ts <email>`);
  process.exit(1);
}

setUserAsAdmin(email);
