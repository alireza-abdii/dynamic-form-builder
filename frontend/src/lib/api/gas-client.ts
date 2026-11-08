import {
  type SubmitRequest,
  type ApiResponse,
  apiResponseSchema,
  fa
} from '@fb/shared';

const GAS_URL = import.meta.env.VITE_GAS_URL as string;

export async function submitForm(
  req: SubmitRequest,
  signal?: AbortSignal
): Promise<ApiResponse> {
  if (!GAS_URL || GAS_URL.includes('AKfycbxxxx')) {
    console.warn('[gas-client] VITE_GAS_URL is not set or placeholder. Simulating successful submission in dev mode.');
    await new Promise((resolve) => setTimeout(resolve, 800));
    return {
      ok: true,
      submissionId: req.submissionId
    };
  }

  const attemptFetch = async (): Promise<ApiResponse> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    // Chain external signal if provided
    if (signal) {
      signal.addEventListener('abort', () => controller.abort());
    }

    try {
      const response = await fetch(GAS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8' // Crucial: simple header bypasses CORS preflight
        },
        body: JSON.stringify(req),
        redirect: 'follow', // GAS redirects to googleusercontent.com
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return {
          ok: false,
          code: 'SERVER',
          message: fa.serverError
        };
      }

      const rawJson = await response.json();
      const parsed = apiResponseSchema.safeParse(rawJson);

      if (!parsed.success) {
        console.error('[gas-client] Invalid server response format:', parsed.error);
        return {
          ok: false,
          code: 'SERVER',
          message: fa.serverError
        };
      }

      return parsed.data;
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      const isAbort = err instanceof DOMException && err.name === 'AbortError';
      if (isAbort) {
        return {
          ok: false,
          code: 'SERVER',
          message: 'مهلت ارسال درخواست به پایان رسید. لطفاً مجدداً تلاش کنید.'
        };
      }
      throw err;
    }
  };

  try {
    return await attemptFetch();
  } catch (firstError) {
    console.warn('[gas-client] Initial request failed, attempting one retry...', firstError);
    try {
      return await attemptFetch();
    } catch (secondError) {
      console.error('[gas-client] Retry also failed:', secondError);
      return {
        ok: false,
        code: 'SERVER',
        message: fa.serverError
      };
    }
  }
}

