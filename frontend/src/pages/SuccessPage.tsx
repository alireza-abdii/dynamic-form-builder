import * as React from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { CheckCircle2, ArrowRight, Copy, Check, RotateCcw, ShieldCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTelegram } from '@/lib/telegram/useTelegram';
import { FORM_REGISTRY, type FormDefinition } from '@fb/shared';
import { getForm } from '@/lib/api/gas-client';

interface SuccessLocationState {
  trackingCode?: string;
  submissionId?: string;
  successMessage?: string;
  formTitle?: string;
}

export function SuccessPage() {
  const { formId } = useParams<{ formId: string }>();
  const location = useLocation();
  const state = (location.state as SuccessLocationState) || {};
  const { isTma, tg } = useTelegram();

  const [copied, setCopied] = React.useState(false);
  const [dynamicForm, setDynamicForm] = React.useState<FormDefinition | null>(null);

  // If state was lost (e.g. reload), attempt resolving from static registry or dynamic fetch
  React.useEffect(() => {
    if (!formId) return;

    if (!state.successMessage && !FORM_REGISTRY[formId]) {
      getForm(formId).then((res) => {
        if (res?.form) {
          setDynamicForm(res.form);
        }
      });
    }
  }, [formId, state.successMessage]);

  const staticDef = formId ? FORM_REGISTRY[formId] : undefined;
  const currentTitle = state.formTitle || dynamicForm?.title || staticDef?.title;
  const message =
    state.successMessage ||
    dynamicForm?.successMessage ||
    staticDef?.successMessage ||
    'اطلاعات شما با موفقیت در سامانه ثبت گردید.';

  const trackingCode = state.trackingCode;

  const handleCopyCode = async () => {
    if (!trackingCode) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(trackingCode);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = trackingCode;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy tracking code:', err);
    }
  };

  const handleClose = () => {
    if (isTma && tg) {
      tg.close();
    }
  };

  return (
    <div className="flex min-h-[75vh] items-center justify-center p-4">
      <Card className="w-full max-w-md border-border/80 text-center p-6 sm:p-8 space-y-6 shadow-md rounded-2xl">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 animate-in zoom-in-50 duration-300">
          <CheckCircle2 className="h-10 w-10" />
        </div>

        <div className="space-y-2">
          {currentTitle && (
            <span className="text-xs font-semibold text-muted-foreground block">
              فرم «{currentTitle}»
            </span>
          )}
          <h2 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
            ثبت موفقیت‌آمیز!
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            {message}
          </p>
        </div>

        {/* Tracking Code Box */}
        {trackingCode && (
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-2.5 animate-in fade-in duration-300">
            <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-primary">
              <ShieldCheck className="w-4 h-4" />
              <span>کد رهگیری اختصاصی شما</span>
            </div>

            <div className="flex items-center justify-center gap-2">
              <span
                dir="ltr"
                className="font-mono text-xl sm:text-2xl font-bold tracking-widest text-foreground select-all bg-background/80 px-3.5 py-1 rounded-lg border border-border/60"
              >
                {trackingCode}
              </span>

              <Button
                type="button"
                variant={copied ? 'default' : 'secondary'}
                size="sm"
                onClick={handleCopyCode}
                className="h-9 px-3 gap-1 text-xs shrink-0 transition-all"
                title="کپی کد رهگیری"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-primary-foreground" />
                    <span>کپی شد!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>کپی</span>
                  </>
                )}
              </Button>
            </div>

            <p className="text-[11px] text-muted-foreground">
              لطفاً این کد را جهت پیگیری‌های بعدی یادداشت یا کپی فرمایید.
            </p>
          </div>
        )}

        <CardContent className="p-0 pt-2 flex flex-col gap-2.5">
          {isTma ? (
            <Button size="lg" className="w-full font-bold" onClick={handleClose}>
              بستن پنجره
            </Button>
          ) : (
            <>
              {formId && (
                <Link to={`/f/${formId}`} className="w-full">
                  <Button variant="secondary" size="default" className="w-full gap-2 text-xs font-semibold">
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>ثبت پاسخ جدید</span>
                  </Button>
                </Link>
              )}

              <Link to="/" className="w-full">
                <Button variant="outline" size="default" className="w-full gap-2 text-xs font-medium">
                  <ArrowRight className="h-3.5 w-3.5" />
                  <span>بازگشت به صفحه اصلی</span>
                </Button>
              </Link>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
