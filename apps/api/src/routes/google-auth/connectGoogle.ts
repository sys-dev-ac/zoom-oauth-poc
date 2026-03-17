import { Router, Request, Response } from "express";

const router: Router = Router();

router.post("/", async (req: Request, res: Response) => {
  try {
    const code = req.body?.code as string | undefined;

    return res.json({
    });
  } catch (e) {
    console.error("Connect google error", e);
    return res.status(401).send("Could not connect with google");
  }
});

export default router;
