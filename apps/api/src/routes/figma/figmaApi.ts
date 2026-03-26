import { Router } from "express";
import { getTokenByEmail } from "../../db/tokens";

const router: Router = Router();

router.get("/files/:key", async (req, res) => {
  const { email } = req.body;
  const { key } = req.params;
  const ids = req.query.ids;

  const user = await getTokenByEmail(email);

  if (!user) {
    return res.status(404).send({
      message: "user not found",
    });
  }

  const filesResponse = await fetch(`https://api.figma.com/v1/files/${key}?ids=${ids}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${user.access_token}`,
    },
  });

  if (filesResponse.status === 429) {
    const upgradeUrl = filesResponse.headers.get("x-figma-upgrade-link") || null;
    const retryAfterSec = Number(filesResponse.headers.get("retry-after")) || null;
    return res.status(429).json({ error: "rate_limited", upgradeUrl, retryAfterSec });
  }

  const data = await filesResponse.json();

  res.status(200).send({
    data,
  });
});

export default router;
