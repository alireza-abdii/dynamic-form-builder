# سامانه فرم‌ساز پویا و بدون سرور سازمانی
## Dynamic Form Builder Ecosystem (100% Free & Serverless)

یک پلتفرم فرم‌ساز مدرن، سازمانی و کاملاً رایگان که با **Google Apps Script**، **Google Sheets** و **Telegram Mini Apps** پیاده‌سازی شده است. هر زمان که سازمان به جمع‌آوری اطلاعات نیاز دارد، تنها با یک دستور یا یک فایل JSON، فرم جدید با اعتبارسنجی‌های سخت‌گیرانه تولید شده و لینک اشتراک‌گذاری، بات تلگرام و خروجی مستقیم اکسل (`.xlsx`) در دسترس قرار می‌گیرد.

---

## 🌟 ویژگی‌های کلیدی (Key Features)

- **۱۰۰٪ رایگان و بدون سرور:** متکی بر ابزارهای متن‌باز و سهمیه رایگان Google Workspace و هاست‌های استاتیک.
- **تک منبع حقیقت (Single Source of Truth):** تعریف هر فرم فقط در یک فایل `shared/forms/<formId>.json`.
- **موتور فرم کاملاً فارسی و راست‌چین (RTL-First):** فونت استاندارد Vazirmatn، کلاس‌های منطقی Tailwind، اعتبارسنجی فارسی و تقویم شمسی جلالی.
- **اعتبارسنجی‌های تخصصی ایران:** کد ملی با الگوریتم کنترل رقم (Checksum)، شماره موبایل همراه اول و ایرانسل، کد پستی و ارقام فارسی.
- **یکپارچگی عمیق با تلگرام:** پشتیبانی به عنوان Telegram Mini App با هماهنگی خودکار رنگ تم تلگرام (Light/Dark)، لرزش لمسی (Haptics) و دکمه اصلی (MainButton).
- **ربات تلگرام هوشمند با خروجی اکسل:**
  - دستور `/forms`: مشاهده فرم‌های فعال همراه با دکمه‌های شیشه‌ای.
  - دستور `/export <formId>`: تولید لحظه‌ای فایل بومی اکسل (`.xlsx`) و ارسال به چت ادمین.
  - دستور `/stats <formId>`: آمار پاسخ‌های کل و ثبت‌شده‌های امروز.
  - اعلان لحظه‌ای به مدیران سازمان پس از ثبت هر فرم.
- **دور زدن محدودیت‌های CORS:** استفاده از هدر `Content-Type: text/plain;charset=utf-8` جهت ارسال مستقیم به Google Apps Script بدون شکست پیش‌پرواز (Preflight).
- **مهارت خودکار در Antigravity (`/new-form`):** تولید فرم جدید از روی توضیحات متنی کاربر تنها با یک دستور.

---

## 🏗️ ساختار پروژه (Monorepo Directory Structure)

```text
Form-Builder/
├── AGENTS.md                          # قوانین و استانداردهای سراسری هوش مصنوعی
├── .env.example                       # نمونه متغیرهای محیطی
├── .agents/                           # تنظیمات و مهارت‌های Antigravity
│   ├── rules/security.md              # قوانین امنیت توکن‌ها و دیپلوی
│   ├── skills/new-form/               # مهارت ساخت خودکار فرم با دستور /new-form
│   ├── skills/deploy-gas/             # مهارت دیپلوی امن Google Apps Script
│   ├── skills/bot-setup/              # مهارت راه‌اندازی ربات تلگرام
│   └── hooks.json                     # هوک‌های محافظتی قبل از اجرای دستورات
├── shared/                            # کدهای مشترک فرانت‌اند و بک‌اند (@fb/shared)
│   ├── forms/                         # ⭐ فایل‌های JSON فرم‌ها (منبع حقیقت)
│   ├── src/definition.schema.ts       # متامدل فرم‌ها با Zod
│   ├── src/build-zod.ts               # سازنده داینامیک Zod با پیام‌های فارسی
│   ├── src/validators/                # اعتبارسنج کد ملی، موبایل، اعداد فارسی
│   ├── src/jalali.ts                  # تبدیل و اعتبارسنجی تاریخ شمسی
│   └── src/generated/registry.ts      # رجیستری خودکار فرم‌ها
├── frontend/                          # رابط کاربری React 19 + Vite + Tailwind + shadcn/ui
│   ├── src/components/form-engine/    # رندرر داینامیک فرم و فیلدها
│   ├── src/components/ui/jalali-calendar.tsx # تقویم شمسی جلالی تعاملی
│   ├── src/lib/telegram/              # آداپتور Telegram Mini App و تم
│   └── src/lib/api/gas-client.ts      # کلاینت ارتباط با GAS
├── gas-backend/                       # بک‌اند Google Apps Script
│   ├── src/router.ts                  # وب‌هوک تلگرام و پردازش فرم
│   ├── src/sheets/repository.ts       # ساخت خودکار تب و ذخیره ردیف‌ها
│   ├── src/export/xlsx-exporter.ts    # خروجی اکسل مستقل تب فرم
│   └── src/telegram/update.handler.ts # پردازش دستورات ربات
└── scripts/                           # اسکریپت‌های اتوماسیون
    ├── gas-deploy.mjs                 # دیپلوی ایمن با شناسه ثابت
    └── telegram-setup.mjs             # ثبت وب‌هوک و دستورات ربات تلگرام
```

---

## 🚀 راهنمای راه‌اندازی سریع (Quick Start)

### ۱. نصب وابستگی‌ها
```bash
npm install
```

### ۲. پیکربندی فایل `.env`
فایل `.env.example` را به `.env` کپی کرده و اطلاعات را پر کنید:
```env
TELEGRAM_BOT_TOKEN="توکن_ربات_از_بات‌فادر"
WEBHOOK_SECRET="یک_رشته_تصادفی_امنیتی"
ADMIN_CHAT_IDS="شناسه_عددی_ادمین_تلگرام"
SPREADSHEET_ID="شناسه_گوگل_شیت"
GAS_DEPLOYMENT_ID="شناسه_دیپلوی_گوگل_اسکریپت"
GAS_WEB_APP_URL="نشانی_وب‌اپ_گوگل_اسکریپت"
VITE_GAS_URL="نشانی_وب‌اپ_گوگل_اسکریپت"
VITE_PUBLIC_BASE_URL="http://localhost:5173"
VITE_BOT_USERNAME="نام_کاربری_ربات_شما"
VITE_TMA_SHORTNAME="forms"
```

### ۳. بررسی صحت و آزمون‌ها (Definition of Done)
```bash
# اعتبارسنجی فرم‌ها
npm run forms:validate

# همگام‌سازی رجیستری فرم‌ها
npm run forms:sync

# اجرای آزمون‌های خودکار
npm test

# بررسی خطاهای تایپ‌اسکریپت
npm run typecheck

# بررسی لینت و قوانین RTL
npm run lint

# ساخت تمام پکیج‌ها
npm run build
```

### ۴. دیپلوی خودکار بک‌اند به Google Apps Script
```bash
npm run gas:deploy
```

### ۵. ثبت خودکار وب‌هوک و منوی ربات تلگرام
```bash
npm run tg:setup
```

---

## ⚡ نحوه ایجاد فرم جدید (How to Add a New Form)

در Antigravity کافی است دستور زیر را به زبان فارسی یا انگلیسی بنویسید:
```text
/new-form فرم نظرسنجی ناهار کارکنان: نام، کد پرسنلی، انتخاب غذا (کباب، قورمه‌سبزی، سالاد)، و تاریخ تحویل
```
عامل هوشمند Antigravity مراحل زیر را به‌صورت کاملاً خودکار طی می‌کند:
1. ایجاد فایل `shared/forms/<formId>.json`.
2. بررسی صحت اسکیما با `npm run forms:validate`.
3. همگام‌سازی رجیستری و تولید روت `/f/<formId>` با `npm run forms:sync`.
4. به‌روزرسانی بک‌اند با `npm run gas:deploy`.
5. ارائه لینک مستقیم وب و دیپ‌لینک مینی‌اپ تلگرام.

---

## 📱 دستورات ربات تلگرام (Telegram Bot Commands)

| دستور | شرح |
| :--- | :--- |
| `/start [formId]` | پیام خوش‌آمدگویی یا باز کردن فرم مشخص در مینی‌اپ |
| `/forms` | نمایش کیبورد شیشه‌ای لیست فرم‌های فعال سازمانی |
| `/export <formId>` | دریافت مستقیم فایل اکسل (`.xlsx`) حاوی داده‌های ثبت‌شده |
| `/stats <formId>` | مشاهده آمار پاسخ‌های کل و ثبت‌های امروز |
| `/whoami` | مشاهده شناسه چت و وضعیت دسترسی مدیریت شما |
| `/help` | راهنمای دستورات ربات |

---

## 📄 مجوز و بهره‌برداری (License)
این پروژه تحت مجوز **MIT** توسعه یافته و برای استفاده در تمامی سازمان‌ها و شرکت‌ها کاملاً رایگان است.

