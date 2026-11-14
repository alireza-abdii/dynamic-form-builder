import * as React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  FileText,
  ExternalLink,
  Edit,
  Trash2,
  LogOut,
  RefreshCw,
  Layers,
  CheckCircle2,
  AlertCircle,
  Share2,
  Database
} from 'lucide-react';
import type { FormSummary } from '@fb/shared';
import { toPersianDigits } from '@fb/shared';
import { listForms, deleteForm } from '@/lib/api/gas-client';
import { getAdminToken, clearAdminToken } from '@/lib/auth/admin-auth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShareFormDialog } from '@/components/forms/ShareFormDialog';

export function AdminFormsPage() {
  const navigate = useNavigate();
  const [forms, setForms] = React.useState<FormSummary[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [sharingForm, setSharingForm] = React.useState<{ id: string; title: string } | null>(null);
  const [feedback, setFeedback] = React.useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchForms = React.useCallback(async () => {
    setIsLoading(true);
    setFeedback(null);
    try {
      const data = await listForms(getAdminToken() || undefined);
      setForms(data);
    } catch {
      setFeedback({ type: 'error', message: 'خطا در بارگذاری فهرست فرم‌ها.' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchForms();
  }, [fetchForms]);

  const handleLogout = () => {
    clearAdminToken();
    navigate('/admin/login');
  };

  const handleDelete = async (formId: string, formTitle: string) => {
    const confirmed = window.confirm(`آیا از حذف فرم «${formTitle}» اطمینان دارید؟`);
    if (!confirmed) return;

    const token = getAdminToken();
    if (!token) {
      navigate('/admin/login');
      return;
    }

    setDeletingId(formId);
    try {
      const res = await deleteForm(token, formId);
      if (res.ok) {
        setFeedback({ type: 'success', message: `فرم «${formTitle}» با موفقیت حذف گردید.` });
        setForms((prev) => prev.filter((f) => f.id !== formId));
      } else {
        setFeedback({ type: 'error', message: res.message || 'خطا در حذف فرم.' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'خطای سرور' });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4 sm:py-10 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight">مدیریت فرم‌های سازمانی</h1>
            <Badge variant="outline" className="text-xs">پنل ادمین</Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            مشاهده، تعریف و ویرایش فرم‌ها و تنظیم فیلدهای اعتبارسنجی
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchForms}
            disabled={isLoading}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>بروزرسانی</span>
          </Button>

          <Link to="/admin/forms/new">
            <Button size="sm" className="gap-1.5 text-xs font-semibold">
              <Plus className="w-4 h-4" />
              <span>ایجاد فرم جدید</span>
            </Button>
          </Link>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-destructive hover:text-destructive hover:bg-destructive/10 text-xs gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>خروج</span>
          </Button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-lg text-xs font-medium flex items-center gap-2 border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
              : 'bg-destructive/10 text-destructive border-destructive/20'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Forms List */}
      {isLoading ? (
        <div className="p-12 text-center text-sm text-muted-foreground space-y-3">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-primary" />
          <p>در حال بارگذاری لیست فرم‌های سامانه...</p>
        </div>
      ) : forms.length === 0 ? (
        <Card className="p-8 text-center space-y-4">
          <Layers className="w-10 h-10 mx-auto text-muted-foreground/60" />
          <div className="space-y-1">
            <CardTitle className="text-base font-bold">هیچ فرمی یافت نشد</CardTitle>
            <CardDescription className="text-xs">
              می‌توانید اولین فرم پویای خود را با دکمه زیر ایجاد نمایید.
            </CardDescription>
          </div>
          <Link to="/admin/forms/new">
            <Button className="gap-1.5 text-xs">
              <Plus className="w-4 h-4" />
              <span>ساخت اولین فرم</span>
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid gap-3.5">
          {forms.map((form) => (
            <Card
              key={form.id}
              className="p-4 sm:p-5 transition-shadow hover:shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-base text-foreground truncate">
                    {form.title}
                  </span>
                  <Badge variant={form.status === 'open' ? 'default' : 'secondary'} className="text-[11px]">
                    {form.status === 'open' ? 'فعال' : 'بسته'}
                  </Badge>
                  {form.isDynamic ? (
                    <Badge variant="outline" className="text-[10px] text-primary border-primary/30">
                      پویا (شیت)
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] text-muted-foreground">
                      ایستا (کد)
                    </Badge>
                  )}
                  <span className="text-[11px] text-muted-foreground font-mono">
                    #{form.id} (v{toPersianDigits(form.version)})
                  </span>
                </div>

                {form.description && (
                  <p className="text-xs text-muted-foreground line-clamp-1">{form.description}</p>
                )}

                <div className="flex items-center gap-3 text-xs text-muted-foreground pt-0.5">
                  <span>{toPersianDigits(form.fieldCount)} فیلد اطلاعاتی</span>
                  {form.closesAt && <span>مهلت تا: {toPersianDigits(form.closesAt)}</span>}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link to={`/admin/forms/${form.id}/submissions`}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs gap-1 border-blue-500/20 hover:border-blue-500/40 text-blue-600 dark:text-blue-400 hover:text-blue-700"
                    title="مشاهده پاسخ‌های ثبت‌شده و کدهای رهگیری"
                  >
                    <Database className="w-3.5 h-3.5" />
                    <span>پاسخ‌ها</span>
                  </Button>
                </Link>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSharingForm({ id: form.id, title: form.title })}
                  className="h-8 text-xs gap-1 border-primary/20 hover:border-primary/40 text-primary hover:text-primary"
                  title="کپی لینک و تولید کد QR"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>اشتراک‌گذاری</span>
                </Button>

                <Link to={`/f/${form.id}`} target="_blank" rel="noreferrer">
                  <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>مشاهده</span>
                  </Button>
                </Link>

                {form.isDynamic ? (
                  <>
                    <Link to={`/admin/forms/${form.id}/edit`}>
                      <Button variant="secondary" size="sm" className="h-8 text-xs gap-1">
                        <Edit className="w-3.5 h-3.5" />
                        <span>ویرایش</span>
                      </Button>
                    </Link>

                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={deletingId === form.id}
                      onClick={() => handleDelete(form.id, form.title)}
                      className="h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="sr-only">حذف</span>
                    </Button>
                  </>
                ) : (
                  <span className="text-[11px] text-muted-foreground px-2 py-1 bg-muted rounded">
                    فرم سیستمی
                  </span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {sharingForm && (
        <ShareFormDialog
          open={Boolean(sharingForm)}
          onOpenChange={(open) => !open && setSharingForm(null)}
          formId={sharingForm.id}
          formTitle={sharingForm.title}
        />
      )}
    </div>
  );
}

