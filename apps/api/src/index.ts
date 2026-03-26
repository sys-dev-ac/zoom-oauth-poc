import express from "express";
import cors from "cors";
import zoomConnectRouter from "./routes/zoom/application/app";
import zoomApiRouter from "./routes/zoom/zoomApi";
import authRouter from "./routes/authRoutes";
import appRouter from "./routes/appRoutes";

import dotenv from "dotenv";
import { DBclient } from "./db/client";
dotenv.config();

const app = express();

app.use(cors({ origin: true }));
app.use(express.json());
app.use("/auth", authRouter);
app.use("", appRouter);

app.get("/get-all-token", async (req, res) => {
  const db = new DBclient();
  await db.connect();

  const client = db.getClient();

  const tokens = await client.query("SELECT * FROM oauthtoken");

  res.status(200).send({
    data: tokens.rows,
  });
});

app.use("/connectZoom", zoomConnectRouter);
app.use("/zoom", zoomApiRouter);

app.listen(8000, () => {
  console.log("Server is running on port 8000");
});
