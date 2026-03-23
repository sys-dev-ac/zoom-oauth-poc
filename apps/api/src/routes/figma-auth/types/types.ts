export type FigmaTokenResponse = {
  user_id_string: string;
  user_id: number;
  access_token: string;
  token_type: "bearer" | string;
  refresh_token: string;
  expires_in: number;
};
