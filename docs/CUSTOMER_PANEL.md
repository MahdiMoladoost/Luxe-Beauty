# پنل عملیاتی مشتری

## وضعیت

این سند برش عملیاتی پنل مشتری در شاخه `rebuild/full-platform` را شرح می‌دهد. صفحه قدیمی مبتنی بر آرایه‌های ثابت، نام و موبایل ساختگی، تراکنش‌های فرضی، اعلان‌های نمونه و علاقه‌مندی‌های نمایشی کنار گذاشته شده است.

این برش تا اجرای CI تازه و Browser E2E در وضعیت `partial / pending fresh CI` باقی می‌ماند.

## مسیرها

- `/dashboard` — نمای کلی و آمار واقعی
- `/dashboard/bookings` — نوبت‌های مشتری
- `/dashboard/recipients` — دریافت‌کنندگان خدمت
- `/dashboard/account` — اطلاعات حساب
- `/dashboard/security` — نشست‌ها و دستگاه‌های فعال

مسیرهای تراکنش، علاقه‌مندی، اعلان و نظر تا زمان وجود مدل، API و گردش واقعی در منو نمایش داده نمی‌شوند.

## Shell مشترک

- احراز هویت سمت سرور؛
- هدایت کاربر مهمان به Login؛
- Sidebar دسکتاپ و Sheet موبایل؛
- نمایش نام، موبایل و وضعیت احراز هویت واقعی؛
- ناوبری فقط به صفحات عملیاتی؛
- خروج امن؛
- Loading Skeleton و Error Boundary سطح Route.

## داشبورد

Dashboard فقط داده‌های PostgreSQL را نمایش می‌دهد:

- تعداد کل نوبت‌ها؛
- نوبت‌های آینده؛
- نوبت‌های منتظر تأیید سالن؛
- نوبت‌های نهایی‌شده؛
- تعداد دریافت‌کنندگان فعال؛
- آخرین نوبت‌های حساب.

هیچ سطح عضویت طلایی، تخفیف، امتیاز، اعلان، درآمد یا تراکنش نمونه نمایش داده نمی‌شود.

## مدیریت نوبت‌ها

قابلیت‌ها:

- فیلتر همه، آینده و گذشته؛
- فیلتر وضعیت؛
- جست‌وجوی سالن، شعبه، خدمت، متخصص یا دریافت‌کننده؛
- Pagination؛
- Loading، Empty و Error مستقل؛
- لینک مستقیم با `bookingId`؛
- Dialog جزئیات نوبت؛
- نمایش Provider، شعبه، دریافت‌کننده، خدمات، زمان، متخصص و مبلغ؛
- نمایش Paymentهای واقعی مرتبط در صورت وجود؛
- نمایش تاریخچه وضعیت و دلیل ثبت‌شده.

لغو، تغییر زمان، پرداخت، Dispute و ثبت نظر در این برش دکمه نمایشی ندارند؛ این کنترل‌ها تنها پس از تکمیل State Machine، Allocation Swap، Payment/Refund و Audit مناسب اضافه می‌شوند.

## دریافت‌کنندگان خدمت

- فهرست مالک‌محور؛
- Dialog ایجاد؛
- Dialog ویرایش؛
- Dialog حذف نرم؛
- نام، نام خانوادگی، تاریخ تولد، جنسیت، نسبت، موبایل اختیاری و نیازهای دسترس‌پذیری؛
- Validation تاریخ و موبایل؛
- `expectedUpdatedAt` برای جلوگیری از Lost Update؛
- Audit برای Create/Update/Delete؛
- حذف نرم بدون از بین بردن سوابق Booking قبلی.

Cross-user recipient ID با Not Found پاسخ می‌گیرد.

## اطلاعات حساب

- نام و نام خانوادگی؛
- تاریخ تولد؛
- موبایل Read-only؛
- وضعیت حساب؛
- وضعیت احراز هویت؛
- ذخیره نسخه‌دار با `expectedUpdatedAt`؛
- Audit تغییر پروفایل.

تغییر موبایل نیازمند گردش OTP اختصاصی است و در فرم عمومی پروفایل انجام نمی‌شود. داده حساس هویت نیز در این صفحه نمایش داده نمی‌شود.

## امنیت و دستگاه‌ها

- فهرست نشست‌های فعال؛
- تشخیص تقریبی مرورگر و نوع دستگاه از User-Agent؛
- نمایش دستگاه فعلی؛
- زمان ایجاد، آخرین فعالیت و انقضا؛
- Dialog بستن یک نشست؛
- Dialog خروج از همه دستگاه‌ها؛
- انتقال به Login پس از ابطال نشست فعلی؛
- مالکیت و Audit سمت سرور.

IP خام، Token، Hash نشست و شناسه‌های حساس نمایش داده نمی‌شوند.

## APIهای Read Model

- `GET /api/v1/customer-panel/bootstrap`
- `GET /api/v1/customer-panel/dashboard`
- `GET /api/v1/customer-panel/bookings`
- `GET /api/v1/customer-panel/bookings/{bookingId}`
- `GET /api/v1/customer-panel/account`
- `PATCH /api/v1/customer-panel/account`

API دریافت‌کنندگان:

- `GET /api/v1/booking-recipients`
- `POST /api/v1/booking-recipients`
- `GET /api/v1/booking-recipients/{recipientId}`
- `PATCH /api/v1/booking-recipients/{recipientId}`
- `DELETE /api/v1/booking-recipients/{recipientId}?expectedUpdatedAt={ISO}`

API امنیت:

- `GET /api/auth/sessions`
- `DELETE /api/auth/sessions/{sessionId}`
- `POST /api/auth/logout-all`

## تست‌ها

`tests/integration/customer-panel.test.ts` موارد زیر را پوشش می‌دهد:

- Bootstrap حساب؛
- شمارش واقعی داشبورد؛
- DTO پول به‌صورت رشته تومان؛
- فیلتر نوبت آینده و وضعیت؛
- جست‌وجوی Provider؛
- جزئیات مالک‌محور Booking؛
- جلوگیری از دسترسی مشتری دیگر؛
- به‌روزرسانی پروفایل با Version Conflict؛
- Create/Update/Soft Delete دریافت‌کننده.

## محدودیت‌های باز

- پرداخت و Refund عملیاتی؛
- لغو و تغییر زمان تراکنشی؛
- Check-in، Completion، No-show و Dispute؛
- علاقه‌مندی‌ها؛
- اعلان‌ها و Push؛
- نظر تأییدشده؛
- پیام و تیکت؛
- حذف حساب و تغییر موبایل؛
- Browser E2E، Accessibility، Runtime Smoke و CI تازه.
