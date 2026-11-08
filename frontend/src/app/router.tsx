import * as React from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { HomePage } from '@/pages/HomePage';
import { FormPage } from '@/pages/FormPage';
import { SuccessPage } from '@/pages/SuccessPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { useTelegram } from '@/lib/telegram/useTelegram';

function TelegramRouterWatcher() {
  const navigate = useNavigate();
  const { startParam } = useTelegram();

  React.useEffect(() => {
    // If opened via Telegram deep link: t.me/bot/app?startapp=<formId>
    if (startParam && window.location.pathname === '/') {
      navigate(`/f/${startParam}`, { replace: true });
    }
  }, [startParam, navigate]);

  return null;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <TelegramRouterWatcher />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/f/:formId" element={<FormPage />} />
        <Route path="/f/:formId/done" element={<SuccessPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

