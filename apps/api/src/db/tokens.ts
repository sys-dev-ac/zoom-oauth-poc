import { DBclient } from "./client";

type TokenPayload = {
  access_token: string;
  expires_in: number | string;
  refresh_token: string;
  refresh_token_expires_in: number | string;
  email: string;
  connection_type: string;
};

export async function saveToken(token: TokenPayload) {
  const db = new DBclient();
  
  await db.connect();

  const client = db.getClient();

  // If your table is capitalized, use "Token" instead of token below.
  const sql = `
    INSERT INTO oauthtoken (email, access_token, expires_in, refresh_token, refresh_token_expires_in, connection_type)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (email) DO UPDATE SET
      access_token = EXCLUDED.access_token,
      expires_in = EXCLUDED.expires_in,
      refresh_token = EXCLUDED.refresh_token,
      refresh_token_expires_in = EXCLUDED.refresh_token_expires_in,
      connection_type = EXCLUDED.connection_type
    RETURNING *;
  `;

  const params = [
    token.email,
    token.access_token,
    token.expires_in.toString(),
    token.refresh_token,
    token.refresh_token_expires_in.toString(),
    token.connection_type
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


export async function createTokenTable() {
  const db = new DBclient();
  
  await db.connect();

  const client = db.getClient();

  const sql = `
    CREATE TABLE oauthtoken (
      id SERIAL PRIMARY KEY,
      access_token TEXT NOT NULL,
      expires_in INTEGER NOT NULL,
      refresh_token TEXT,
      refresh_token_expires_in INTEGER,
      email TEXT UNIQUE,
      connection_type TEXT
    );
  `;
  
  const { rows } = await client.query(sql);
  await client.end();
  return rows[0];
}


export async function getTokenByEmail(email: string) {
  const db = new DBclient();
  await db.connect();
  const client = db.getClient();

  const { rows } = await client.query(
    `SELECT * FROM oauthtoken WHERE email = $1 LIMIT 1`,
    [email]
  );

  await client.end();
  return rows[0] ?? null;
}

export async function getTokenById(id: number) {
  const db = new DBclient();
  await db.connect();
  const client = db.getClient();

  const { rows } = await client.query(
    `SELECT * FROM oauthtoken WHERE id = $1 LIMIT 1`,
    [id]
  );

  await client.end();
  return rows[0] ?? null;
}

export async function getTokenByConnectionType(connectionType: string , userId?:string) {
  const db = new DBclient();
  await db.connect();
  const client = db.getClient();

  const { rows } = await client.query(
    `SELECT * FROM oauthtoken WHERE connection_type = $1 AND email = $2`,
    [connectionType , userId]
  );

  await client.end();
  return rows[0] ?? null;
}

/** Updates access token and absolute expiry (Unix seconds) after OAuth refresh. */
export async function updateTokenAccessByEmail(
  email: string,
  accessToken: string,
  expiresAtUnixSeconds: number
) {
  const db = new DBclient();
  await db.connect();
  const client = db.getClient();

  await client.query(
    `UPDATE oauthtoken SET access_token = $1, expires_in = $2 WHERE email = $3`,
    [accessToken, expiresAtUnixSeconds, email]
  );

  await client.end();
}
