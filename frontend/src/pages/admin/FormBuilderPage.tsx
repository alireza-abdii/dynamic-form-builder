import * as React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Save,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Download,
  Eye,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Link2
} from 'lucide-react';
import { formDefinitionSchema, toPersianDigits, type FormDefinition, type FieldDefinition, type FormSummary, type Preset } from '@fb/shared';
import { getForm, saveForm, listForms } from '@/lib/api/gas-client';
import { getAdminToken } from '@/lib/auth/admin-auth';
import { DynamicForm } from '@/components/form-engine/DynamicForm';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

const DEFAULT_FORM: FormDefinition = {
  id: 'new-form',
  version: 1,
  title: 'فرم جدید',
  description: 'لطفاً اطلاعات زیر را با دقت تکمیل کنید.',
  status: 'open',
  access: 'public',
  notifyAdmins: true,
  submitLabel: 'ثبت اطلاعات',
  successMessage: 'اطلاعات شما با موفقیت ثبت شد. سپاس 🌱',
  fields: [
    {
      key: 'title',
      type: 'text',
      label: 'عنوان',
      required: true,
      placeholder: 'مثال: عنوان درخواست'
    }
  ]
};

export function FormBuilderPage() {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(formId);

  const [form, setForm] = React.useState<FormDefinition>(DEFAULT_FORM);
  const [activeTab, setActiveTab] = React.useState<'fields' | 'settings'>('fields');
  const [previewMode, setPreviewMode] = React.useState(false);
  const [availableForms, setAvailableForms] = React.useState<FormSummary[]>([]);
  const [isLoading, setIsLoading] = React.useState(isEditing);
  const [isSaving, setIsSaving] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  // Load existing form if in edit mode
  React.useEffect(() => {
    listForms().then((forms) => setAvailableForms(forms));

    if (formId) {
      setIsLoading(true);
      getForm(formId)
        .then((res) => {
          if (res?.form) {
            setForm(res.form);
          } else {
            setErrorMsg('فرم مورد نظر یافت نشد.');
          }
        })
        .catch((err) => {
          setErrorMsg(err instanceof Error ? err.message : 'خطا در بارگذاری فرم.');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [formId]);

  const updateFormMeta = <K extends keyof FormDefinition>(key: K, value: FormDefinition[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleAddField = (type: FieldDefinition['type']) => {
    const fieldIndex = form.fields.length + 1;
    let newField: FieldDefinition;

    switch (type) {
      case 'text':
        newField = { key: `field${fieldIndex}`, type: 'text', label: `فیلد متنی ${fieldIndex}`, required: true };
        break;
      case 'textarea':
        newField = { key: `field${fieldIndex}`, type: 'textarea', label: `فیلد چندخطی ${fieldIndex}`, rows: 3 };
        break;
      case 'number':
        newField = { key: `field${fieldIndex}`, type: 'number', label: `فیلد عددی ${fieldIndex}`, integer: true };
        break;
      case 'tel':
        newField = { key: `field${fieldIndex}`, type: 'tel', label: `شماره موبایل`, preset: 'iran-mobile', required: true };
        break;
      case 'select':
        newField = {
          key: `field${fieldIndex}`,
          type: 'select',
          label: `گزینه انتخابی ${fieldIndex}`,
          options: [
            { value: 'opt1', label: 'گزینه اول' },
            { value: 'opt2', label: 'گزینه دوم' }
          ]
        };
        break;
      case 'multiselect':
        newField = {
          key: `field${fieldIndex}`,
          type: 'multiselect',
          label: `انتخاب چندگانه ${fieldIndex}`,
          options: [
            { value: 'opt1', label: 'گزینه اول' },
            { value: 'opt2', label: 'گزینه دوم' }
          ]
        };
        break;
      case 'jalali-date':
        newField = { key: `field${fieldIndex}`, type: 'jalali-date', label: `تاریخ`, required: true };
        break;
      case 'reference':
        newField = {
          key: `field${fieldIndex}`,
          type: 'reference',
          label: `انتخاب از فرم دیگر`,
          required: true,
          source: {
            formId: availableForms[0]?.id || 'employee-contact-info',
            fieldKey: 'fullName'
          }
        };
        break;
    }

    setForm((prev) => ({ ...prev, fields: [...prev.fields, newField] }));
  };

  const updateField = (index: number, updated: FieldDefinition) => {
    setForm((prev) => {
      const copy = [...prev.fields];
      copy[index] = updated;
      return { ...prev, fields: copy };
    });
  };

  const removeField = (index: number) => {
    setForm((prev) => {
      const copy = prev.fields.filter((_, i) => i !== index);
      return { ...prev, fields: copy };
    });
  };

  const moveField = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= form.fields.length) return;

    setForm((prev) => {
      const copy = [...prev.fields];
      const temp = copy[index]!;
      copy[index] = copy[targetIndex]!;
      copy[targetIndex] = temp;
      return { ...prev, fields: copy };
    });
  };

  const handleSave = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    // Validate using the schema
    const validation = formDefinitionSchema.safeParse(form);
    if (!validation.success) {
      const firstError = validation.error.errors[0]?.message || 'ساختار فرم نامعتبر است.';
      setErrorMsg(firstError);
      return;
    }

    const token = getAdminToken();
    if (!token) {
      navigate('/admin/login');
      return;
    }

    setIsSaving(true);
    try {
      const res = await saveForm(token, validation.data);
      if (res.ok) {
        setSuccessMsg(`فرم «${form.title}» با موفقیت ذخیره شد (نسخه ${res.version}).`);
        if (!isEditing && res.formId) {
          navigate(`/admin/forms/${res.formId}/edit`, { replace: true });
        }
      } else {
        setErrorMsg(res.message || 'خطا در ذخیره فرم.');
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'خطای سرور');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(form, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${form.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="p-16 text-center text-sm text-muted-foreground space-y-3">
        <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
        <p>در حال بارگذاری فرم...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto py-6 px-3 sm:px-6 space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <Link to="/admin/forms">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
              <ArrowRight className="w-4 h-4" />
              <span>بازگشت به لیست</span>
            </Button>
          </Link>
          <div className="h-4 w-px bg-border" />
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            {isEditing ? `ویرایش فرم «${form.title}»` : 'ایجاد فرم جدید'}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPreviewMode(!previewMode)}
            className="gap-1.5 text-xs"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{previewMode ? 'بستن پیش‌نمایش' : 'پیش‌نمایش زنده'}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportJson}
            className="gap-1.5 text-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>خروجی JSON</span>
          </Button>

          <Button
            size="sm"
            disabled={isSaving}
            onClick={handleSave}
            className="gap-1.5 text-xs font-semibold"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>ذخیره فرم</span>
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {errorMsg && (
        <div className="p-3.5 rounded-lg text-xs font-medium flex items-center gap-2 border bg-destructive/10 text-destructive border-destructive/20">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-lg text-xs font-medium flex items-center gap-2 border bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Grid: Left editor, Right preview */}
      <div className={`grid gap-6 ${previewMode ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
        {/* Left: Form Builder Workspace */}
        <div className="space-y-6">
          {/* Tabs: Fields vs Form Settings */}
          <div className="flex border-b">
            <button
              type="button"
              onClick={() => setActiveTab('fields')}
              className={`pb-2.5 px-4 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === 'fields'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              فیلدهای فرم ({toPersianDigits(form.fields.length)})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`pb-2.5 px-4 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === 'settings'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              تنظیمات و دسترسی‌های فرم
            </button>
          </div>

          {activeTab === 'settings' ? (
            <Card className="p-5 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="form-title">عنوان فرم *</Label>
                  <Input
                    id="form-title"
                    value={form.title}
                    onChange={(e) => updateFormMeta('title', e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="form-id">شناسه فرم (kebab-case) *</Label>
                  <Input
                    id="form-id"
                    dir="ltr"
                    disabled={isEditing}
                    value={form.id}
                    onChange={(e) => updateFormMeta('id', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    className="font-mono text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="form-desc">توضیحات فرم</Label>
                <Textarea
                  id="form-desc"
                  rows={2}
                  value={form.description || ''}
                  onChange={(e) => updateFormMeta('description', e.target.value)}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label>وضعیت فرم</Label>
                  <Select
                    value={form.status}
                    onValueChange={(val: 'open' | 'closed') => updateFormMeta('status', val)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">فعال (پذیرش پاسخ)</SelectItem>
                      <SelectItem value="closed">بسته (غیرفعال)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>نوع دسترسی</Label>
                  <Select
                    value={form.access}
                    onValueChange={(val: 'public' | 'telegram') => updateFormMeta('access', val)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">عمومی (وب و تلگرام)</SelectItem>
                      <SelectItem value="telegram">فقط مینی‌اپ تلگرام</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="closes-at">مهلت ثبت (تاریخ شمسی)</Label>
                  <Input
                    id="closes-at"
                    dir="ltr"
                    placeholder="1405/12/29"
                    value={form.closesAt || ''}
                    onChange={(e) => updateFormMeta('closesAt', e.target.value || null)}
                    className="text-start font-mono"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="submit-label">متن دکمه ثبت</Label>
                  <Input
                    id="submit-label"
                    value={form.submitLabel || 'ثبت اطلاعات'}
                    onChange={(e) => updateFormMeta('submitLabel', e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="success-msg">پیام موفقیت ثبت</Label>
                  <Input
                    id="success-msg"
                    value={form.successMessage || ''}
                    onChange={(e) => updateFormMeta('successMessage', e.target.value)}
                  />
                </div>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Add Field Bar */}
              <div className="p-3 bg-muted/60 rounded-xl border flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold me-1">افزودن فیلد:</span>
                <Button size="sm" variant="secondary" onClick={() => handleAddField('text')} className="h-7 text-xs">
                  متن تک‌خطی
                </Button>
                <Button size="sm" variant="secondary" onClick={() => handleAddField('textarea')} className="h-7 text-xs">
                  متن چندخطی
                </Button>
                <Button size="sm" variant="secondary" onClick={() => handleAddField('number')} className="h-7 text-xs">
                  عدد
                </Button>
                <Button size="sm" variant="secondary" onClick={() => handleAddField('tel')} className="h-7 text-xs">
                  شماره موبایل
                </Button>
                <Button size="sm" variant="secondary" onClick={() => handleAddField('select')} className="h-7 text-xs">
                  دراپ‌داون
                </Button>
                <Button size="sm" variant="secondary" onClick={() => handleAddField('multiselect')} className="h-7 text-xs">
                  چندانتخابی
                </Button>
                <Button size="sm" variant="secondary" onClick={() => handleAddField('jalali-date')} className="h-7 text-xs">
                  تاریخ شمسی
                </Button>
                <Button size="sm" variant="default" onClick={() => handleAddField('reference')} className="h-7 text-xs bg-primary text-primary-foreground font-semibold">
                  🔗 ارجاع به فرم دیگر
                </Button>
              </div>

              {/* Field Cards */}
              <div className="space-y-3">
                {form.fields.map((field, idx) => (
                  <Card key={`${field.key}_${idx}`} className="p-4 space-y-3 border-border/80">
                    <div className="flex items-center justify-between gap-2 border-b pb-2.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-sm text-foreground">{field.label}</span>
                        <Badge variant="outline" className="text-[10px] font-mono">
                          {field.type}
                        </Badge>
                        {field.required && (
                          <Badge variant="destructive" className="text-[10px]">الزامی</Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          disabled={idx === 0}
                          onClick={() => moveField(idx, 'up')}
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          disabled={idx === form.fields.length - 1}
                          onClick={() => moveField(idx, 'down')}
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => removeField(idx)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Common Field Settings */}
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="space-y-1">
                        <Label className="text-xs">برچسب فیلد (Label) *</Label>
                        <Input
                          value={field.label}
                          onChange={(e) => updateField(idx, { ...field, label: e.target.value })}
                          className="h-9 text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">شناسه فیلد (key camelCase) *</Label>
                        <Input
                          dir="ltr"
                          value={field.key}
                          onChange={(e) => updateField(idx, { ...field, key: e.target.value.replace(/[^a-zA-Z0-9]/g, '') })}
                          className="h-9 text-xs font-mono"
                        />
                      </div>

                      <div className="flex items-center gap-2 pt-6">
                        <input
                          type="checkbox"
                          id={`req_${idx}`}
                          checked={field.required || false}
                          onChange={(e) => updateField(idx, { ...field, required: e.target.checked })}
                          className="rounded border-input text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                        />
                        <Label htmlFor={`req_${idx}`} className="text-xs font-medium cursor-pointer">
                          تکمیل این فیلد الزامی است
                        </Label>
                      </div>
                    </div>

                    {/* Specific Field Customization */}
                    {field.type === 'text' && (
                      <div className="grid gap-3 sm:grid-cols-3 pt-1 border-t">
                        <div className="space-y-1">
                          <Label className="text-xs">الگوی آماده (Preset)</Label>
                          <Select
                            value={field.preset || 'none'}
                            onValueChange={(val) => updateField(idx, { ...field, preset: val === 'none' ? undefined : (val as Preset) })}
                          >
                            <SelectTrigger className="h-9 text-xs">
                              <SelectValue placeholder="انتخاب الگو..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">ساده (بدون الگو)</SelectItem>
                              <SelectItem value="national-id">کد ملی ایران (۱۰ رقم + اعتبارسنجی الگوریتم)</SelectItem>
                              <SelectItem value="iran-sheba">شماره شبا ایران (IR + ۲۴ رقم)</SelectItem>
                              <SelectItem value="bank-card">شماره کارت بانکی (۱۶ رقم + اعتبارسنجی Luhn)</SelectItem>
                              <SelectItem value="email">نشانی ایمیل</SelectItem>
                              <SelectItem value="postal-code">کد پستی (۱۰ رقم)</SelectItem>
                              <SelectItem value="digits-only">فقط ارقام</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs">حداقل طول کاراکتر</Label>
                          <Input
                            type="number"
                            min={0}
                            value={field.minLength ?? ''}
                            onChange={(e) => updateField(idx, { ...field, minLength: e.target.value ? Number(e.target.value) : undefined })}
                            className="h-9 text-xs"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs">حداکثر طول کاراکتر</Label>
                          <Input
                            type="number"
                            min={1}
                            value={field.maxLength ?? ''}
                            onChange={(e) => updateField(idx, { ...field, maxLength: e.target.value ? Number(e.target.value) : undefined })}
                            className="h-9 text-xs"
                          />
                        </div>
                      </div>
                    )}

                    {field.type === 'number' && (
                      <div className="grid gap-3 sm:grid-cols-3 pt-1 border-t">
                        <div className="space-y-1">
                          <Label className="text-xs">حداقل مقدار</Label>
                          <Input
                            type="number"
                            value={field.min ?? ''}
                            onChange={(e) => updateField(idx, { ...field, min: e.target.value ? Number(e.target.value) : undefined })}
                            className="h-9 text-xs"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs">حداکثر مقدار</Label>
                          <Input
                            type="number"
                            value={field.max ?? ''}
                            onChange={(e) => updateField(idx, { ...field, max: e.target.value ? Number(e.target.value) : undefined })}
                            className="h-9 text-xs"
                          />
                        </div>

                        <div className="flex items-center gap-2 pt-6">
                          <input
                            type="checkbox"
                            id={`int_${idx}`}
                            checked={field.integer || false}
                            onChange={(e) => updateField(idx, { ...field, integer: e.target.checked })}
                            className="rounded border-input text-primary w-4 h-4 cursor-pointer"
                          />
                          <Label htmlFor={`int_${idx}`} className="text-xs cursor-pointer">فقط عدد صحیح</Label>
                        </div>
                      </div>
                    )}

                    {(field.type === 'select' || field.type === 'multiselect') && (
                      <div className="space-y-2 pt-2 border-t">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-semibold">گزینه‌های لیست انتخابی:</Label>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => {
                              const optCount = field.options.length + 1;
                              const newOpts = [...field.options, { value: `opt_${optCount}`, label: `گزینه ${optCount}` }];
                              updateField(idx, { ...field, options: newOpts });
                            }}
                          >
                            + افزودن گزینه
                          </Button>
                        </div>

                        <div className="space-y-2">
                          {field.options.map((opt, optIdx) => (
                            <div key={optIdx} className="flex items-center gap-2">
                              <Input
                                placeholder="عنوان نمایشی (label)"
                                value={opt.label}
                                onChange={(e) => {
                                  const opts = [...field.options];
                                  opts[optIdx] = { ...opt, label: e.target.value };
                                  updateField(idx, { ...field, options: opts });
                                }}
                                className="h-8 text-xs flex-1"
                              />
                              <Input
                                dir="ltr"
                                placeholder="مقدار سیستمی (value)"
                                value={opt.value}
                                onChange={(e) => {
                                  const opts = [...field.options];
                                  opts[optIdx] = { ...opt, value: e.target.value };
                                  updateField(idx, { ...field, options: opts });
                                }}
                                className="h-8 text-xs w-36 font-mono"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                disabled={field.options.length <= 1}
                                onClick={() => {
                                  const opts = field.options.filter((_, i) => i !== optIdx);
                                  updateField(idx, { ...field, options: opts });
                                }}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {field.type === 'reference' && (
                      <div className="p-3 bg-primary/5 rounded-lg border border-primary/20 space-y-3 pt-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-primary">
                          <Link2 className="w-3.5 h-3.5" />
                          <span>تنظیمات ارتباط فیلد با فرم مرجع (Dynamic Reference)</span>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-1">
                            <Label className="text-xs">فرم مبدأ (Source Form) *</Label>
                            <Select
                              value={field.source.formId}
                              onValueChange={(val) => updateField(idx, {
                                ...field,
                                source: { ...field.source, formId: val }
                              })}
                            >
                              <SelectTrigger className="h-9 text-xs">
                                <SelectValue placeholder="انتخاب فرم مبدأ..." />
                              </SelectTrigger>
                              <SelectContent>
                                {availableForms.map((f) => (
                                  <SelectItem key={f.id} value={f.id}>
                                    {f.title} ({f.id})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs">کلید ستون نمایشی در فرم مبدأ *</Label>
                            <Input
                              dir="ltr"
                              placeholder="مثال: fullName یا mobile"
                              value={field.source.fieldKey}
                              onChange={(e) => updateField(idx, {
                                ...field,
                                source: { ...field.source, fieldKey: e.target.value }
                              })}
                              className="h-9 text-xs font-mono"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <input
                            type="checkbox"
                            id={`multi_${idx}`}
                            checked={field.multiple || false}
                            onChange={(e) => updateField(idx, { ...field, multiple: e.target.checked })}
                            className="rounded border-input text-primary w-4 h-4 cursor-pointer"
                          />
                          <Label htmlFor={`multi_${idx}`} className="text-xs cursor-pointer font-medium">
                            امکان انتخاب چندگانه از بین رکوردهای ثبت‌شده
                          </Label>
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Live Dynamic Form Preview */}
        {previewMode && (
          <div className="space-y-3 sticky top-4 self-start">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-xs font-bold flex items-center gap-1.5 text-muted-foreground">
                <Eye className="w-3.5 h-3.5 text-primary" />
                پیش‌نمایش زنده موتور فرم (Real-time DynamicForm):
              </span>
              <Badge variant="outline" className="text-[10px]">حالت پیش‌نمایش</Badge>
            </div>

            <div className="p-4 border rounded-xl bg-card shadow-sm">
              <DynamicForm definition={form} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
