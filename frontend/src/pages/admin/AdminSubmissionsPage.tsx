import * as React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  RefreshCw,
  Download,
  Search,
  X,
  Copy,
  Check,
  ExternalLink,
  Share2,
  Table as TableIcon,
  Inbox,
  AlertCircle,
  Database
} from 'lucide-react';
import { toPersianDigits, normalizeDigits, type FormDefinition } from '@fb/shared';
import { getSubmissions, getForm } from '@/lib/api/gas-client';
import { getAdminToken } from '@/lib/auth/admin-auth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ShareFormDialog } from '@/components/forms/ShareFormDialog';

export function AdminSubmissionsPage() {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();

  const [form, setForm] = React.useState<FormDefinition | null>(null);
  const [headers, setHeaders] = React.useState<string[]>([]);
  const [submissions, setSubmissions] = React.useState<Record<string, string | number>[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [copiedCode, setCopiedCode] = React.useState<string | null>(null);
  const [isShareOpen, setIsShareOpen] = React.useState(false);

  const fetchData = React.useCallback(async (showRefreshing = false) => {
    if (!formId) return;

    const token = getAdminToken();
    if (!token) {
      navigate('/admin/login');
      return;
    }

    if (showRefreshing) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setErrorMsg(null);

    try {
      // Parallel fetch: form definition and submissions
      const [formData, submissionsData] = await Promise.all([
        getForm(formId),
        getSubmissions(formId, token)
      ]);

      if (formData?.form) {
        setForm(formData.form);
      }

      if (submissionsData.ok) {
        setHeaders(submissionsData.headers);
        setSubmissions(submissionsData.submissions);
      } else {
        setErrorMsg(submissionsData.message || 'خطا در دریافت پاسخ‌های ثبت‌شده.');
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'خطای ارتباط با سرور.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [formId, navigate]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => {
      setCopiedCode(null);
    }, 2000);
  };

  const filteredSubmissions = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return submissions;
    }
    const cleanQuery = normalizeDigits(searchQuery.trim().toLowerCase());

    return submissions.filter((row) => {
      return Object.values(row).some((cell) => {
        if (cell === undefined || cell === null) return false;
        const cleanCell = normalizeDigits(String(cell).toLowerCase());
        return cleanCell.includes(cleanQuery);
      });
    });
  }, [submissions, searchQuery]);

  const handleExportCsv = () => {
    if (submissions.length === 0 || headers.length === 0) return;

    const escapeCell = (val: string | number | null | undefined): string => {
      if (val === null || val === undefined) return '""';
      const str = String(val);
      if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return `"${str}"`;
    };

    const headerLine = headers.map(escapeCell).join(',');
    const rowsToExport = filteredSubmissions.length > 0 ? filteredSubmissions : submissions;

    const dataLines = rowsToExport.map((row) => {
      return headers.map((h) => escapeCell(row[h])).join(',');
    });

    const csvContent = [headerLine, ...dataLines].join('\r\n');
    // Prepend UTF-8 BOM so Excel opens Persian characters properly
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `submissions-${formId}-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formTitle = form?.title || formId || '';

  return (
    <div className="w-full max-w-7xl mx-auto py-6 px-3 sm:px-6 space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Link to="/admin/forms">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
              <ArrowRight className="w-4 h-4" />
              <span>بازگشت به فرم‌ها</span>
            </Button>
          </Link>
          <div className="h-4 w-px bg-border hidden sm:block" />
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-primary shrink-0" />
            <h1 className="text-lg sm:text-xl font-extrabold tracking-tight">
              پاسخ‌های ثبت‌شده: {formTitle}
            </h1>
          </div>
          <Badge variant="outline" className="font-mono text-[11px] text-muted-foreground">
            #{formId}
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {formId && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsShareOpen(true)}
                className="gap-1.5 text-xs text-primary border-primary/20 hover:border-primary/40 hover:text-primary"
                title="اشتراک‌گذاری و دریافت بارکد QR"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">اشتراک‌گذاری</span>
              </Button>

              <Link to={`/f/${formId}`} target="_blank" rel="noreferrer">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">مشاهده فرم</span>
                </Button>
              </Link>
            </>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchData(true)}
            disabled={isLoading || isRefreshing}
            className="gap-1.5 text-xs"
            title="بروزرسانی داده‌ها از شیت"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>بروزرسانی</span>
          </Button>

          <Button
            size="sm"
            onClick={handleExportCsv}
            disabled={submissions.length === 0}
            className="gap-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
            title="دانلود فایل اکسل سازگار با زبان فارسی"
          >
            <Download className="w-3.5 h-3.5" />
            <span>خروجی اکسل (CSV)</span>
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="p-3.5 rounded-xl text-xs font-medium flex items-center justify-between gap-2 border bg-destructive/10 text-destructive border-destructive/20">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => fetchData()} className="text-xs h-7 px-2">
            تلاش مجدد
          </Button>
        </div>
      )}

      {/* Search and Stats Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/40 p-3 sm:p-4 rounded-2xl border border-border/70">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو در تمام ستون‌ها (کد رهگیری، نام، کدملی، شماره...)"
            className="ps-9 pe-9 h-10 text-xs sm:text-sm bg-background"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-full"
            >
              <X className="w-3.5 h-3.5" />
              <span className="sr-only">پاک کردن جستجو</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
          <Badge variant="secondary" className="gap-1.5 font-normal py-1 px-2.5">
            <TableIcon className="w-3.5 h-3.5 text-primary" />
            <span>
              کل پاسخ‌ها:{' '}
              <strong className="text-foreground font-semibold">
                {toPersianDigits(submissions.length)}
              </strong>
            </span>
          </Badge>

          {searchQuery.trim() && (
            <Badge variant="outline" className="gap-1.5 font-normal py-1 px-2.5">
              <span>
                یافت‌شده:{' '}
                <strong className="text-foreground font-semibold">
                  {toPersianDigits(filteredSubmissions.length)}
                </strong>
              </span>
            </Badge>
          )}
        </div>
      </div>

      {/* Main Submissions Content */}
      {isLoading ? (
        <Card className="p-16 text-center text-sm text-muted-foreground space-y-3">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-primary" />
          <p>در حال فراخوانی پاسخ‌ها از جدول گوگل شیت...</p>
        </Card>
      ) : submissions.length === 0 ? (
        <Card className="p-12 text-center space-y-4">
          <Inbox className="w-12 h-12 mx-auto text-muted-foreground/50" />
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-base font-bold">هنوز پاسخی ثبت نشده است</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              تاکنون هیچ پاسخی برای این فرم ارسال نشده است. می‌توانید با اشتراک‌گذاری لینک فرم، جمع‌آوری اطلاعات را آغاز نمایید.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsShareOpen(true)}
              className="gap-1.5 text-xs text-primary border-primary/20"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>اشتراک‌گذاری فرم</span>
            </Button>
            <Link to={`/f/${formId}`} target="_blank" rel="noreferrer">
              <Button size="sm" className="gap-1.5 text-xs">
                <ExternalLink className="w-3.5 h-3.5" />
                <span>مشاهده فرم عمومی</span>
              </Button>
            </Link>
          </div>
        </Card>
      ) : filteredSubmissions.length === 0 ? (
        <Card className="p-12 text-center space-y-3">
          <Search className="w-8 h-8 mx-auto text-muted-foreground/50" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold">هیچ رکوردی یافت نشد</h3>
            <p className="text-xs text-muted-foreground">
              هیچ پاسخی منطبق با عبارت «{searchQuery}» پیدا نشد.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSearchQuery('')}
            className="text-xs mt-2"
          >
            پاک کردن فیلتر جستجو
          </Button>
        </Card>
      ) : (
        <Card className="overflow-hidden border border-border/80 shadow-xs">
          <div className="overflow-x-auto max-h-[68vh] scrollbar-thin">
            <table className="w-full text-xs text-start border-collapse">
              <thead className="sticky top-0 bg-muted/95 backdrop-blur-xs z-10 border-b border-border text-foreground font-bold select-none">
                <tr>
                  <th className="py-3 px-3.5 text-center font-bold text-muted-foreground w-12 border-e border-border/40">
                    #
                  </th>
                  {headers.map((h, i) => (
                    <th
                      key={i}
                      className="py-3 px-3.5 text-start font-bold whitespace-nowrap border-e border-border/40 last:border-e-0"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 font-medium">
                {filteredSubmissions.map((row, rowIdx) => (
                  <tr
                    key={rowIdx}
                    className="hover:bg-muted/30 transition-colors group"
                  >
                    {/* Row Index */}
                    <td className="py-2.5 px-3.5 text-center text-muted-foreground text-[11px] border-e border-border/40 bg-muted/10 group-hover:bg-muted/20">
                      {toPersianDigits(rowIdx + 1)}
                    </td>

                    {/* Column Cells */}
                    {headers.map((h, colIdx) => {
                      const val = row[h];
                      const isEmpty = val === undefined || val === null || val === '';

                      // 1. Tracking Code Column
                      if (h === 'کد رهگیری') {
                        if (isEmpty) {
                          return (
                            <td key={colIdx} className="py-2.5 px-3.5 border-e border-border/40 last:border-e-0 text-muted-foreground">
                              —
                            </td>
                          );
                        }
                        const codeStr = String(val);
                        return (
                          <td
                            key={colIdx}
                            className="py-2.5 px-3.5 whitespace-nowrap border-e border-border/40 last:border-e-0"
                          >
                            <div className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold">
                              <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                                {codeStr}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopy(codeStr)}
                                className="text-muted-foreground hover:text-primary p-1 rounded-sm hover:bg-muted transition-colors"
                                title="کپی کد رهگیری"
                              >
                                {copiedCode === codeStr ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </td>
                        );
                      }

                      // 2. Submission Source Column
                      if (h === 'منبع') {
                        const isTelegram = String(val).toLowerCase().includes('telegram') || String(val) === 'تلگرام';
                        return (
                          <td
                            key={colIdx}
                            className="py-2.5 px-3.5 whitespace-nowrap border-e border-border/40 last:border-e-0"
                          >
                            <Badge
                              variant="secondary"
                              className={`text-[10px] font-medium px-2 py-0.5 ${
                                isTelegram
                                  ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20'
                                  : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                              }`}
                            >
                              {isTelegram ? 'تلگرام' : 'وب'}
                            </Badge>
                          </td>
                        );
                      }

                      // 3. Jalali Date Column
                      if (h === 'تاریخ ثبت (شمسی)') {
                        return (
                          <td
                            key={colIdx}
                            className="py-2.5 px-3.5 whitespace-nowrap text-muted-foreground text-[11px] border-e border-border/40 last:border-e-0 font-mono"
                          >
                            {isEmpty ? '—' : toPersianDigits(String(val))}
                          </td>
                        );
                      }

                      // 4. Default Data Cell
                      return (
                        <td
                          key={colIdx}
                          className="py-2.5 px-3.5 max-w-xs truncate border-e border-border/40 last:border-e-0 text-foreground"
                          title={!isEmpty ? String(val) : undefined}
                        >
                          {isEmpty ? (
                            <span className="text-muted-foreground/60">—</span>
                          ) : (
                            <span>{String(val)}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Share Dialog */}
      {isShareOpen && formId && (
        <ShareFormDialog
          open={isShareOpen}
          onOpenChange={setIsShareOpen}
          formId={formId}
          formTitle={formTitle}
        />
      )}
    </div>
  );
}
