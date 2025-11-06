#!/usr/bin/env ts-node

/**
 * Script to create an admin user
 * Usage: ts-node scripts/create-admin-user.ts
 */

import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import NodeRSA from 'node-rsa';
import { generateUserID } from '../src/utils/nanoid';

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    const email = 'info@dxbmark.com';
    const password = 'SMS@dmin';
    
    console.log(`🔍 Checking if user already exists: ${email}`);
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      console.log(`⚠️  User already exists. Updating to admin status and verifying email...`);
      
      // Hash the new password
      const hashedPassword = await argon2.hash(password);
      
      const updatedUser = await prisma.user.update({
        where: { email },
        data: {
          passwordHash: hashedPassword,
          isAdmin: true,
          isEmailVerified: true
        },
        select: {
          id: true,
          email: true,
          isAdmin: true,
          isEmailVerified: true,
          createdAt: true
        }
      });

      console.log(`\n✅ User updated successfully!`);
      console.log(`   ID: ${updatedUser.id}`);
      console.log(`   Email: ${updatedUser.email}`);
      console.log(`   Email Verified: ${updatedUser.isEmailVerified}`);
      console.log(`   Is Admin: ${updatedUser.isAdmin}`);
      console.log(`   Created At: ${updatedUser.createdAt}`);
      
    } else {
      console.log(`📝 Creating new admin user...`);
      
      // Hash the password
      const hashedPassword = await argon2.hash(password);
      
      // Generate elegant NanoID
      const userID = generateUserID();
      
      // Generate RSA keys for the user
      const rsaKey = new NodeRSA({ b: 2048 });
      const publicKey = rsaKey.exportKey('public');
      const privateKey = rsaKey.exportKey('private');
      
      const newUser = await prisma.user.create({
        data: {
          email,
          userID,
          passwordHash: hashedPassword,
          isAdmin: true,
          isEmailVerified: true,
          rsaPublicKey: publicKey,
          rsaPrivateKey: privateKey
        },
        select: {
          id: true,
          email: true,
          isAdmin: true,
          isEmailVerified: true,
          createdAt: true
        }
      });

      console.log(`\n✅ Admin user created successfully!`);
      console.log(`   ID: ${newUser.id}`);
      console.log(`   Email: ${newUser.email}`);
      console.log(`   Email Verified: ${newUser.isEmailVerified}`);
      console.log(`   Is Admin: ${newUser.isAdmin}`);
      console.log(`   Created At: ${newUser.createdAt}`);
    }

  } catch (error) {
    console.error(`❌ Error creating admin user:`, error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createAdminUser()
  .catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
