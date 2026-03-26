
import { Router } from "express";

const router: Router = Router();
import dotenv from 'dotenv';
import { EnvatoAccountResponse, EnvatoTokenResponse } from "../types/enavtoTypes";
import { saveToken } from "../../../db/tokens";

dotenv.config();

router.get("/callback", async (req, res) => {
  const codeParam = req.query.code;
  const code = Array.isArray(codeParam) ? codeParam[0] : codeParam;

  if (!code || typeof code !== "string") {
    return res.status(400).send("Missing code");
  }

  const params = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: process.env.ENVATO_CLIENT_ID || "",
    client_secret: process.env.ENVATO_CLIENT_SECRET || ""
  });

  const tokenResp = await fetch("https://api.envato.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!tokenResp.ok) {
    const errText = await tokenResp.text();
    return res.status(400).send(`Token exchange failed: ${errText}`);
  }

  const tokenJson: EnvatoTokenResponse = await tokenResp.json();

  const profileResp = await fetch("https://api.envato.com/v1/market/private/user/username.json", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${tokenJson.access_token}`
    }
  })

  const accountInfo: EnvatoAccountResponse = await profileResp.json();
  
  await saveToken({
    email: accountInfo.username,
    access_token: tokenJson.access_token,
    expires_in: tokenJson.expires_in,
    refresh_token: tokenJson.refresh_token,
    refresh_token_expires_in: 0,       
    connection_type: "envato",
  });


  res.status(200).json({ tokenJson , accountInfo });
});

export default router;