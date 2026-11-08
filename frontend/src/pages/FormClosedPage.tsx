import * as React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTelegram } from '@/lib/telegram/useTelegram';

interface FormClosedPageProps {
  title?: string;
}

export function FormClosedPage({ title }: FormClosedPageProps) {
  const { isTma, tg } = useTelegram();

  return (
    <div className="flex min-h-[70vh] items-center justify-center p-4">
      <Card className="w-full max-w-md border-border/80 text-center p-6 sm:p-8 space-y-6">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <AlertCircle className="h-10 w-10" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">
            {title ? `فرم «${title}» بسته شده است` : 'فرم بسته شده است'}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            مهلت ثبت اطلاعات برای این فرم به پایان رسیده است یا دسترسی به آن توسط مدیر سامانه غیرفعال شده است.
          </p>
        </div>

        <CardContent className="p-0 pt-4">
          {isTma ? (
            <Button size="lg" className="w-full font-bold" onClick={() => tg?.close()}>
              بستن پنجره
            </Button>
          ) : (
            <Link to="/">
              <Button variant="outline" size="lg" className="w-full gap-2">
                <ArrowRight className="h-4 w-4" />
                <span>صفحه اصلی</span>
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

