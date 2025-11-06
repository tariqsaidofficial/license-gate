import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        userID: true,
        email: true,
        isAdmin: true,
        isEmailVerified: true,
        createdAt: true
      }
    })

    console.log('📊 Current users in database:')
    console.log('================================')
    
    if (users.length === 0) {
      console.log('❌ No users found in database')
    } else {
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email}`)
        console.log(`   - ID: ${user.userID}`)
        console.log(`   - Admin: ${user.isAdmin ? '✅' : '❌'}`)
        console.log(`   - Verified: ${user.isEmailVerified ? '✅' : '❌'}`)
        console.log(`   - Created: ${user.createdAt.toLocaleString()}`)
        console.log('')
      })
    }

    const adminUsers = users.filter(user => user.isAdmin)
    console.log(`📈 Total users: ${users.length}`)
    console.log(`👑 Admin users: ${adminUsers.length}`)
    
  } catch (error) {
    console.error('❌ Error checking users:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUsers()
