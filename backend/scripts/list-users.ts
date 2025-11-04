#!/usr/bin/env ts-node

/**
 * Script to list all users
 * Usage: 
 *   npm run list-users
 *   OR
 *   ts-node scripts/list-users.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listUsers() {
  try {
    console.log(`🔍 Fetching all users...\n`);
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        isAdmin: true,
        isEmailVerified: true,
        createdAt: true,
        _count: {
          select: {
            licenses: true,
            apiKeys: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (users.length === 0) {
      console.log(`⚠️  No users found in database`);
      return;
    }

    console.log(`📋 Total users: ${users.length}\n`);
    console.log(`${'ID'.padEnd(5)} | ${'Email'.padEnd(30)} | ${'Admin'.padEnd(8)} | ${'Verified'.padEnd(10)} | ${'Licenses'.padEnd(10)} | ${'API Keys'.padEnd(10)} | Created At`);
    console.log(`${'-'.repeat(5)}-+-${'-'.repeat(30)}-+-${'-'.repeat(8)}-+-${'-'.repeat(10)}-+-${'-'.repeat(10)}-+-${'-'.repeat(10)}-+-${'-'.repeat(19)}`);

    users.forEach(user => {
      const id = user.id.toString().padEnd(5);
      const email = user.email.padEnd(30);
      const isAdmin = (user.isAdmin ? '✅ Yes' : '❌ No').padEnd(8);
      const isVerified = (user.isEmailVerified ? '✅ Yes' : '❌ No').padEnd(10);
      const licenses = user._count.licenses.toString().padEnd(10);
      const apiKeys = user._count.apiKeys.toString().padEnd(10);
      const createdAt = user.createdAt.toISOString().split('T')[0];
      
      console.log(`${id} | ${email} | ${isAdmin} | ${isVerified} | ${licenses} | ${apiKeys} | ${createdAt}`);
    });

    console.log(`\n✅ Done!`);

  } catch (error) {
    console.error(`❌ Error:`, error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

listUsers();
