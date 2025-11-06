#!/usr/bin/env ts-node

/**
 * List users with NanoID using raw query
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listUsersWithNanoID() {
  try {
    console.log(`🔍 Fetching all users with NanoID...\n`);
    
    const users = await prisma.$queryRaw`
      SELECT id, userID, email, isAdmin, isEmailVerified, createdAt 
      FROM User 
      ORDER BY createdAt DESC
    `;

    const userArray = Array.isArray(users) ? users as any[] : [];

    if (userArray.length === 0) {
      console.log(`⚠️  No users found in database`);
      return;
    }

    console.log(`📋 Total users: ${userArray.length}\n`);
    console.log(`${'ID'.padEnd(5)} | ${'UserID (NanoID)'.padEnd(20)} | ${'Email'.padEnd(30)} | ${'Admin'.padEnd(8)} | ${'Verified'.padEnd(10)} | Created At`);
    console.log(`${'-'.repeat(5)}-+-${'-'.repeat(20)}-+-${'-'.repeat(30)}-+-${'-'.repeat(8)}-+-${'-'.repeat(10)}-+-${'-'.repeat(19)}`);

    userArray.forEach(user => {
      const id = user.id.toString().padEnd(5);
      const userID = (user.userID || 'Not Set').padEnd(20);
      const email = user.email.padEnd(30);
      const isAdmin = (user.isAdmin ? '✅ Yes' : '❌ No').padEnd(8);
      const isVerified = (user.isEmailVerified ? '✅ Yes' : '❌ No').padEnd(10);
      const createdAt = new Date(user.createdAt).toISOString().split('T')[0];
      
      console.log(`${id} | ${userID} | ${email} | ${isAdmin} | ${isVerified} | ${createdAt}`);
    });

    console.log(`\n✅ Done!`);

  } catch (error) {
    console.error(`❌ Error:`, error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

listUsersWithNanoID();
