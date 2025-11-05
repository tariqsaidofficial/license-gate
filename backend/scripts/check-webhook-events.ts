import 'dotenv-safe/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkWebhookEvents() {
  console.log('🔍 Checking recent webhook events...\n');
  
  try {
    const events = await prisma.webhookEvent.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });
    
    if (events.length === 0) {
      console.log('❌ No webhook events found in database');
    } else {
      console.log(`✅ Found ${events.length} webhook events:\n`);
      
      events.forEach((event: any, index: number) => {
        console.log(`${index + 1}. Event ID: ${event.eventId}`);
        console.log(`   Type: ${event.eventType}`);
        console.log(`   Status: ${event.status}`);
        console.log(`   Provider: ${event.provider}`);
        console.log(`   Created: ${event.createdAt}`);
        console.log(`   Processed: ${event.processedAt || 'Not yet'}`);
        console.log(`   Error: ${event.errorMessage || 'None'}`);
        // Show part of payload for context
        const payload = JSON.stringify(event.payload);
        console.log(`   Payload (first 100 chars): ${payload.substring(0, 100)}...`);
        console.log('');
      });
    }
    
    // Also check licenses
    console.log('\n📄 Recent Licenses:\n');
    const licenses = await prisma.license.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      take: 5,
      include: {
        user: {
          select: {
            email: true
          }
        }
      }
    });
    
    if (licenses.length === 0) {
      console.log('❌ No licenses found');
    } else {
      licenses.forEach((license: any, index: number) => {
        console.log(`${index + 1}. License Key: ${license.licenseKey}`);
        console.log(`   User Email: ${license.user.email}`);
        console.log(`   Name: ${license.name}`);
        console.log(`   Active: ${license.active}`);
        console.log(`   Created: ${license.createdAt}`);
        console.log(`   Notes: ${license.notes || 'None'}`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('❌ Error querying database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

checkWebhookEvents();
