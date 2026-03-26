export interface EnvatoTokenResponse {
  refresh_token: string;
  token_type: "bearer";
  access_token: string;
  expires_in: number | string;
}



export interface EnvatoAccountResponse {
  username: string
}