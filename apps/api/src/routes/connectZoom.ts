import { Router, Request, Response } from "express";
import { exchangeCodeForTokens } from "../zoomAuth";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  try {
    const code = req.body?.code as string | undefined;
    const redirectUri = process.env.ZOOM_REDIRECT_URL;

    if (!code || !redirectUri) {
      return res.status(400).send("Missing code or ZOOM_REDIRECT_URL");
    }

    const { email, account_id } = await exchangeCodeForTokens(code, redirectUri);

    return res.json({
      success: true,
      email,
      account_id,
    });
  } catch (e) {
    console.error("Connect Zoom error", e);
    return res.status(401).send("Could not connect with Zoom");
  }
});

export default router;
