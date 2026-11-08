import * as React from 'react';
import { useForm, type FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import type { FormDefinition, SubmitRequest } from '@fb/shared';
import { buildZodSchema, fa } from '@fb/shared';
import { Form } from '@/components/ui/form';
import { Card, CardContent } from '@/components/ui/card';
import { FormHeader } from './FormHeader';
import { FieldRenderer } from './FieldRenderer';
import { SubmitBar } from './SubmitBar';
import { submitForm } from '@/lib/api/gas-client';
import { useTelegram } from '@/lib/telegram/useTelegram';

interface DynamicFormProps {
  definition: FormDefinition;
  onSuccess?: () => void;
}

export function DynamicForm({ definition, onSuccess }: DynamicFormProps) {
  const navigate = useNavigate();
  const { isTma, initData, haptics, tg } = useTelegram();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const startedAtRef = React.useRef(Date.now());
  const draftKey = `form_draft_${definition.id}_v${definition.version}`;

  // 1. Build dynamic Zod schema from definition
  const schema = React.useMemo(() => buildZodSchema(definition), [definition]);

  // 2. Setup React Hook Form
  const form = useForm<FieldValues>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: {}
  });

  // 3. Draft restoration & autosave
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          toast('پیش‌نویس ذخیره‌شده یافت شد', {
            description: 'آیا مایلید پاسخ‌های قبلی بازیابی شوند؟',
            action: {
              label: 'بازیابی',
              onClick: () => {
                form.reset(parsed);
                toast.success('اطلاعات قبلی بازیابی شد.');
              }
            }
          });
        }
      }
    } catch {
      // ignore
    }
  }, [draftKey, form]);

  // Autosave to draft
  React.useEffect(() => {
    const subscription = form.watch((values) => {
      try {
        localStorage.setItem(draftKey, JSON.stringify(values));
      } catch {
        // ignore storage quota errors
      }
    });
    return () => subscription.unsubscribe();
  }, [form, draftKey]);

  // 4. Telegram Closing Confirmation while form is dirty
  React.useEffect(() => {
    if (isTma && tg) {
      if (form.formState.isDirty) {
        tg.enableClosingConfirmation();
      } else {
        tg.disableClosingConfirmation();
      }
    }
  }, [isTma, tg, form.formState.isDirty]);

  // 5. Scroll to first error on submit failure
  const onError = (errors: Record<string, unknown>) => {
    haptics.notification('error');
    const firstErrorKey = Object.keys(errors)[0];
    if (firstErrorKey) {
      const el = document.getElementById(`${firstErrorKey}-form-item`) || document.querySelector(`[name="${firstErrorKey}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      toast.error('لطفاً خطاهای مشخص‌شده در فرم را اصلاح کنید.');
    }
  };

  // 6. Submit handler
  const onSubmit = async (values: FieldValues) => {
    setIsSubmitting(true);
    haptics.impact('medium');

    const honeypotInput = (document.getElementById('hp_company_field') as HTMLInputElement)?.value;

    const request: SubmitRequest = {
      action: 'submit',
      formId: definition.id,
      formVersion: definition.version,
      submissionId: crypto.randomUUID(),
      values,
      meta: {
        source: isTma ? 'telegram' : 'web',
        initData: initData || undefined,
        startedAt: startedAtRef.current,
        hp: honeypotInput || undefined
      }
    };

    try {
      const result = await submitForm(request);

      if (result.ok) {
        haptics.notification('success');
        localStorage.removeItem(draftKey);
        toast.success(definition.successMessage || 'اطلاعات با موفقیت ثبت شد.');

        if (isTma && tg) {
          tg.disableClosingConfirmation();
        }

        if (onSuccess) {
          onSuccess();
        } else {
          navigate(`/f/${definition.id}/done`);
        }
      } else {
        haptics.notification('error');
        if (result.fieldErrors) {
          for (const [key, msg] of Object.entries(result.fieldErrors)) {
            form.setError(key, { message: msg });
          }
        }
        toast.error(result.message || fa.serverError);
      }
    } catch (err: unknown) {
      haptics.notification('error');
      console.error('[DynamicForm] Submit error:', err);
      toast.error(fa.serverError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-xl mx-auto border-border/80 shadow-sm bg-card">
      <FormHeader definition={definition} />

      <CardContent className="pt-2">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit, onError)}
            className="space-y-6"
            noValidate
          >
            {/* Honeypot field (hidden from genuine users and accessibility tree) */}
            <div className="hidden" aria-hidden="true" tabIndex={-1}>
              <input
                type="text"
                id="hp_company_field"
                name="hp_company_field"
                autoComplete="off"
                tabIndex={-1}
              />
            </div>

            {/* Field renderers */}
            <div className="space-y-5">
              {definition.fields.map((field) => (
                <FieldRenderer key={field.key} field={field} />
              ))}
            </div>

            {/* Submit Bar */}
            <SubmitBar
              label={definition.submitLabel || 'ثبت اطلاعات'}
              isSubmitting={isSubmitting}
              onSubmit={form.handleSubmit(onSubmit, onError)}
            />
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

