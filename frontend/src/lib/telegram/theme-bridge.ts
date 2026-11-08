import { getTelegramWebApp } from './webapp';

function hexToHsl(hex: string): string | null {
  const clean = hex.replace('#', '');
  if (clean.length !== 6 && clean.length !== 3) return null;
  const fullHex = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;

  const r = parseInt(fullHex.substring(0, 2), 16) / 255;
  const g = parseInt(fullHex.substring(2, 4), 16) / 255;
  const b = parseInt(fullHex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  const hDeg = Math.round(h * 360);
  const sPct = Math.round(s * 100);
  const lPct = Math.round(l * 100);

  return `${hDeg} ${sPct}% ${lPct}%`;
}

export function syncTelegramTheme(): void {
  const tg = getTelegramWebApp();
  if (!tg) return;

  const root = document.documentElement;

  // Sync colorScheme class
  if (tg.colorScheme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  const p = tg.themeParams;
  if (!p) return;

  // Map Telegram theme variables to shadcn tokens
  if (p.bg_color) {
    const hsl = hexToHsl(p.bg_color);
    if (hsl) root.style.setProperty('--background', hsl);
  }
  if (p.text_color) {
    const hsl = hexToHsl(p.text_color);
    if (hsl) root.style.setProperty('--foreground', hsl);
  }
  if (p.button_color) {
    const hsl = hexToHsl(p.button_color);
    if (hsl) {
      root.style.setProperty('--primary', hsl);
      root.style.setProperty('--ring', hsl);
    }
  }
  if (p.button_text_color) {
    const hsl = hexToHsl(p.button_text_color);
    if (hsl) root.style.setProperty('--primary-foreground', hsl);
  }
  if (p.secondary_bg_color) {
    const hsl = hexToHsl(p.secondary_bg_color);
    if (hsl) {
      root.style.setProperty('--card', hsl);
      root.style.setProperty('--popover', hsl);
      root.style.setProperty('--secondary', hsl);
    }
  }
}

export function initTelegramThemeBridge(): () => void {
  const tg = getTelegramWebApp();
  if (!tg) return () => {};

  syncTelegramTheme();

  const handleThemeChange = () => {
    syncTelegramTheme();
  };

  tg.onEvent('themeChanged', handleThemeChange);

  return () => {
    tg.offEvent('themeChanged', handleThemeChange);
  };
}

