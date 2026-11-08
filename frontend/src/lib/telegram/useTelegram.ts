import { useEffect, useMemo, useState } from 'react';
import { getTelegramWebApp, isTelegramMiniApp, type TelegramUser } from './webapp';
import { initTelegramThemeBridge } from './theme-bridge';

export function useTelegram() {
  const [isTma, setIsTma] = useState(false);
  const [tg, setTg] = useState(getTelegramWebApp());

  useEffect(() => {
    const webapp = getTelegramWebApp();
    if (webapp) {
      setTg(webapp);
      setIsTma(isTelegramMiniApp());
      webapp.ready();
      webapp.expand();
      const cleanupTheme = initTelegramThemeBridge();
      return () => {
        cleanupTheme();
      };
    }
  }, []);

  const user: TelegramUser | null = tg?.initDataUnsafe?.user ?? null;
  const startParam: string | null = tg?.initDataUnsafe?.start_param ?? null;
  const initData: string = tg?.initData ?? '';

  const haptics = useMemo(
    () => ({
      impact: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'medium') => {
        try {
          tg?.HapticFeedback?.impactOccurred(style);
        } catch {
          // ignore outside telegram
        }
      },
      notification: (type: 'error' | 'success' | 'warning') => {
        try {
          tg?.HapticFeedback?.notificationOccurred(type);
        } catch {
          // ignore
        }
      },
      selection: () => {
        try {
          tg?.HapticFeedback?.selectionChanged();
        } catch {
          // ignore
        }
      }
    }),
    [tg]
  );

  return {
    tg,
    isTma,
    user,
    startParam,
    initData,
    haptics
  };
}

