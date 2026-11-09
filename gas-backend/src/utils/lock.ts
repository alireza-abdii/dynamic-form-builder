/**
 * Concurrency and script locking utility for Google Apps Script.
 */

export function withScriptLock<T>(fn: () => T, timeoutMs = 20000): T {
  const lock = LockService.getScriptLock();
  const acquired = lock.tryLock(timeoutMs);

  if (!acquired) {
    throw new Error('Lock acquisition timed out. Another process is currently writing to the spreadsheet.');
  }

  try {
    return fn();
  } finally {
    lock.releaseLock();
  }
}

