import * as React from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTelegram } from '@/lib/telegram/useTelegram';
import { FORM_REGISTRY } from '@fb/shared';

export function SuccessPage() {
  const { formId } = useParams<{ formId: string }>();
  const { isTma, tg } = useTelegram();

  const definition = formId ? FORM_REGISTRY[formId] : undefined;
  const message = definition?.successMessage || 'اطلاعات شما با موفقیت در سامانه ثبت شد.';

  const handleClose = () => {
    if (isTma && tg) {
      tg.close();
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center p-4">
      <Card className="w-full max-w-md border-border/80 text-center p-6 sm:p-8 space-y-6">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary animate-in zoom-in-50 duration-300">
          <CheckCircle2 className="h-10 w-10" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">
            ثبت موفقیت‌آمیز!
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            {message}
          </p>
        </div>

        <CardContent className="p-0 pt-4 flex flex-col gap-3">
          {isTma ? (
            <Button size="lg" className="w-full font-bold" onClick={handleClose}>
              بستن پنجره
            </Button>
          ) : (
            <Link to="/">
              <Button variant="outline" size="lg" className="w-full gap-2 font-medium">
                <ArrowRight className="h-4 w-4" />
                <span>بازگشت به صفحه اصلی</span>
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

