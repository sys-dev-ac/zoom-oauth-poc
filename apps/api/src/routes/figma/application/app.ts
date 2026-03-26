import { Router } from "express";
import dotenv from "dotenv";
import { FigmaTokenResponse } from "../types/types";
import { saveToken } from "../../../db/tokens";

dotenv.config();

const router: Router = Router();

router.get("/auth/figma", (_req, res) => {
  const state = Math.random().toString(36).slice(2);

  const scope = encodeURIComponent(
    "current_user:read file_comments:read file_comments:write file_content:read"
  );
  const url =
    "https://www.figma.com/oauth?" +
    `response_type=code&` +
    `client_id=${encodeURIComponent(process.env.FIGMA_CLIENT_ID || "")}&` +
    `redirect_uri=${encodeURIComponent(process.env.FIGMA_REDIRECT_URL || "")}&` +
    `scope=${scope}&` +
    `state=${state}`;

  res.redirect(url);
});

router.get("/figma/callback", async (req, res) => {
  const codeParam = req.query.code;

  const code = Array.isArray(codeParam) ? codeParam[0] : codeParam;

  if (!code || typeof code !== "string") {
    return res.status(400).send("Missing code");
  }

  const params = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: process.env.FIGMA_REDIRECT_URL || "",
    client_id: process.env.FIGMA_CLIENT_ID || "",
    client_secret: process.env.FIGMA_SECRET_CLIENT || "",
  });

  const tokenResp = await fetch("https://api.figma.com/v1/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!tokenResp.ok) {
    const errText = await tokenResp.text();
    return res.status(400).send(`Token exchange failed: ${errText}`);
  }

  const tokenJson: FigmaTokenResponse = await tokenResp.json();

  await saveToken({
    email: tokenJson.user_id_string,
    access_token: tokenJson.access_token,
    expires_in: tokenJson.expires_in,
    refresh_token: tokenJson.refresh_token,
    refresh_token_expires_in: tokenJson.expires_in,
    connection_type: "figma",
  });

  res.status(200).send({
    tokenJson,
  });
});

export default router;
