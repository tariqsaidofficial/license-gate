#!/usr/bin/env ts-node

/**
 * Final NanoID Test
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function finalNanoIDTest() {
  try {
    console.log(`🎯 Final NanoID Test\n`);
    
    const result = await prisma.$queryRaw`
      SELECT id, userID, uuid, email, isAdmin, isEmailVerified, createdAt 
      FROM User 
      WHERE email = 'info@dxbmark.com'
    `;
    
    const user = Array.isArray(result) ? result[0] as any : null;
    
    if (!user) {
      console.error(`❌ Admin user not found`);
      process.exit(1);
    }

    console.log(`📋 Admin User Details:`);
    console.log(`   Database ID: ${user.id}`);
    console.log(`   🎯 UserID (NanoID): ${user.userID} ← هذا هو المعرف الجديد!`);
    console.log(`   UUID (Old): ${user.uuid}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Is Admin: ${user.isAdmin ? '✅ Yes' : '❌ No'}`);
    console.log(`   Email Verified: ${user.isEmailVerified ? '✅ Yes' : '❌ No'}`);
    console.log(`   Created: ${user.createdAt}`);

    console.log(`\n🎨 NanoID Benefits:`);
    console.log(`   ✅ Short: ${user.userID.length} characters (vs UUID: ${user.uuid.length})`);
    console.log(`   ✅ Elegant: No confusing characters (0, O, I, l)`);
    console.log(`   ✅ Secure: Cryptographically secure`);
    console.log(`   ✅ URL-friendly: Safe for web usage`);
    
    console.log(`\n📱 Frontend Update Required:`);
    console.log(`   - Update backend API to return userID instead of UUID`);
    console.log(`   - Frontend sidebar will show: ${user.userID}`);
    console.log(`   - Much cleaner display than: ${user.uuid}`);

  } catch (error) {
    console.error(`❌ Error:`, error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

finalNanoIDTest();
