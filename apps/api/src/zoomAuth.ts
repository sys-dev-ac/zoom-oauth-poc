import {
  getZoomCredentials,
  saveZoomCredentials,
  deleteZoomCredentials,
  type ZoomCredentials,
} from "./zoomStore";

const ZOOM_TOKEN_URL = "https://zoom.us/oauth/token";
const ZOOM_USER_URL = "https://api.zoom.us/v2/users/me";

export function getBasicAuth(): string {
  const key = process.env.ZOOM_API_KEY;
  const secret = process.env.ZOOM_API_SECRET;
  if (!key || !secret) throw new Error("ZOOM_API_KEY and ZOOM_API_SECRET required");
  return Buffer.from(`${key}:${secret}`).toString("base64");
}

export async function exchangeCodeForTokens(
  code: string,
  redirectUri: string
): Promise<{ credentials: ZoomCredentials; email: string; account_id: string }> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  }).toString();

  const res = await fetch(ZOOM_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${getBasicAuth()}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Zoom token error: ${res.status} ${err}`);
  }

  const data = (await res.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    error?: string;
  };

  if (data.error) throw new Error(data.error);

  const userRes = await fetch(ZOOM_USER_URL, {
    method: "GET",
    headers: { Authorization: `Bearer ${data.access_token}` },
  });

  if (!userRes.ok) throw new Error("Failed to fetch Zoom user");
  const userData = (await userRes.json()) as { email?: string; account_id?: string };
  const email = userData.email ?? "";
  const account_id = userData.account_id ?? "";

  const expires_at = Date.now() + (data.expires_in ?? 3600) * 1000;
  const credentials: ZoomCredentials = {
    email,
    account_id,
    access_token: data.access_token!,
    refresh_token: data.refresh_token!,
    expires_at,
  };

  saveZoomCredentials(credentials);
  return { credentials, email, account_id };
}

export async function refreshAccessToken(
  accountId: string
): Promise<ZoomCredentials> {
  const creds = getZoomCredentials(accountId);
  if (!creds) throw new Error("No Zoom credentials found");

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: creds.refresh_token,
  }).toString();

  const res = await fetch(ZOOM_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${getBasicAuth()}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Zoom refresh error: ${res.status} ${err}`);
  }

  const data = (await res.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    error?: string;
  };

  if (data.error) throw new Error(data.error);

  const expires_at = Date.now() + (data.expires_in ?? 3600) * 1000;
  const updated: ZoomCredentials = {
    ...creds,
    access_token: data.access_token!,
    refresh_token: data.refresh_token ?? creds.refresh_token,
    expires_at,
  };
  saveZoomCredentials(updated);
  return updated;
}

export function getValidAccessToken(accountId: string): ZoomCredentials | null {
  const creds = getZoomCredentials(accountId);
  if (!creds) return null;
  // Refresh if expires in less than 60 seconds
  if (creds.expires_at <= Date.now() + 60_000) return null;
  return creds;
}

export async function getOrRefreshCredentials(
  accountId: string
): Promise<ZoomCredentials> {
  const creds = getValidAccessToken(accountId);
  if (creds) return creds;
  return refreshAccessToken(accountId);
}

export function clearZoomUser(accountId: string): void {
  deleteZoomCredentials(accountId);
}
