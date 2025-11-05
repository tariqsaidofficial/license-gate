import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verifyUserEmail(email: string) {
  try {
    const user = await prisma.user.update({
      where: { email },
      data: { 
        emailVerified: true 
      }
    })
    
    console.log('✅ User email verified successfully!')
    console.log('User:', user.email)
    console.log('Email Verified:', user.emailVerified)
    console.log('Is Admin:', user.isAdmin)
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Get email from command line argument
const email = process.argv[2]

if (!email) {
  console.error('Usage: npx ts-node verify-user.ts <email>')
  process.exit(1)
}

verifyUserEmail(email)
