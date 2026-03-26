import { Router, Request, Response } from "express";
import dotenv from "dotenv";
import { saveToken } from "../../../db/tokens";
import { createEnvatoOAuth, getEnvatoClient } from "../../../helper/envatoAuth";
import {
  HttpError,
  type DownloadLinkOptions,
  type ItemSearchOptions,
  type MarketDomain,
} from "envato";

dotenv.config();

const router: Router = Router();

router.get("/callback", async (req, res) => {
  const codeParam = req.query.code;
  const code = Array.isArray(codeParam) ? codeParam[0] : codeParam;

  if (!code || typeof code !== "string") {
    return res.status(400).send("Missing code");
  }

  try {
    const oauth = createEnvatoOAuth();
    const client = await oauth.getClient(code);

    const username = await client.private.getUsername();
    const exp = client.expiration;
    const expiresAtUnixSeconds =
      exp instanceof Date
        ? Math.floor(exp.getTime() / 1000)
        : typeof exp === "number"
          ? Math.floor(exp / 1000)
          : Math.floor(Date.now() / 1000) + 3600;

    await saveToken({
      email: username,
      access_token: client.token,
      expires_in: expiresAtUnixSeconds,
      refresh_token: client.refreshToken ?? "",
      refresh_token_expires_in: 0,
      connection_type: "envato",
    });

    const { userId, scopes } = await client.getIdentity();

    return res.status(200).json({
      username,
      userId,
      scopes,
    });
  } catch (e) {
    console.error("Envato OAuth callback error", e);
    return res.status(400).send(
      e instanceof Error ? e.message : "Envato authentication failed"
    );
  }
});


/**
 * Public catalog search (uses the connected user's OAuth token; Envato still requires authorization).
 * Query: term, site, page, page_size, etc. — passed through to client.catalog.searchItems.
 */
router.get("/catalog/search", async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    
    const client = await getEnvatoClient(userId as string);
    
    if (!client) {
      return res.status(400).json({ error: "No Envato connection" });
    }

    const q = req.query;

    const searchOpts: ItemSearchOptions = {};
    if (typeof q.term === "string") searchOpts.term = q.term;
    if (typeof q.site === "string") searchOpts.site = q.site as MarketDomain;
    if (q.page !== undefined) {
      const pageNum = Number(q.page);
      if (Number.isFinite(pageNum)) searchOpts.page = pageNum;
    }
    if (q.page_size !== undefined) {
      const ps = Number(q.page_size);
      if (Number.isFinite(ps)) searchOpts.page_size = ps;
    }
    if (typeof q.sort_by === "string") {
      searchOpts.sort_by = q.sort_by as NonNullable<ItemSearchOptions["sort_by"]>;
    }
    if (typeof q.sort_direction === "string") {
      searchOpts.sort_direction = q.sort_direction as "asc" | "desc";
    }
    if (typeof q.category === "string") searchOpts.category = q.category;
    if (typeof q.username === "string") searchOpts.username = q.username;

    const response = await client.catalog.searchItems(searchOpts);

    return res.json(response);
  } catch (e) {
    console.error("Envato catalog search error", e);
    if (e instanceof HttpError) {
      return res.status(e.code ?? 500).json({
        error: e.message,
        details: e.response,
      });
    }
    return res.status(500).json({ error: "Catalog search failed" });
  }
});

/**
 * One-time download link for a purchase (private API). Body JSON: { item_id?: number, purchase_code?: string }.
 * Counts against the item's daily download limit.
 */
router.post("/private/download-link", async (req: Request, res: Response) => {
  try {
    const client = await getEnvatoClient();
    if (!client) {
      return res.status(400).json({ error: "No Envato connection" });
    }

    const item_id = req.body?.item_id as number | undefined;
    const purchase_code = req.body?.purchase_code as string | undefined;
    if (
      (item_id === undefined || item_id === null) &&
      (purchase_code === undefined || purchase_code === "")
    ) {
      return res.status(400).json({ error: "item_id or purchase_code required" });
    }

    const dl: DownloadLinkOptions = {};
    if (item_id !== undefined && item_id !== null) dl.item_id = item_id;
    if (purchase_code) dl.purchase_code = purchase_code;

    const url = await client.private.getDownloadLink(dl);

    return res.json({ url });
  } catch (e) {
    console.error("Envato download link error", e);
    if (e instanceof HttpError) {
      return res.status(e.code ?? 500).json({
        error: e.message,
        details: e.response,
      });
    }
    return res.status(500).json({ error: "Download link failed" });
  }
});


/** Purchased items list for the connected Envato user */
router.get("/purchases", async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;

    
    const client = await getEnvatoClient(userId as string);
    
    if (!client) {
      return res.status(400).json({ error: "No Envato connection" });
    }

    const purchases = await client.private.getPurchases({
      include_all_item_details: true
    });

    if (!purchases) {
      return res
        .status(500)
        .json({ error: "Envato purchases request failed" });
    }

    return res.json(purchases);
  } catch (e) {
    console.error("Envato purchases error", e);
    return res.status(500).json({ error: "Failed to fetch purchases" });
  }
});

export default router;
