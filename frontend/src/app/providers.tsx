import * as React from 'react';
import { DirectionProvider } from '@radix-ui/react-direction';
import { Toaster } from '@/components/ui/sonner';
import { useTelegram } from '@/lib/telegram/useTelegram';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  // Initialize Telegram bridge and theme synchronization
  useTelegram();

  return (
    <DirectionProvider dir="rtl">
      {children}
      <Toaster />
    </DirectionProvider>
  );
}

