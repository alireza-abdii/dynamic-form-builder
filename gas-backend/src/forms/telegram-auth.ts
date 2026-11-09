/**
 * Telegram WebApp initData HMAC-SHA256 validation for Google Apps Script.
 */

export interface VerifiedTelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
}

export interface VerificationResult {
  ok: boolean;
  user?: VerifiedTelegramUser | undefined;
  error?: string | undefined;
}

export function verifyTelegramInitData(
  initData: string | undefined,
  botToken: string
): VerificationResult {
  if (!initData || !botToken) {
    return { ok: false, error: 'Missing initData or botToken' };
  }

  try {
    const params: Record<string, string> = {};
    const pairs = initData.split('&');
    let hash = '';

    for (const pair of pairs) {
      const idx = pair.indexOf('=');
      if (idx === -1) continue;
      const key = decodeURIComponent(pair.substring(0, idx));
      const val = decodeURIComponent(pair.substring(idx + 1));
      if (key === 'hash') {
        hash = val;
      } else {
        params[key] = val;
      }
    }

    if (!hash) {
      return { ok: false, error: 'Missing hash in initData' };
    }

    // Sort keys alphabetically and construct data_check_string
    const sortedKeys = Object.keys(params).sort();
    const dataCheckString = sortedKeys.map((k) => `${k}=${params[k]}`).join('\n');

    // 1. secret_key = HMAC_SHA256(botToken, "WebAppData")
    const secretKey = Utilities.computeHmacSha256Signature(
      Utilities.newBlob('WebAppData').getBytes(),
      Utilities.newBlob(botToken).getBytes()
    );

    // 2. calculated_hash = HMAC_SHA256(dataCheckString, secret_key)
    const calculatedHashBytes = Utilities.computeHmacSha256Signature(
      Utilities.newBlob(dataCheckString).getBytes(),
      secretKey
    );

    // Convert bytes to hex string
    const calculatedHash = calculatedHashBytes
      .map((b) => {
        const unsigned = b < 0 ? b + 256 : b;
        return unsigned.toString(16).padStart(2, '0');
      })
      .join('');

    if (calculatedHash !== hash) {
      return { ok: false, error: 'Signature mismatch' };
    }

    // Check expiration (24 hours)
    const authDate = Number(params.auth_date);
    if (!authDate || Date.now() / 1000 - authDate > 86400) {
      return { ok: false, error: 'Authentication data expired' };
    }

    let user: VerifiedTelegramUser | undefined = undefined;
    if (params.user) {
      user = JSON.parse(params.user);
    }

    return { ok: true, user };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
