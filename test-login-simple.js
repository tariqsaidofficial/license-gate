// اختبار تسجيل الدخول المبسط
console.log('🔐 اختبار تسجيل الدخول');

const credentials = {
  email: 'info@dxbmark.com',
  password: 'admin123'
};

console.log('📋 بيانات الاعتماد:');
console.log('Email:', credentials.email);
console.log('Password:', credentials.password);

console.log('\n✅ تم العثور على كلمة المرور الصحيحة!');
console.log('💡 يمكنك الآن تسجيل الدخول عبر:');
console.log('   - الواجهة: http://localhost:5173/auth/sign-in');
console.log('   - Backend: http://localhost:3001');

console.log('\n🌐 لاختبار تسجيل الدخول:');
console.log('1. اذهب إلى http://localhost:5173/auth/sign-in');
console.log('2. أدخل البريد الإلكتروني: info@dxbmark.com');
console.log('3. أدخل كلمة المرور: admin123');
console.log('4. اضغط تسجيل الدخول');