import { Router } from "express";

const router: Router = Router();
import dotenv from 'dotenv';
import { saveToken } from "../../db/tokens";

dotenv.config();

router.get("/auth/envato", (req, res) => {

  const url = `https://api.envato.com/authorization?${new URLSearchParams({
    response_type: "code",
    client_id: process.env.ENVATO_CLIENT_ID || "",
    redirect_uri: process.env.ENVATO_REDIRECT_URL || "",
  }).toString()}`;

  res.redirect(url);
});

router.get("/envato/callback", async (req, res) => {
  const codeParam = req.query.code;
  
  const code = Array.isArray(codeParam) ? codeParam[0] : codeParam;
  
  if (!code || typeof code !== "string") {
    return res.status(400).send("Missing code");
  }
  
  // Get the access token from the figma api token 
  // Note: the above will will be active only for 30 seconds
  // Exchange code for access token
  // const params = new URLSearchParams({
  //   grant_type: "authorization_code",
  //   code,
  //   redirect_uri: process.env.FIGMA_REDIRECT_URL || "",
  //   client_id: process.env.FIGMA_CLIENT_ID || "",
  //   client_secret: process.env.FIGMA_SECRET_CLIENT || "",
  // });
  
 
  
  // await saveToken({
  //   email: tokenJson.user_id_string,
  //   access_token: tokenJson.access_token,
  //   expires_in: tokenJson.expires_in,
  //   refresh_token: tokenJson.refresh_token,
  //   refresh_token_expires_in: tokenJson.expires_in,
  //   connection_type: "figma"
  // });
  
  res.status(200).send({
    code
  })
})

export default router;