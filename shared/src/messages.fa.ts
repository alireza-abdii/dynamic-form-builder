export const fa = {
  required: (label: string) => `تکمیل «${label}» الزامی است.`,
  minLength: (label: string, min: number) => `«${label}» باید حداقل ${min} کاراکتر باشد.`,
  maxLength: (label: string, max: number) => `«${label}» نباید بیشتر از ${max} کاراکتر باشد.`,
  minNumber: (label: string, min: number) => `«${label}» باید حداقل ${min} باشد.`,
  maxNumber: (label: string, max: number) => `«${label}» نباید بیشتر از ${max} باشد.`,
  integer: (label: string) => `«${label}» باید یک عدد صحیح باشد.`,
  mobile: (label: string) => `«${label}» باید یک شماره همراه معتبر ۱۱ رقمی (مانند ۰۹۱۲۳۴۵۶۷۸۹) باشد.`,
  nationalId: (label: string) => `«${label}» (کد ملی) وارد شده معتبر نیست.`,
  postalCode: (label: string) => `«${label}» باید یک کد پستی معتبر ۱۰ رقمی باشد.`,
  email: (label: string) => `«${label}» باید یک نشانی ایمیل معتبر باشد.`,
  digitsOnly: (label: string) => `«${label}» فقط باید شامل ارقام باشد.`,
  sheba: (label: string) => `«${label}» (شماره شبا) وارد شده معتبر نیست؛ لطفاً ۲۴ رقم پس از IR را بررسی کنید.`,
  bankCard: (label: string) => `«${label}» (شماره کارت بانکی ۱۶ رقمی) معتبر نیست.`,
  minItems: (label: string, min: number) => `حداقل ${min} مورد در «${label}» باید انتخاب شود.`,
  maxItems: (label: string, max: number) => `حداکثر ${max} مورد در «${label}» مجاز به انتخاب است.`,
  invalidOption: (label: string) => `گزینه انتخاب‌شده در «${label}» نامعتبر است.`,
  invalidDate: (label: string) => `«${label}» باید یک تاریخ معتبر شمسی باشد.`,
  minDate: (label: string, bound: string) => `«${label}» نباید قبل از تاریخ ${bound} باشد.`,
  maxDate: (label: string, bound: string) => `«${label}» نباید بعد از تاریخ ${bound} باشد.`,
  invalidPattern: (label: string) => `الگوی ورودی در «${label}» نامعتبر است.`,
  referenceNotFound: (label: string) => `مقدار انتخاب‌شده برای «${label}» در سامانه مرجع یافت نشد.`,
  serverError: 'خطایی در ثبت اطلاعات در سرور رخ داده است. لطفاً لحظاتی بعد دوباره تلاش کنید.',
  formClosed: 'این فرم در حال حاضر بسته است و امکان ثبت اطلاعات جدید وجود ندارد.',
  unknownForm: 'فرم درخواستی یافت نشد یا غیرفعال شده است.',
  duplicateSubmission: 'این اطلاعات قبلاً با موفقیت ثبت شده است.',
  duplicateField: (label: string, value?: string) =>
    value
      ? `اطلاعات وارد شده برای «${label}» (${value}) قبلاً در سیستم ثبت شده است و امکان ثبت مجدد وجود ندارد.`
      : `این مقدار برای «${label}» قبلاً در سیستم ثبت شده است و تکراری می‌باشد.`,
  unauthorized: 'دسترسی غیرمجاز. لطفاً ابتدا وارد حساب کاربری مدیر شوید.',
  invalidCredentials: 'نام کاربری یا رمز عبور اشتباه است.',
  formSavedSuccess: 'فرم با موفقیت ذخیره شد.',
  formDeletedSuccess: 'فرم با موفقیت حذف شد.'
};

