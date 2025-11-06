import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

async function testLogin() {
  console.log('🔐 اختبار تسجيل الدخول');
  console.log('='.repeat(50));

  try {
    // البحث عن المستخدم الحالي
    const user = await prisma.user.findFirst({
      where: {
        email: 'info@dxbmark.com'
      }
    });

    if (!user) {
      console.log('❌ المستخدم غير موجود');
      return;
    }

    console.log('📋 معلومات المستخدم:');
    console.log(`   Email: ${user.email}`);
    console.log(`   ID: ${user.id}`);
    console.log(`   UserID: ${user.userID}`);
    console.log(`   Email Verified: ${user.isEmailVerified ? '✅ نعم' : '❌ لا'}`);
    console.log(`   Admin: ${user.isAdmin ? '✅ نعم' : '❌ لا'}`);
    console.log(`   Active: ${user.isActive ? '✅ نعم' : '❌ لا'}`);
    console.log(`   Has Password: ${user.passwordHash ? '✅ نعم' : '❌ لا'}`);
    console.log('');

    if (!user.passwordHash) {
      console.log('❌ المستخدم ليس لديه كلمة مرور');
      return;
    }

    // اختبار كلمات مرور مختلفة
    const testPasswords = [
      'password',
      'admin',
      '123456',
      'password123',
      'admin123',
      'test123',
      'dxbmark',
      'info@dxbmark.com'
    ];

    console.log('🔍 اختبار كلمات المرور المحتملة:');
    console.log('-'.repeat(40));

    for (const password of testPasswords) {
      try {
        const isValid = await argon2.verify(user.passwordHash, password);
        if (isValid) {
          console.log(`✅ كلمة المرور الصحيحة: "${password}"`);
          
          // اختبار تسجيل الدخول عبر API
          await testApiLogin(user.email, password);
          return;
        } else {
          console.log(`❌ "${password}" - خطأ`);
        }
      } catch (error) {
        console.log(`❌ "${password}" - خطأ في التحقق`);
      }
    }

    console.log('');
    console.log('⚠️  لم يتم العثور على كلمة المرور الصحيحة');
    console.log('💡 يمكنك إعادة تعيين كلمة المرور باستخدام:');
    console.log('   npm run set-admin');

  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function testApiLogin(email: string, password: string) {
  console.log('');
  console.log('🌐 اختبار تسجيل الدخول عبر API:');
  console.log('-'.repeat(40));

  try {
    const response = await fetch('http://localhost:3001/trpc/auth.loginWithPassword', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: {
          email,
          password
        }
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ تسجيل الدخول نجح عبر API');
      console.log('📋 الاستجابة:', JSON.stringify(data, null, 2));
      
      // فحص الكوكيز
      const cookies = response.headers.get('set-cookie');
      if (cookies) {
        console.log('🍪 الكوكيز المُعادة:', cookies);
      }
    } else {
      console.log('❌ فشل تسجيل الدخول عبر API');
      console.log('📋 الاستجابة:', response.status, response.statusText);
      const errorData = await response.text();
      console.log('📋 تفاصيل الخطأ:', errorData);
    }
  } catch (error) {
    console.log('❌ خطأ في الاتصال بـ API:', error instanceof Error ? error.message : String(error));
    console.log('💡 تأكد من تشغيل الخادم على http://localhost:3001');
  }
}

// تشغيل الاختبار
testLogin().catch(console.error);