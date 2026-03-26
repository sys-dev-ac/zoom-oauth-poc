import { DBclient } from "./client";

type TokenPayload = {
  access_token: string;
  expires_in: number | string;
  refresh_token: string;
  refresh_token_expires_in?: number | string;
  email: string;
};

export async function saveToken(token: TokenPayload) {
  const db = new DBclient();
  
  await db.connect();

  const client = db.getClient();

  // If your table is capitalized, use "Token" instead of token below.
  const sql = `
    INSERT INTO token (email, access_token, expires_in, refresh_token, refresh_token_expires_in)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (email) DO UPDATE SET
      access_token = EXCLUDED.access_token,
      expires_in = EXCLUDED.expires_in,
      refresh_token = EXCLUDED.refresh_token,
      refresh_token_expires_in = EXCLUDED.refresh_token_expires_in
    RETURNING *;
  `;

  const params = [
    token.email,
    token.access_token,
    token.expires_in.toString(),
    token.refresh_token,
    token.refresh_token_expires_in?.toString() || "not provided",
  ];

  const { rows } = await client.query(sql, params);
  await client.end();
  return rows[0];
}

// Usage with your callback data:
// await saveToken({
//   email: userinfo.email,
//   access_token: token.access_token,
//   expires_in: token.expires_in,
//   refresh_token: token.refresh_token,
//   refresh_token_expires_in: token.refresh_token_expires_in,
// });
