import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkUser(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })
    
    if (!user) {
      console.log('❌ المستخدم غير موجود')
      return
    }
    
    console.log('\n📋 معلومات المستخدم:')
    console.log('====================')
    console.log(`Email: ${user.email}`)
    console.log(`ID: ${user.id}`)
    console.log(`Email Verified: ${user.isEmailVerified ? '✅ نعم' : '❌ لا'}`)
    console.log(`Admin: ${user.isAdmin ? '✅ نعم' : '❌ لا'}`)
    console.log(`Has Password: ${user.passwordHash ? '✅ نعم' : '❌ لا'}`)
    console.log(`Created: ${user.createdAt}`)
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

const email = process.argv[2] || 'info@dxbmark.com'
checkUser(email)
