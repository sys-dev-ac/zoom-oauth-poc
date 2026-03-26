import { Router, Request, Response } from "express";
import { createEnvatoOAuth, getEnvatoClient } from "../../helper/envatoAuth";
import { getTokenByConnectionType } from "../../db/tokens";

const router: Router = Router();

/** OAuth authorize URL (same idea as GET /zoom/auth-url) */
router.get("/envato", (_req: Request, res: Response) => {
  try {
    const oauth = createEnvatoOAuth();
    return res.redirect(oauth.getRedirectUrl());
  } catch {
    return res.status(500).json({ error: "Envato env not configured" });
  }
});

/** Current Envato connection (POC: first envato row in oauthtoken) */
router.get("/connection", async (_req: Request, res: Response) => {
  const { userId } = _req.params;
  const row = await getTokenByConnectionType("envato");
  if (!row) return res.status(404).json({ error: "No Envato connection" });
  return res.json({ username: row.email });
});




export default router;
