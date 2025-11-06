import { PrismaClient } from '@prisma/client'
import * as argon2 from 'argon2'
import { nanoid } from 'nanoid'
import NodeRSA from 'node-rsa'

const prisma = new PrismaClient()

async function createAdminUser() {
  try {
    // Check if admin user already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { isAdmin: true }
    })

    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.email)
      return
    }

    // Create admin user
    const hashedPassword = await argon2.hash('admin123')
    
    // Generate RSA keys
    const rsaKey = new NodeRSA({ b: 2048 })
    const publicKey = rsaKey.exportKey('public')
    const privateKey = rsaKey.exportKey('private')
    
    const adminUser = await prisma.user.create({
      data: {
        userID: nanoid(),
        email: 'info@dxbmark.com',
        fullName: 'DXB Mark Administrator',
        passwordHash: hashedPassword,
        isAdmin: true,
        isEmailVerified: true,
        company: 'DXB Mark',
        maxLicenses: 1000,
        maxApiKeys: 100,
        rsaPublicKey: publicKey,
        rsaPrivateKey: privateKey,
      }
    })

    console.log('Admin user created successfully:')
    console.log('Email:', adminUser.email)
    console.log('Password: admin123')
    console.log('UserID:', adminUser.userID)
  } catch (error) {
    console.error('Error creating admin user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createAdminUser()
