/**
 * Deduplication and caching utility using Google Apps Script CacheService.
 */

export function isDuplicateSubmission(submissionId: string): boolean {
  if (!submissionId) return false;
  const cache = CacheService.getScriptCache();
  const key = `s:${submissionId}`;
  return cache.get(key) !== null;
}

export function markSubmissionProcessed(submissionId: string, ttlSeconds = 21600): void {
  if (!submissionId) return;
  const cache = CacheService.getScriptCache();
  const key = `s:${submissionId}`;
  cache.put(key, '1', ttlSeconds); // 6 hours default
}

export function isDuplicateTelegramUpdate(updateId: number): boolean {
  if (!updateId) return false;
  const cache = CacheService.getScriptCache();
  const key = `u:${updateId}`;
  const exists = cache.get(key) !== null;
  if (!exists) {
    cache.put(key, '1', 86400); // 24 hours
    return false;
  }
  return true;
}
