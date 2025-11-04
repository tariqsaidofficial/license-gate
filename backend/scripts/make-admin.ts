/**
 * Script to make a user Admin and verify their email
 * 
 * Usage:
 * npx ts-node scripts/make-admin.ts <email>
 * 
 * Example:
 * npx ts-node scripts/make-admin.ts user@example.com
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function makeUserAdmin(email: string) {
  try {
    // Find and update the user
    const user = await prisma.user.update({
      where: { email },
      data: {
        isAdmin: true,
        isEmailVerified: true,
      },
      select: {
        id: true,
        email: true,
        isAdmin: true,
        isEmailVerified: true,
        createdAt: true,
      },
    });

    console.log('✅ User updated successfully:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`ID:              ${user.id}`);
    console.log(`Email:           ${user.email}`);
    console.log(`Admin:           ${user.isAdmin ? '✅ Yes' : '❌ No'}`);
    console.log(`Email Verified:  ${user.isEmailVerified ? '✅ Yes' : '❌ No'}`);
    console.log(`Created:         ${user.createdAt.toISOString()}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  } catch (error: any) {
    if (error.code === 'P2025') {
      console.error(`❌ Error: User with email "${email}" not found.`);
    } else {
      console.error('❌ Error:', error.message);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.error('❌ Error: Please provide an email address');
  console.log('\nUsage: npx ts-node scripts/make-admin.ts <email>');
  console.log('Example: npx ts-node scripts/make-admin.ts user@example.com');
  process.exit(1);
}

makeUserAdmin(email);
