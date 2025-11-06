#!/usr/bin/env ts-node

/**
 * Script to test API endpoints
 * Usage: ts-node scripts/test-api.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testAPI() {
  try {
    console.log(`🔍 Testing login API...`);
    
    const response = await fetch('http://localhost:3001/trpc/auth.loginWithPassword', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'info@dxbmark.com',
        password: 'SMS@dmin'
      })
    });

    const result = await response.text();
    console.log(`📋 Login response:`, result);

  } catch (error) {
    console.error(`❌ Error:`, error);
  } finally {
    await prisma.$disconnect();
  }
}

testAPI();
