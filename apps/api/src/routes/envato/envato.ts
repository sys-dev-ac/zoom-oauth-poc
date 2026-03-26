import { Router } from "express";

const router: Router = Router();
import dotenv from 'dotenv';

dotenv.config();

router.get("/envato", (req, res) => {

  const url = `https://api.envato.com/authorization?${new URLSearchParams({
    response_type: "code",
    client_id: process.env.ENVATO_CLIENT_ID || "",
    redirect_uri: process.env.ENVATO_REDIRECT_URL || "",
  }).toString()}`;

  res.redirect(url);
});


export default router;