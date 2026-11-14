import * as React from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import {
  Share2,
  Copy,
  Check,
  Download,
  Globe,
  Send,
  ExternalLink,
  QrCode
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface ShareFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formId: string;
  formTitle: string;
}

export function ShareFormDialog({
  open,
  onOpenChange,
  formId,
  formTitle
}: ShareFormDialogProps) {
  const [activeTab, setActiveTab] = React.useState<'web' | 'telegram'>('web');
  const [copied, setCopied] = React.useState(false);
  const qrRef = React.useRef<HTMLDivElement>(null);

  // Compute public URLs
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const webUrl = `${baseUrl}/f/${formId}`;

  const botUsername = (import.meta.env.VITE_BOT_USERNAME as string) || 'form_builderr_bot';
  const tmaShortname = (import.meta.env.VITE_TMA_SHORTNAME as string) || 'forms';
  const telegramUrl = `https://t.me/${botUsername}/${tmaShortname}?startapp=${formId}`;

  const currentUrl = activeTab === 'web' ? webUrl : telegramUrl;

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(currentUrl);
      } else {
        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = currentUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const handleDownloadQr = () => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    const downloadLink = document.createElement('a');
    downloadLink.href = dataUrl;
    downloadLink.download = `qrcode-${formId}-${activeTab}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-start space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <DialogTitle className="text-base font-bold">
              اشتراک‌گذاری فرم
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            فرم «{formTitle}» را از طریق لینک مستقیم یا کد QR در شبکه‌های اجتماعی، وب یا چاپ به اشتراک بگذارید.
          </DialogDescription>
        </DialogHeader>

        {/* Tab Switcher: Web vs Telegram */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-muted rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('web')}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'web'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>لینک مستقیم وب</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('telegram')}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'telegram'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>مینی‌اپ تلگرام (TMA)</span>
          </button>
        </div>

        {/* Link display & copy input */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{activeTab === 'web' ? 'آدرس اینترنتی وب‌سایت:' : 'دیپ‌لینک مینی‌اپ تلگرام:'}</span>
            <Badge variant="outline" className="text-[10px] font-mono">
              {activeTab === 'web' ? 'HTTP / Web' : 'Telegram Mini App'}
            </Badge>
          </div>

          <div className="flex items-center gap-1.5">
            <Input
              readOnly
              dir="ltr"
              value={currentUrl}
              className="text-xs font-mono select-all h-9 bg-muted/40"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <Button
              type="button"
              size="sm"
              variant={copied ? 'default' : 'secondary'}
              onClick={handleCopy}
              className="h-9 px-3 shrink-0 gap-1 text-xs transition-all"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-primary-foreground" />
                  <span>کپی شد!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>کپی لینک</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* QR Code Section */}
        <div className="flex flex-col items-center justify-center p-3.5 sm:p-4 bg-muted/30 border rounded-2xl space-y-2.5 sm:space-y-3">
          <div
            ref={qrRef}
            className="p-2.5 sm:p-3 bg-white rounded-xl shadow-sm border border-border/80 flex items-center justify-center"
          >
            <QRCodeCanvas
              value={currentUrl}
              size={165}
              level="H"
              marginSize={2}
              bgColor="#ffffff"
              fgColor="#0f172a"
            />
          </div>

          <div className="text-center space-y-0.5">
            <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-foreground">
              <QrCode className="w-3.5 h-3.5 text-primary" />
              <span>کد QR اختصاصی {activeTab === 'web' ? 'وب' : 'تلگرام'}</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              اسکن مستقیم با دوربین موبایل یا چاپ در بنر، پوستر و استند
            </p>
          </div>

          <div className="flex items-center gap-2 w-full pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadQr}
              className="flex-1 text-xs gap-1.5 h-9 font-medium"
            >
              <Download className="w-3.5 h-3.5" />
              <span>دانلود تصویر QR (PNG)</span>
            </Button>

            <a
              href={currentUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex"
            >
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs gap-1 h-9 px-3"
                title="باز کردن لینک در تب جدید"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

