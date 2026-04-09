# HeartFlow - مستندات فارسی

**نسخه**: v2.3.0  
**آخرین به‌روزرسانی**: 2026-04-09

---

## 🌍 انتخاب زبان

- [🇺🇸 English](en/README.md)
- [🇨🇳 中文](zh/README.md)
- [🇯🇵 日本語](ja/README.md)
- [🇰🇷 한국어](ko/README.md)
- [🇫🇷 Français](fr/README.md)
- 🇮🇷 [فارسی](README.md) ← شما اینجا هستید

---

## ✨ HeartFlow چیست؟

HeartFlow یک سیستم همراه هوش مصنوعی با **معماری شناختی 9 بعدی** است:

| بعد | عملکرد |
|------|--------|
| 🧠 حلقه شناختی | R-CCAM: بازیابی→شناخت→کنترل→اقدام→حافظه |
| 🔄 خودتکامل | خودبهبودی + آرشیو عامل |
| 🌐 چندعاملی | توپولوژی پویا + مسیریابی هوشمند |
| ❤️ محاسبه احساس | LaScA مدل‌سازی قابل توضیح احساسات |
| 💾 سیستم حافظه | منحنی فراموشی ابینگهاوس + جستجوی 5 کاناله |
| 🛡️ اخلاق و امنیت | امنیت درجه‌بندی شده ASL-1/2/3 |
| 👤 هویت | پایداری هویت + خودترمیم |
| 🫀 زیست‌حسگر | HRV، جریان ویرایش، ردیابی چشم |
| 🤖 شناخت تجسمی | معماری دوگانه + زنجیره عمل-تفکر |

---

## 🚀 شروع سریع

```bash
# کلون و نصب
git clone https://github.com/yun520-1/mark-heartflow-skill.git
cd mark-heartflow-skill
npm install

# اجرای مستقیم
node bin/cli.js

# سرور API هم در دسترس
node bin/api-server.js
```

---

## 📦 نصب

### پیش‌نیازها

| نیازمندی | نسخه | دستور بررسی |
|----------|-------|-------------|
| Node.js | ≥ 18.x | `node --version` |
| npm | ≥ 8.x | `npm --version` |

### مراحل نصب

```bash
# 1. کلون
git clone https://github.com/yun520-1/mark-heartflow-skill.git
cd mark-heartflow-skill

# 2. نصب
npm install

# 3. تست
npm test

# 4. اجرا
npm start
```

---

## 💻 استفاده

### دستورات CLI

```bash
# حالت تعاملی
node bin/cli.js

# نمایش وضعیت
node bin/cli.js status

# اجرای تست‌ها
node bin/cli.js test

# تشخیص احساس
node bin/cli.js emotion "خیلی خوشحالم"

# ذخیره خاطره
node bin/cli.js remember "کاربر توضیحات مفصل را ترجیح می‌دهد"

# برنامه‌ریزی شناختی
node bin/cli.js plan "پیاده‌سازی احراز هویت" coding
```

---

## 🌐 سرور API

```bash
# راه‌اندازی سرور API (پورت پیش‌فرض 3456)
node bin/api-server.js
```

### نقاط پایانی API

| روش | نقطه پایانی | توضیح |
|-----|-------------|-------|
| GET | `/api/health` | بررسی سلامت |
| GET | `/api/status` | وضعیت سیستم |
| POST | `/api/emotion` | تشخیص احساس |
| POST | `/api/flow` | محاسبه جریان |
| POST | `/api/memory` | ذخیره/جستجوی حافظه |
| POST | `/api/plan` | برنامه‌ریزی شناختی |

---

## 📁 ساختار پروژه

```
mark-heartflow-skill/
├── bin/
│   ├── cli.js
│   └── api-server.js
├── src/core/
│   ├── heartflow-engine.js
│   ├── cognitive-loop.js
│   ├── triality-memory.js
│   └── ...
├── docs/
└── package.json
```

---

## 📊 تاریخچه نسخه‌ها

| نسخه | تاریخ | ویژگی‌ها |
|------|-------|----------|
| v2.3.0 | 2026-04-09 | معماری شناختی 9 بعدی |
| v2.2.3 | 2026-04-09 | TrialityMemory + EmbodiedCore |

---

*HeartFlow - قلب و ذهن به هوش مصنوعی*