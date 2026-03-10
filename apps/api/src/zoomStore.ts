/**
 * In-memory store for Zoom OAuth credentials (POC).
 * Replace with encrypted DB storage in production.
 */
export interface ZoomCredentials {
  email: string;
  account_id: string;
  access_token: string;
  refresh_token: string;
  expires_at: number; // Unix timestamp ms
}

const store = new Map<string, ZoomCredentials>();

export function saveZoomCredentials(creds: ZoomCredentials): void {
  store.set(creds.account_id, creds);
}

export function getZoomCredentials(accountId: string): ZoomCredentials | undefined {
  return store.get(accountId);
}

export function getAnyZoomCredentials(): ZoomCredentials | undefined {
  return store.values().next().value;
}

export function deleteZoomCredentials(accountId: string): boolean {
  return store.delete(accountId);
}

export function getAllAccountIds(): string[] {
  return Array.from(store.keys());
}
