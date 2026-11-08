# Frontend Engineering Directives (`frontend/`)

## 1. UI Component Architecture & shadcn/ui
- Components from shadcn/ui must be generated or scaffolded properly according to shadcn structure.
- Always wrap interactive Radix components in `DirectionProvider dir="rtl"` to guarantee correct directional animations and positioning for dropdowns, popovers, tooltips, and dialogs.
- Form controls must integrate with `react-hook-form` via `<FormField>`, `<FormItem>`, `<FormLabel>`, `<FormControl>`, `<FormMessage>`.

## 2. Touch & Mobile Ergonomics
- Minimum touch target for all buttons and interactive elements is `44px` (`min-h-11 min-w-11`).
- Provide appropriate `inputMode` on mobile keyboards:
  - Phone numbers: `inputMode="tel"`
  - Numbers: `inputMode="decimal"` or `inputMode="numeric"`
  - Email: `inputMode="email"`
- Floating sticky submit bar on mobile viewports; inside Telegram Mini App, delegate submit action to Telegram's native `MainButton` with haptic feedback.

## 3. Telegram WebApp Integration
- Only access Telegram Mini App APIs through the isolated `src/lib/telegram` adapter layer.
- Never crash if `window.Telegram.WebApp` is absent (graceful fallback to standard responsive web page).
- Synchronize Telegram theme variables (`--tg-theme-bg-color`, `--tg-theme-button-color`, etc.) with Tailwind / shadcn design tokens.
- Handle `start_param` correctly to route directly to `/f/<start_param>`.

## 4. Error Handling & Feedback
- Submitting state must disable all controls and show an animated loading spinner.
- All feedback toasts must use `sonner` placed at `top-center` with RTL styling.
- Upon client or server validation failure, automatically scroll smoothly to and focus the first invalid field.

