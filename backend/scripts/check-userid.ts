#!/usr/bin/env ts-node

/**
 * Check database directly for userID field
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUserID() {
  try {
    // Use raw query to check the field
    const result = await prisma.$queryRaw`SELECT id, uuid, userID, email FROM User WHERE email = 'info@dxbmark.com'`;
    
    console.log('Raw database result:', result);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserID();
