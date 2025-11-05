import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verifyAllUsers() {
  try {
    // عرض جميع المستخدمين أولاً
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        isEmailVerified: true,
        isAdmin: true,
        createdAt: true
      }
    })
    
    console.log('\n📋 المستخدمون الحاليون:')
    console.log('========================')
    users.forEach((user, index) => {
      console.log(`\n${index + 1}. Email: ${user.email}`)
      console.log(`   ID: ${user.id}`)
      console.log(`   Verified: ${user.isEmailVerified ? '✅' : '❌'}`)
      console.log(`   Admin: ${user.isAdmin ? '✅' : '❌'}`)
      console.log(`   Created: ${user.createdAt}`)
    })
    
    // تحديث جميع المستخدمين ليكونوا موثقين
    const result = await prisma.user.updateMany({
      where: { isEmailVerified: false },
      data: { isEmailVerified: true }
    })
    
    console.log(`\n✅ تم التحقق من ${result.count} مستخدم(مستخدمين)`)
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

verifyAllUsers()
