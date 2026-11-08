import * as React from 'react';
import type { FormDefinition } from '@fb/shared';
import { toPersianDigits } from '@fb/shared';
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';

interface FormHeaderProps {
  definition: FormDefinition;
}

export function FormHeader({ definition }: FormHeaderProps) {
  return (
    <CardHeader className="text-start pb-4 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
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

      <CardTitle className="text-xl sm:text-2xl font-bold leading-tight">
        {definition.title}
      </CardTitle>

      {definition.description && (
        <CardDescription className="text-sm sm:text-base leading-relaxed">
          {definition.description}
        </CardDescription>
      )}
    </CardHeader>
  );
}

