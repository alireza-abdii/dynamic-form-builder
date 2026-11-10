import * as React from 'react';
import { useParams } from 'react-router-dom';
import type { FormDefinition } from '@fb/shared';
import { LAZY_FORM_LOADERS, FORM_REGISTRY, getTodayJalali, formatJalaliString } from '@fb/shared';
import { getForm } from '@/lib/api/gas-client';
import { DynamicForm } from '@/components/form-engine/DynamicForm';
import { FormClosedPage } from './FormClosedPage';
import { NotFoundPage } from './NotFoundPage';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

export function FormPage() {
  const { formId } = useParams<{ formId: string }>();
  const [definition, setDefinition] = React.useState<FormDefinition | null | undefined>(
    formId && FORM_REGISTRY[formId] ? FORM_REGISTRY[formId] : undefined
  );
  const [isLoading, setIsLoading] = React.useState(!definition);

  React.useEffect(() => {
    if (!formId) {
      setDefinition(null);
      setIsLoading(false);
      return;
    }

    const loader = LAZY_FORM_LOADERS[formId];
    if (loader) {
      setIsLoading(true);
      loader()
        .then((def) => {
          setDefinition(def);
        })
        .catch((err) => {
          console.error('[FormPage] Failed to load form definition:', err);
          setDefinition(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
      return;
    }

    // Try dynamic form fetch from backend
    setIsLoading(true);
    getForm(formId)
      .then((res) => {
        if (res?.form) {
          setDefinition(res.form);
        } else {
          setDefinition(null);
        }
      })
      .catch((err) => {
        console.error('[FormPage] Failed to fetch dynamic form:', err);
        setDefinition(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [formId]);

  if (isLoading) {
    return (
      <div className="w-full max-w-xl mx-auto p-4 space-y-4">
        <Card className="p-6 space-y-6">
          <CardHeader className="p-0 space-y-3">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent className="p-0 pt-4 space-y-5">
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-11 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-11 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-11 w-full" />
            </div>
            <Skeleton className="h-12 w-full mt-8" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (definition === null || !definition) {
    return <NotFoundPage />;
  }

  // Check if form is closed by status
  if (definition.status === 'closed') {
    return <FormClosedPage title={definition.title} />;
  }

  // Check if form is closed by date
  if (definition.closesAt) {
    const today = getTodayJalali();
    const todayStr = formatJalaliString(today.jy, today.jm, today.jd);
    if (todayStr > definition.closesAt) {
      return <FormClosedPage title={definition.title} />;
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto py-4 px-3 sm:py-8 sm:px-4">
      <DynamicForm definition={definition} />
    </div>
  );
}

