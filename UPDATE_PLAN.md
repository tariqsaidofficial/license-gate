# 📦 خطة تحديث المكتبات - LicenseGate

## ✅ تنفيذ التحديثات الآمنة فقط (Wanted - بدون Major)

---

## 🔧 Backend Updates

### الأمر الشامل للتحديثات الآمنة:
```bash
cd /Users/sunmarke/license-gate/backend

# تحديث المكتبات إلى Wanted versions فقط
npm update

# تحديثات محددة (Patch & Minor فقط):
npm install --save-dev \
  @types/cookie-parser@1.4.10 \
  @types/cors@2.8.19 \
  @types/jsonwebtoken@9.0.10

npm install \
  axios@1.13.2
```

### ما لن يتم تحديثه (Major versions):
- ❌ @prisma/client: 5.22.0 → 6.18.0
- ❌ @trpc/server: 10.45.2 → 11.7.1
- ❌ TypeScript: 4.9.5 → 5.9.3
- ❌ Express: 4.21.2 → 5.1.0
- ❌ Zod: 3.24.2 → 4.1.12

---

## 🎨 Frontend Updates

### الأمر الشامل للتحديثات الآمنة:
```bash
cd /Users/sunmarke/license-gate/frontend

# تحديث المكتبات إلى Wanted versions فقط
npm update

# تحديثات محددة:
npm install --save-dev \
  @types/d3@7.4.3 \
  @types/lodash@4.17.20 \
  autoprefixer@10.4.21 \
  highlight.js@11.11.1 \
  material-icons@1.13.14 \
  postcss@8.5.6 \
  sass@1.93.3 \
  tslib@2.8.1 \
  typescript@5.9.3

npm install \
  d3@7.9.0
```

### ما لن يتم تحديثه (Major versions):
- ❌ @sveltejs/kit: 1.30.3 → 2.48.4
- ❌ Svelte: 3.58.0 → 5.43.3
- ❌ Vite: 4.2.1 → 7.1.12
- ❌ Tailwind: 3.4.1 → 4.1.16

---

## 🚀 تنفيذ التحديثات

### الخطوة 1: Backend
```bash
cd /Users/sunmarke/license-gate/backend
npm update
npm audit fix
```

### الخطوة 2: Frontend  
```bash
cd /Users/sunmarke/license-gate/frontend
npm update
npm audit fix
```

### الخطوة 3: اختبار
```bash
# إعادة تشغيل Backend
cd /Users/sunmarke/license-gate/backend
npm run dev

# في terminal آخر - إعادة تشغيل Frontend
cd /Users/sunmarke/license-gate/frontend
npm run dev
```

---

## 📊 النتائج المتوقعة

### Backend:
- ✅ تحديث 4 مكتبات إلى Wanted versions
- ⚠️ بقاء 19 مكتبة على major versions قديمة (آمن)
- ✅ إصلاح بعض الثغرات الأمنية

### Frontend:
- ✅ تحديث 10+ مكتبات إلى Wanted versions
- ⚠️ بقاء 18+ مكتبة على major versions قديمة (آمن)
- ✅ إصلاح بعض الثغرات الأمنية

---

## ⚠️ ملاحظات مهمة

1. **npm update** يحدث فقط إلى Wanted versions (لا يعمل major updates)
2. **npm audit fix** قد يحدث بعض المكتبات التابعة (dependencies)
3. **لا تستخدم** `npm audit fix --force` - سيقوم بتحديثات major

---

## 🔍 التحقق بعد التحديث

```bash
# Backend
cd /Users/sunmarke/license-gate/backend
npm outdated

# Frontend
cd /Users/sunmarke/license-gate/frontend
npm outdated
```

---

**الحالة:** جاهز للتنفيذ ✅
**التاريخ:** 5 نوفمبر 2025
