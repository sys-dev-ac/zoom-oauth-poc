import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.get("/auth/linkedin", (req, res) => {
  const state = Math.random().toString(36).slice(2); // or a real CSRF token

  const scope = encodeURIComponent("openid profile email w_member_social");

  const url =
    "https://www.linkedin.com/oauth/v2/authorization?" +
    `response_type=code&` +
    `client_id=${encodeURIComponent(process.env.LINKEDIN_CLIENT_ID || "")}&` +
    `redirect_uri=${encodeURIComponent(process.env.LINKEDIN_REDIRECT_URI || "")}&` +
    `scope=${scope}&`; // or add openid profile email if needed;
  res.redirect(url);
});

app.get("/linkedin/callback", async (req, res) => {
  try {
        const codeParam = req.query.code;
    const code = Array.isArray(codeParam) ? codeParam[0] : codeParam;


    if (!code || typeof code !== "string") {
      return res.status(400).send("Missing code");
    }

    // Exchange code for access token
    const params = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.LINKEDIN_REDIRECT_URI || "",
      client_id: process.env.LINKEDIN_CLIENT_ID || "",
      client_secret: process.env.LINKEDIN_SECRET_KEY || "",
    });

    const tokenResp = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    if (!tokenResp.ok) {
      const errText = await tokenResp.text();
      return res.status(400).send(`Token exchange failed: ${errText}`);
    }

    const tokenJson = await tokenResp.json();
    const accessToken = tokenJson.access_token as string;

    // After you get accessToken
    const userinfoResp = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const userinfo = await userinfoResp.json();
    return res.json({ token: tokenJson, userinfo });
    
  } catch (err: any) {
    return res.status(500).send(err.message || "Something went wrong");
  }
});


app.listen(8001, () => {
  console.log(`linkedin oauth server is running ${8001}`);
});

// https://www.linkedin.com/oauth/v2/authorization?%20response_type=code&%20client_id={your-client-id}&%20redirect_uri={your-redirect-uri}&%20scope=r_liteprofile%20r_emailaddress&%20state={random-state}
