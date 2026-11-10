import * as React from 'react';
import { Link } from 'react-router-dom';
import { FileText, ArrowLeft, CheckCircle2, ShieldCheck, Settings, PlusCircle } from 'lucide-react';
import { FORM_REGISTRY, AVAILABLE_FORM_IDS, toPersianDigits, type FormSummary } from '@fb/shared';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { listForms } from '@/lib/api/gas-client';

export function HomePage() {
  const staticList: FormSummary[] = AVAILABLE_FORM_IDS
    .map((id) => FORM_REGISTRY[id])
    .filter((form): form is typeof FORM_REGISTRY[string] => form !== undefined)
    .map((form) => ({
      id: form.id,
      version: form.version,
      title: form.title,
      description: form.description,
      status: form.status,
      closesAt: form.closesAt ?? null,
      access: form.access,
      fieldCount: form.fields.length,
      isDynamic: false
    }));

  const [allForms, setAllForms] = React.useState<FormSummary[]>(staticList);

  React.useEffect(() => {
    listForms().then((dynamicForms) => {
      if (dynamicForms.length > 0) {
        // Merge without duplicating static IDs
        const existingIds = new Set(staticList.map((f) => f.id));
        const extra = dynamicForms.filter((f) => !existingIds.has(f.id));
        setAllForms([...staticList, ...extra]);
      }
    });
  }, []);

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
        <div className="pt-2">
          <Link to="/admin/forms">
            <Button variant="outline" size="sm" className="gap-2 text-xs">
              <Settings className="h-3.5 w-3.5" />
              <span>ورود به پنل مدیریت فرم‌ها</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Forms Grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {allForms.map((form) => (
          <Card
            key={form.id}
            className="hover:border-primary/50 transition-all hover:shadow-md flex flex-col justify-between"
          >
            <CardHeader className="p-5 pb-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Badge variant={form.status === 'open' ? 'default' : 'secondary'} className="text-xs">
                    {form.status === 'open' ? 'فعال' : 'بسته'}
                  </Badge>
                  {form.isDynamic && (
                    <Badge variant="outline" className="text-[10px] text-primary border-primary/30">
                      فرم پویا
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {toPersianDigits(form.fieldCount)} فیلد اطلاعاتی
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

      {allForms.length === 0 && (
        <Card className="text-center p-8">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground text-sm">هیچ فرم فعالی در سامانه ثبت نشده است.</p>
        </Card>
      )}
    </div>
  );
}
