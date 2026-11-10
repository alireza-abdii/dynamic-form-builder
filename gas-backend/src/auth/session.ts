/**
 * Admin Session & Authentication Service for Google Apps Script.
 */
import { getScriptConfig } from '../config';

function toHex(bytes: number[]): string {
  return bytes
    .map((b) => (b < 0 ? b + 256 : b).toString(16).padStart(2, '0'))
    .join('');
}

export function hashSha256(input: string): string {
  const rawBytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    input,
    Utilities.Charset.UTF_8
  );
  return toHex(rawBytes);
}

export function verifyAdminCredentials(username: string, password: string): boolean {
  const cache = CacheService.getScriptCache();
  const attemptKey = `auth_fail_${username}`;
  const rawAttempts = cache?.get(attemptKey);
  const attempts = rawAttempts ? Number(rawAttempts) : 0;

  if (attempts >= 10) {
    console.warn(`[auth] Brute-force rate limit active for username: ${username}`);
    return false;
  }

  const cfg = getScriptConfig();
  const expectedUser = cfg.adminUsername || 'admin';
  const expectedHash = cfg.adminPasswordHash || hashSha256('admin');

  const incomingHash = hashSha256(password);
  const isValid = username === expectedUser && incomingHash === expectedHash;

  if (!isValid) {
    if (cache) {
      cache.put(attemptKey, String(attempts + 1), 300); // 5 minutes lockout window
    }
    return false;
  }

  // Clear failed attempts on success
  if (cache) {
    cache.remove(attemptKey);
  }
  return true;
}

export function createSessionToken(username: string): { token: string; expiresAt: number } {
  const cfg = getScriptConfig();
  const secret = cfg.sessionSecret || cfg.webhookSecret || 'default_form_builder_session_secret_key';
  const expiresAt = Date.now() + 12 * 60 * 60 * 1000; // 12 hours

  const payload = JSON.stringify({
    u: username,
    exp: expiresAt,
    n: Utilities.getUuid()
  });

  const payloadB64 = Utilities.base64EncodeWebSafe(payload);
  const sigBytes = Utilities.computeHmacSha256Signature(payloadB64, secret);
  const sigB64 = Utilities.base64EncodeWebSafe(sigBytes);

  return {
    token: `${payloadB64}.${sigB64}`,
    expiresAt
  };
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token || typeof token !== 'string') return false;

  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const payloadB64 = parts[0];
  const sigB64 = parts[1];
  if (!payloadB64 || !sigB64) return false;

  const cfg = getScriptConfig();
  const secret = cfg.sessionSecret || cfg.webhookSecret || 'default_form_builder_session_secret_key';

  const expectedSigBytes = Utilities.computeHmacSha256Signature(payloadB64, secret);
  const expectedSigB64 = Utilities.base64EncodeWebSafe(expectedSigBytes);

  if (sigB64 !== expectedSigB64) {
    return false;
  }

  try {
    const payloadJson = Utilities.newBlob(Utilities.base64DecodeWebSafe(payloadB64)).getDataAsString('UTF-8');
    const parsed = JSON.parse(payloadJson) as { u?: string; exp?: number };
    if (!parsed.exp || typeof parsed.exp !== 'number') return false;
    return parsed.exp > Date.now();
  } catch {
    return false;
  }
}

