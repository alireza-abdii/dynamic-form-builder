import * as React from 'react';
import { Link } from 'react-router-dom';
import { FileText, ArrowLeft, CheckCircle2, ShieldCheck } from 'lucide-react';
import { FORM_REGISTRY, AVAILABLE_FORM_IDS, toPersianDigits } from '@fb/shared';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function HomePage() {
  const formList = AVAILABLE_FORM_IDS
    .map((id) => FORM_REGISTRY[id])
    .filter((form): form is typeof FORM_REGISTRY[string] => form !== undefined);

  return (
    <div className="w-full max-w-3xl mx-auto py-8 px-4 sm:py-12 space-y-8">
      {/* Brand Hero */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>سامانه فرم‌ساز سازمانی ۱۰۰٪ رایگان و امن</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          سامانه فرم‌های تعاملی سازمان
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto leading-relaxed">
          برای تکمیل هر یک از فرم‌های فعال، روی عنوان آن کلیک کنید. پاسخ‌ها به‌صورت خودکار در پایگاه داده سازمانی ثبت می‌گردند.
        </p>
      </div>

      {/* Forms Grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {formList.map((form) => (
          <Card
            key={form.id}
            className="hover:border-primary/50 transition-all hover:shadow-md flex flex-col justify-between"
          >
            <CardHeader className="p-5 pb-3 space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant={form.status === 'open' ? 'default' : 'secondary'} className="text-xs">
                  {form.status === 'open' ? 'فعال' : 'بسته'}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {toPersianDigits(form.fields.length)} فیلد اطلاعاتی
                </span>
              </div>
              <CardTitle className="text-base sm:text-lg font-bold leading-snug">
                {form.title}
              </CardTitle>
              {form.description && (
                <CardDescription className="text-xs line-clamp-2">
                  {form.description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <Link to={`/f/${form.id}`}>
                <Button className="w-full justify-between gap-2 h-10 text-sm font-semibold">
                  <span>تکمیل و ثبت فرم</span>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {formList.length === 0 && (
        <Card className="text-center p-8">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground text-sm">هیچ فرم فعالی در سامانه ثبت نشده است.</p>
        </Card>
      )}
    </div>
  );
}
