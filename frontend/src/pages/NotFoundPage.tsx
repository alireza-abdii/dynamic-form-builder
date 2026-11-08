import * as React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function NotFoundPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center p-4">
      <Card className="w-full max-w-md border-border/80 text-center p-6 sm:p-8 space-y-6">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <FileQuestion className="h-10 w-10" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">
            صفحه یا فرم یافت نشد
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            نشانی وارد شده اشتباه است یا فرم مورد نظر حذف شده است.
          </p>
        </div>

        <CardContent className="p-0 pt-4">
          <Link to="/">
            <Button variant="outline" size="lg" className="w-full gap-2 font-medium">
              <ArrowRight className="h-4 w-4" />
              <span>بازگشت به صفحه اصلی</span>
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

