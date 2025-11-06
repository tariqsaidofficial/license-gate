// Quick admin user creation for testing
const { PrismaClient } = require('@prisma/client')
const argon2 = require('argon2')
const { nanoid } = require('nanoid')
const NodeRSA = require('node-rsa')

const prisma = new PrismaClient()

async function createAdmin() {
  try {
    const hashedPassword = await argon2.hash('admin123')
    const rsaKey = new NodeRSA({ b: 2048 })
    
    const adminUser = await prisma.user.create({
      data: {
        userID: nanoid(),
        email: 'admin@licensegte.com',
        passwordHash: hashedPassword,
        isAdmin: true,
        isEmailVerified: true,
        rsaPublicKey: rsaKey.exportKey('public'),
        rsaPrivateKey: rsaKey.exportKey('private'),
      }
    })

    console.log('Admin user created successfully!')
    console.log('Email: admin@licensegte.com')
    console.log('Password: admin123')
    console.log('UserID:', adminUser.userID)
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()
