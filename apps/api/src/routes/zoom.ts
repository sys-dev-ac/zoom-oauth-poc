import { Router, Request, Response } from "express";
import { getAnyZoomCredentials } from "../zoomStore";
import {
  getOrRefreshCredentials,
  clearZoomUser,
  getBasicAuth,
} from "../zoomAuth";

const router: Router = Router();
const ZOOM_API_BASE = "https://api.zoom.us/v2";

/** Get OAuth authorize URL for Connect Zoom link */
router.get("/auth-url", (_req: Request, res: Response) => {
  const clientId = process.env.ZOOM_API_KEY;
  const redirectUri = process.env.ZOOM_REDIRECT_URL;
  if (!clientId || !redirectUri) {
    return res.status(500).json({ error: "Zoom env not configured" });
  }
  const url = `https://zoom.us/oauth/authorize?response_type=code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}`;
  return res.json({ url });
});

/** Get current Zoom connection (POC: returns first stored) */
router.get("/connection", (_req: Request, res: Response) => {
  const creds = getAnyZoomCredentials();
  if (!creds) return res.status(404).json({ error: "No Zoom connection" });
  return res.json({
    email: creds.email,
    account_id: creds.account_id,
  });
});

/** Refresh token (optional standalone endpoint) */
router.post("/refresh", async (req: Request, res: Response) => {
  try {
    const accountId = (req.body?.account_id as string) ?? getAnyZoomCredentials()?.account_id;
    if (!accountId) return res.status(400).send("account_id required");
    const creds = await getOrRefreshCredentials(accountId);
    return res.json({ success: true, expires_at: creds.expires_at });
  } catch (e) {
    console.error("Refresh error", e);
    return res.status(401).send("Could not connect with Zoom");
  }
});

/** Create meeting */
router.post("/meetings", async (req: Request, res: Response) => {
  try {
    const accountId = (req.body?.account_id as string) ?? getAnyZoomCredentials()?.account_id;
    if (!accountId) return res.status(400).json({ error: "No Zoom connection or account_id" });

    const creds = await getOrRefreshCredentials(accountId);
    const { topic, agenda, start_time, duration } = req.body ?? {};

    const resZoom = await fetch(`${ZOOM_API_BASE}/users/${encodeURIComponent(creds.account_id)}/meetings`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${creds.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        topic: topic ?? "Meeting",
        agenda: agenda ?? "",
        start_time: start_time ?? new Date().toISOString(),
        duration: duration ?? 60,
        type: 2,
      }),
    });

    if (!resZoom.ok) {
      const err = await resZoom.text();
      return res.status(resZoom.status).json({ error: err || "Failed to create meeting" });
    }

    const meeting = await resZoom.json();
    return res.json(meeting);
  } catch (e) {
    console.error("Create meeting error", e);
    return res.status(500).send("Something went wrong");
  }
});

/** Update meeting */
router.patch("/meetings/:meetingId", async (req: Request, res: Response) => {
  try {
    const meetingId = req.params.meetingId;
    const accountId = (req.body?.account_id as string) ?? getAnyZoomCredentials()?.account_id;
    if (!accountId) return res.status(400).json({ error: "No Zoom connection or account_id" });

    const creds = await getOrRefreshCredentials(accountId);
    const updates = { ...req.body };
    delete updates.account_id;

    const resZoom = await fetch(`${ZOOM_API_BASE}/meetings/${meetingId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${creds.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    });

    if (!resZoom.ok) {
      const err = await resZoom.text();
      return res.status(resZoom.status).json({ error: err || "Failed to update meeting" });
    }
    return res.status(204).send();
  } catch (e) {
    console.error("Update meeting error", e);
    return res.status(500).send("Something went wrong");
  }
});

/** Delete meeting */
router.delete("/meetings/:meetingId", async (req: Request, res: Response) => {
  try {
    const meetingId = req.params.meetingId;
    const accountId = (req.query.account_id as string) ?? getAnyZoomCredentials()?.account_id;
    if (!accountId) return res.status(400).json({ error: "No Zoom connection or account_id" });

    const creds = await getOrRefreshCredentials(accountId);

    const resZoom = await fetch(`${ZOOM_API_BASE}/meetings/${meetingId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${creds.access_token}` },
    });

    if (!resZoom.ok && resZoom.status !== 204) {
      const err = await resZoom.text();
      return res.status(resZoom.status).json({ error: err || "Failed to delete meeting" });
    }
    return res.status(204).send();
  } catch (e) {
    console.error("Delete meeting error", e);
    return res.status(500).send("Something went wrong");
  }
});

/** List meetings (for UI) */
router.get("/meetings", async (req: Request, res: Response) => {
  try {
    const accountId = (req.query.account_id as string) ?? getAnyZoomCredentials()?.account_id;
    if (!accountId) return res.status(400).json({ error: "No Zoom connection or account_id" });

    const creds = await getOrRefreshCredentials(accountId);

    const resZoom = await fetch(
      `${ZOOM_API_BASE}/users/${encodeURIComponent(creds.email)}/meetings?type=scheduled`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${creds.access_token}` },
      }
    );

    if (!resZoom.ok) {
      const err = await resZoom.text();
      return res.status(resZoom.status).json({ error: err || "Failed to list meetings" });
    }
    const data = await resZoom.json();
    return res.json(data.meetings ?? []);
  } catch (e) {
    console.error("List meetings error", e);
    return res.status(500).send("Something went wrong");
  }
});

/** Deauthorization endpoint (Zoom app compliance) */
router.post("/deauthorize", async (req: Request, res: Response) => {
  try {
    const payload = req.body?.payload ?? req.body;
    const accountId = payload?.account_id;
    const userDataRetention = req.body?.user_data_retention !== false;

    if (accountId && !userDataRetention) {
      clearZoomUser(accountId);
    }

    await fetch("https://api.zoom.us/oauth/data/compliance", {
      method: "POST",
      headers: {
        Authorization: `Basic ${getBasicAuth()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: process.env.ZOOM_API_KEY,
        user_id: payload?.user_id,
        account_id: payload?.account_id,
        deauthorization_event_received: payload,
        compliance_completed: true,
      }),
    });

    return res.status(200).send();
  } catch (e) {
    console.error("Zoom deauthorize event error", e);
    return res.status(200).send(); // Zoom expects 200 to acknowledge
  }
});

export default router;
