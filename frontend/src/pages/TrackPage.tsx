import * as React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Copy,
  Check,
  AlertCircle,
  RotateCcw,
  ExternalLink
} from 'lucide-react';
import { toPersianDigits, normalizeTrackingCode, isValidTrackingCode, type TrackResponse } from '@fb/shared';
import { trackSubmission } from '@/lib/api/gas-client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export function TrackPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const codeParam = searchParams.get('code') || '';

  const [inputCode, setInputCode] = React.useState(codeParam);
  const [isLoading, setIsLoading] = React.useState(false);
  const [result, setResult] = React.useState<TrackResponse | null>(null);
  const [hasSearched, setHasSearched] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const performSearch = React.useCallback(async (codeToSearch: string) => {
    const clean = normalizeTrackingCode(codeToSearch);
    if (!clean) {
      setErrorMsg('لطفاً کد رهگیری را وارد فرمایید.');
      return;
    }

    if (!isValidTrackingCode(clean)) {
      setErrorMsg('فرمت کد رهگیری نامعتبر است (مثال معتبر: FB-7K3M9Q).');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setHasSearched(true);

    try {
      const res = await trackSubmission(clean);
      setResult(res);
      // Update URL query param quietly
      setSearchParams({ code: clean }, { replace: true });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'خطای ارتباط با سرور.');
    } finally {
      setIsLoading(false);
    }
  }, [setSearchParams]);

  // Auto-search if code query parameter exists on initial load
  React.useEffect(() => {
    if (codeParam) {
      performSearch(codeParam);
    }
  }, [codeParam, performSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(inputCode);
  };

  const handleCopy = () => {
    if (!result?.trackingCode) return;
    navigator.clipboard.writeText(result.trackingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isApproved = result?.status === 'تایید شد';
  const isRejected = result?.status === 'رد شد';
  const isPending = result?.status === 'در انتظار بررسی';
  const isSuccessArchived = result?.status === 'ثبت موفق' || (!isApproved && !isRejected && !isPending);

  return (
    <div className="w-full max-w-2xl mx-auto py-8 px-4 sm:py-12 space-y-6">
      {/* Top Header */}
      <div className="text-center space-y-2">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-3">
          <ShieldCheck className="h-7 w-7" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          پیگیری وضعیت درخواست
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
          با وارد کردن کد رهگیری اختصاصی، از آخرین وضعیت پردازش و تایید درخواست خود مطلع شوید.
        </p>
      </div>

      {/* Search Input Card */}
      <Card className="p-4 sm:p-6 border-border/80 shadow-sm rounded-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="tracking-code-input" className="text-xs font-semibold text-foreground">
              کد رهگیری اختصاصی:
            </label>
            <div className="relative">
              <Search className="w-4 h-4 absolute start-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                id="tracking-code-input"
                dir="ltr"
                value={inputCode}
                onChange={(e) => {
                  setInputCode(e.target.value.toUpperCase());
                  setErrorMsg(null);
                }}
                placeholder="FB-7K3M9Q"
                className="ps-10 text-center sm:text-start font-mono text-base tracking-widest h-12 uppercase rounded-xl"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl text-xs font-medium flex items-center gap-2 border bg-destructive/10 text-destructive border-destructive/20 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading || !inputCode.trim()}
            className="w-full h-11 text-xs sm:text-sm font-semibold gap-2"
          >
            {isLoading ? (
              <>
                <RotateCcw className="w-4 h-4 animate-spin" />
                <span>در حال استعلام از سرور...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>استعلام وضعیت درخواست</span>
              </>
            )}
          </Button>
        </form>
      </Card>

      {/* Result Card */}
      {hasSearched && !isLoading && result && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {!result.found ? (
            <Card className="p-8 text-center space-y-3 border-amber-500/30 bg-amber-500/5 rounded-2xl">
              <AlertCircle className="w-10 h-10 mx-auto text-amber-600 dark:text-amber-400" />
              <div className="space-y-1">
                <CardTitle className="text-base font-bold text-foreground">
                  درخواستی با این کد یافت نشد
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
                  کد رهگیری «{result.trackingCode}» در سامانه ثبت نشده است. لطفاً از درستی حروف و ارقام واردشده اطمینان حاصل فرمایید.
                </CardDescription>
              </div>
            </Card>
          ) : (
            <Card className="p-5 sm:p-7 border-border/80 shadow-md rounded-2xl space-y-6">
              {/* Form & Code Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    عنوان فرم سازمانی:
                  </span>
                  <h3 className="text-base sm:text-lg font-extrabold text-foreground">
                    {result.formTitle}
                  </h3>
                  {result.jalaliDate && (
                    <p className="text-xs text-muted-foreground">
                      تاریخ ثبت: {toPersianDigits(result.jalaliDate)}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center">
                  <div className="font-mono text-sm sm:text-base font-bold px-3 py-1 bg-muted/60 border rounded-xl flex items-center gap-2 select-all">
                    <span>{result.trackingCode}</span>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="text-muted-foreground hover:text-foreground p-1 transition-colors"
                      title="کپی کد رهگیری"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Status Badge Banner */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border bg-muted/30">
                <span className="text-xs font-semibold text-muted-foreground">وضعیت کنونی:</span>
                <Badge
                  variant="outline"
                  className={`text-xs font-bold px-3 py-1 ${
                    isApproved
                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                      : isRejected
                      ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30'
                      : isPending
                      ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30'
                      : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                  }`}
                >
                  {isApproved && '✅ '}
                  {isRejected && '❌ '}
                  {isPending && '⏳ '}
                  {isSuccessArchived && '🟢 '}
                  {result.status}
                </Badge>
              </div>

              {/* Visual 3-Stage Timeline */}
              <div className="space-y-4 pt-2">
                <span className="text-xs font-bold text-foreground block">
                  مراحل پیشرفت فرآیند:
                </span>

                <div className="relative space-y-6 ps-7 before:absolute before:start-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                  {/* Step 1: Submission */}
                  <div className="relative">
                    <div className="absolute -start-7 top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white shadow-xs">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-foreground">ثبت اولیه در سامانه</h4>
                      <p className="text-[11px] text-muted-foreground">
                        اطلاعات با موفقیت دریافت و کد رهگیری یکتا صادر گردید.
                      </p>
                    </div>
                  </div>

                  {/* Step 2: Under Review */}
                  <div className="relative">
                    <div
                      className={`absolute -start-7 top-0.5 flex h-6 w-6 items-center justify-center rounded-full shadow-xs ${
                        isApproved || isRejected || isSuccessArchived
                          ? 'bg-emerald-500 text-white'
                          : 'bg-amber-500 text-white animate-pulse'
                      }`}
                    >
                      {isApproved || isRejected || isSuccessArchived ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : (
                        <Clock className="h-3.5 w-3.5" />
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-foreground">بررسی و اعتبارسنجی</h4>
                      <p className="text-[11px] text-muted-foreground">
                        {isPending
                          ? 'درخواست شما در نوبت کارتابل بررسی مدیریت قرار دارد.'
                          : 'مرحله بررسی مدارک و اطلاعات به اتمام رسید.'}
                      </p>
                    </div>
                  </div>

                  {/* Step 3: Final Decision */}
                  <div className="relative">
                    <div
                      className={`absolute -start-7 top-0.5 flex h-6 w-6 items-center justify-center rounded-full shadow-xs ${
                        isApproved || isSuccessArchived
                          ? 'bg-emerald-500 text-white'
                          : isRejected
                          ? 'bg-rose-500 text-white'
                          : 'bg-muted text-muted-foreground border'
                      }`}
                    >
                      {isApproved || isSuccessArchived ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : isRejected ? (
                        <XCircle className="h-3.5 w-3.5" />
                      ) : (
                        <span className="text-[10px] font-bold">۳</span>
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-foreground">
                        {isApproved
                          ? 'تایید نهایی'
                          : isRejected
                          ? 'عدم تایید'
                          : 'نتیجه نهایی'}
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        {isApproved && 'درخواست شما مورد تایید قرار گرفت و اقدامات تکمیلی انجام خواهد شد.'}
                        {isRejected && 'درخواست شما پس از بررسی، مورد موافقت قرار نگرفت.'}
                        {isPending && 'پس از تصمیم‌گیری مدیریت، نتیجه در این بخش درج خواهد شد.'}
                        {isSuccessArchived && 'اطلاعات در پایگاه داده سازمانی بایگانی گردید.'}
                      </p>
                      {result.reviewedBy && (
                        <span className="text-[11px] font-medium text-muted-foreground block pt-1">
                          بررسی توسط: {result.reviewedBy}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Footer Navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <Link to="/" className="w-full sm:w-auto">
          <Button variant="ghost" size="sm" className="w-full gap-1.5 text-xs text-muted-foreground">
            <ArrowRight className="w-3.5 h-3.5" />
            <span>بازگشت به صفحه اصلی</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}
