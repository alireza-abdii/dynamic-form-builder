import {
  type SubmitRequest,
  type ApiResponse,
  type FormDefinition,
  type FormSummary,
  apiResponseSchema,
  fa
} from '@fb/shared';

const GAS_URL = (import.meta.env.VITE_GAS_URL as string) || '';

async function postToGas<T>(payload: object): Promise<T> {
  if (!GAS_URL) {
    throw new Error('متغیر VITE_GAS_URL تنظیم نشده است. لطفاً فایل .env را بررسی کنید.');
  }

  const response = await fetch(GAS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8' // CORS bypass simple header
    },
    body: JSON.stringify(payload),
    redirect: 'follow'
  });

  if (!response.ok) {
    throw new Error(`خطای ارتباط با سرور با وضعیت HTTP ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function adminLogin(
  username: string,
  password: string
): Promise<{ ok: boolean; token?: string; message?: string }> {
  try {
    const res = await postToGas<{ ok: boolean; token?: string; message?: string }>({
      action: 'login',
      username,
      password
    });
    return res;
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : 'خطای ارتباط با سرور'
    };
  }
}

export async function listForms(token?: string): Promise<FormSummary[]> {
  try {
    const res = await postToGas<{ ok: boolean; forms: FormSummary[] }>({
      action: 'list_forms',
      token
    });
    return res.ok && Array.isArray(res.forms) ? res.forms : [];
  } catch (err) {
    console.error('[gas-client] Failed to list forms:', err);
    return [];
  }
}

export async function getForm(
  formId: string
): Promise<{ form: FormDefinition; isDynamic: boolean } | null> {
  try {
    const res = await postToGas<{ ok: boolean; form: FormDefinition; isDynamic: boolean; message?: string }>({
      action: 'get_form',
      formId
    });
    if (res.ok && res.form) {
      return { form: res.form, isDynamic: res.isDynamic };
    }
    return null;
  } catch (err) {
    console.error(`[gas-client] Failed to get form ${formId}:`, err);
    return null;
  }
}

export async function saveForm(
  token: string,
  form: FormDefinition
): Promise<{ ok: boolean; formId?: string; version?: number; message?: string }> {
  try {
    const res = await postToGas<{ ok: boolean; formId?: string; version?: number; message?: string }>({
      action: 'save_form',
      token,
      form
    });
    return res;
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : 'خطای ارتباط با سرور'
    };
  }
}

export async function deleteForm(
  token: string,
  formId: string
): Promise<{ ok: boolean; message?: string }> {
  try {
    const res = await postToGas<{ ok: boolean; message?: string }>({
      action: 'delete_form',
      token,
      formId
    });
    return res;
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : 'خطای ارتباط با سرور'
    };
  }
}

export async function getFieldOptions(
  formId: string,
  fieldKey: string
): Promise<Array<{ value: string; label: string }>> {
  try {
    const res = await postToGas<{ ok: boolean; options: Array<{ value: string; label: string }> }>({
      action: 'get_options',
      formId,
      fieldKey
    });
    return res.ok && Array.isArray(res.options) ? res.options : [];
  } catch (err) {
    console.warn(`[gas-client] Failed to fetch options for ${formId}.${fieldKey}:`, err);
    return [];
  }
}

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

