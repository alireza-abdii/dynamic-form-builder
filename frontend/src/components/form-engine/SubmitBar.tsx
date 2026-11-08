import * as React from 'react';
import { Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTelegram } from '@/lib/telegram/useTelegram';

interface SubmitBarProps {
  label: string;
  isSubmitting: boolean;
  onSubmit: () => void;
}

export function SubmitBar({ label, isSubmitting, onSubmit }: SubmitBarProps) {
  const { tg, isTma } = useTelegram();

  // If inside Telegram Mini App, bind native MainButton
  React.useEffect(() => {
    if (!isTma || !tg?.MainButton) return;

    const mb = tg.MainButton;
    mb.setText(label);
    mb.show();

    if (isSubmitting) {
      mb.showProgress(true);
      mb.disable();
    } else {
      mb.hideProgress();
      mb.enable();
    }

    const handleClick = () => {
      onSubmit();
    };

    mb.onClick(handleClick);

    return () => {
      mb.offClick(handleClick);
      mb.hide();
    };
  }, [isTma, tg, label, isSubmitting, onSubmit]);

  return (
    <div className="sticky bottom-0 z-30 -mx-6 -mb-6 p-4 sm:p-6 bg-background/95 backdrop-blur-md border-t border-border mt-8 rounded-b-2xl">
      <Button
        type="submit"
        disabled={isSubmitting}
        size="lg"
        className="w-full text-base font-bold shadow-md gap-2"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>در حال ارسال اطلاعات...</span>
          </>
        ) : (
          <>
            <Send className="h-4 w-4 rtl:rotate-180" />
            <span>{label}</span>
          </>
        )}
      </Button>
    </div>
  );
}

