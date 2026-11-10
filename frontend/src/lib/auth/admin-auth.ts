const TOKEN_KEY = 'fb_admin_session_token';

export function getAdminToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAdminToken(token: string): void {
  try {
    sessionStorage.setItem(TOKEN_KEY, token);
  } catch (err) {
    console.warn('[auth] Unable to write token to sessionStorage:', err);
  }
}

export function clearAdminToken(): void {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
  } catch (err) {
    console.warn('[auth] Unable to remove token from sessionStorage:', err);
  }
}

export function isAdminAuthenticated(): boolean {
  const token = getAdminToken();
  return Boolean(token && token.includes('.'));
}

