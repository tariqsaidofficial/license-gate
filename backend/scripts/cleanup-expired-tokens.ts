/**
 * 🧹 Cleanup Script - Remove Expired Verification Tokens
 * 
 * يمكن تشغيله كـ Cron Job يومياً لتنظيف قاعدة البيانات
 * 
 * Cron: 0 2 * * * (كل يوم الساعة 2 صباحاً)
 */

import { cleanupExpiredTokens, getVerificationStats } from '../services/email/verification-service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanup() {
  console.log('🧹 Starting cleanup of expired verification tokens...\n');

  try {
    // Get stats before cleanup
    console.log('📊 Before cleanup:');
    const statsBefore = await getVerificationStats();
    console.log('   - Total tokens:', statsBefore.totalTokens);
    console.log('   - Active tokens:', statsBefore.activeTokens);
    console.log('   - Expired tokens:', statsBefore.expiredTokens);

    console.log('\n🗑️  Removing expired tokens...');

    // Cleanup
    const deletedCount = await cleanupExpiredTokens();
    
    console.log(`✅ Deleted ${deletedCount} expired tokens`);

    // Get stats after cleanup
    console.log('\n📊 After cleanup:');
    const statsAfter = await getVerificationStats();
    console.log('   - Total tokens:', statsAfter.totalTokens);
    console.log('   - Active tokens:', statsAfter.activeTokens);
    console.log('   - Expired tokens:', statsAfter.expiredTokens);

    // Additional cleanup: Remove old webhook events
    console.log('\n🗑️  Cleaning up old webhook events (older than 30 days)...');
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const deletedWebhooks = await prisma.webhookEvent.deleteMany({
      where: {
        createdAt: {
          lt: thirtyDaysAgo,
        },
        status: 'processed', // Only delete processed events
      },
    });

    console.log(`✅ Deleted ${deletedWebhooks.count} old webhook events`);

    console.log('\n✅ Cleanup completed successfully!');
  } catch (error) {
    console.error('\n❌ Cleanup failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run cleanup
if (require.main === module) {
  cleanup()
    .then(() => {
      console.log('\n🎉 Cleanup finished!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Cleanup failed:', error);
      process.exit(1);
    });
}

export { cleanup };
