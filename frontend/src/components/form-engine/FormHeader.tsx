import * as React from 'react';
import type { FormDefinition } from '@fb/shared';
import { toPersianDigits } from '@fb/shared';
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Share2 } from 'lucide-react';
import { ShareFormDialog } from '@/components/forms/ShareFormDialog';

interface FormHeaderProps {
  definition: FormDefinition;
}

export function FormHeader({ definition }: FormHeaderProps) {
  const [shareOpen, setShareOpen] = React.useState(false);

  return (
    <CardHeader className="text-start pb-4 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Badge variant={definition.status === 'open' ? 'default' : 'secondary'}>
            {definition.status === 'open' ? 'در حال پذیرش پاسخ' : 'بسته شده'}
          </Badge>

          {definition.closesAt && (
            <div className="flex items-center text-xs text-muted-foreground gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>مهلت ثبت: {toPersianDigits(definition.closesAt)}</span>
            </div>
          )}
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShareOpen(true)}
          className="h-7 px-2.5 text-xs gap-1.5 text-muted-foreground hover:text-primary transition-colors"
          title="اشتراک‌گذاری فرم و دریافت کد QR"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">اشتراک و QR</span>
        </Button>
      </div>

      <CardTitle className="text-xl sm:text-2xl font-bold leading-tight">
        {definition.title}
      </CardTitle>

      {definition.description && (
        <CardDescription className="text-sm sm:text-base leading-relaxed">
          {definition.description}
        </CardDescription>
      )}

      <ShareFormDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        formId={definition.id}
        formTitle={definition.title}
      />
    </CardHeader>
  );
}
