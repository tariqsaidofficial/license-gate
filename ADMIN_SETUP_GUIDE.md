# 🔐 دليل إعداد Admin و تفعيل البريد

## المشكلة الحالية
عند محاولة تسجيل الدخول، تظهر رسالة: **"Your email address has not been verified"**

---

## ✅ الحلول المتاحة

### الحل 1: جعل جميع المستخدمين مُفعّلين (للتطوير فقط)

```bash
cd /Users/sunmarke/license-gate/backend
docker exec -i license-gate-mysql mysql -uroot -ppassword license_gate << 'EOF'
UPDATE User SET isEmailVerified = 1, isAdmin = 1;
SELECT id, email, isEmailVerified, isAdmin FROM User;
EOF
```

---

### الحل 2: تفعيل مستخدم محدد بالبريد الإلكتروني

```bash
cd /Users/sunmarke/license-gate/backend
docker exec -i license-gate-mysql mysql -uroot -ppassword license_gate << 'EOF'
UPDATE User 
SET isEmailVerified = 1, isAdmin = 1 
WHERE email = 'your-email@example.com';

SELECT id, email, isEmailVerified, isAdmin FROM User WHERE email = 'your-email@example.com';
EOF
```

**استبدل `your-email@example.com` ببريدك الفعلي**

---

### الحل 3: استخدام سكريبت Prisma (الأفضل)

```bash
cd /Users/sunmarke/license-gate/backend
npx ts-node scripts/make-admin.ts your-email@example.com
```

---

### الحل 4: تعطيل التحقق من البريد مؤقتاً

في ملف `.env` في Backend، أضف أو عدّل:

```bash
DISABLE_EMAIL_VERIFICATION=true
```

ثم أعد تشغيل Backend.

---

## 📊 فحص حالة المستخدمين

```bash
cd /Users/sunmarke/license-gate/backend
docker exec -i license-gate-mysql mysql -uroot -ppassword license_gate << 'EOF'
SELECT 
    id, 
    email, 
    isEmailVerified, 
    isAdmin, 
    DATE_FORMAT(createdAt, '%Y-%m-%d %H:%i:%s') as created_at
FROM User 
ORDER BY id;
EOF
```

---

## 🔧 معلومات الاتصال بقاعدة البيانات

- **Host:** localhost
- **Port:** 3306
- **Database:** license_gate
- **User:** root
- **Password:** password
- **Container:** license-gate-mysql

---

## 📝 ملاحظات مهمة

### مشكلة SMTP
إذا رأيت خطأ `Error: connect ECONNREFUSED ::1:587` في logs، هذا طبيعي لأن:
- لا يوجد SMTP server محلي مُشغّل
- التطبيق يحاول إرسال بريد تأكيد

**الحلول:**
1. تعطيل التحقق من البريد مؤقتاً
2. استخدام خدمة SMTP حقيقية (Gmail, SendGrid, إلخ)
3. تفعيل الحسابات يدوياً من قاعدة البيانات

---

## 🚀 التشغيل السريع

لجعل حساب admin مُفعّل بسرعة:

```bash
# البريد الحالي المسجل
EMAIL="info@dxbmark.com"

# تفعيل الحساب
cd /Users/sunmarke/license-gate/backend
docker exec -i license-gate-mysql mysql -uroot -ppassword license_gate -e "UPDATE User SET isEmailVerified = 1, isAdmin = 1 WHERE email = '$EMAIL'; SELECT * FROM User WHERE email = '$EMAIL'\\G"
```

---

## ✅ التحقق من النجاح

بعد تنفيذ أي حل، جرّب:

1. مسح cookies وcache المتصفح
2. تسجيل الدخول مرة أخرى
3. يجب أن تنجح العملية ✅

---

**آخر تحديث:** 5 نوفمبر 2025
