import { Client, OAuth } from "envato";
import {
  getTokenByConnectionType,
  updateTokenAccessByEmail,
} from "../db/tokens";

export function createEnvatoOAuth(): OAuth {
  const client_id = process.env.ENVATO_CLIENT_ID;
  const client_secret = process.env.ENVATO_CLIENT_SECRET;
  const redirect_uri = process.env.ENVATO_REDIRECT_URL;
  if (!client_id || !client_secret || !redirect_uri) {
    throw new Error("ENVATO_CLIENT_ID, ENVATO_CLIENT_SECRET, ENVATO_REDIRECT_URL required");
  }
  return new OAuth({
    client_id,
    client_secret,
    redirect_uri,
    userAgent:
      process.env.ENVATO_USER_AGENT ||
      "zoom-oauth-poc / Envato Market API integration (dev)",
  });
}

/** Envato rows store expires_in as absolute Unix seconds (not OAuth TTL). Legacy rows used TTL; detect and interpret. */
function expirationMsFromRow(expiresInRaw: string | number): number {
  const n = Number(expiresInRaw);
  if (!Number.isFinite(n) || n <= 0) {
    return Date.now() + 3_600_000;
  }
  // OAuth TTL from Envato is typically well under 1e9; Unix seconds now is ~1.7e9.
  if (n < 1_000_000_000) {
    return Date.now() + n * 1000;
  }
  return n * 1000;
}

/**
 * Returns an Envato API client with OAuth refresh, or null if not connected.
 * Persists renewed access tokens via the DB `renew` event.
 */
export async function getEnvatoClient(userId?: string): Promise<Client | null> {
  const row = await getTokenByConnectionType("envato", userId);
  
  if (!row?.access_token || !row.refresh_token) {
    return null;
  }
  
  const oauth = createEnvatoOAuth();
  const expiration = expirationMsFromRow(row.expires_in);

  const client = new Client({
    token: row.access_token,
    refreshToken: row.refresh_token,
    expiration,
    oauth
  });

  const email = row.email as string;
  client.on("renew", (renewal) => {
    void updateTokenAccessByEmail(
      email,
      renewal.accessToken,
      Math.floor(renewal.expiration / 1000)
    );
  });

  return client;
}
