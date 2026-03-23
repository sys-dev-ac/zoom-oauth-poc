import express from "express";
import cors from "cors";
import connectZoomRouter from "./routes/connectZoom";
import zoomRouter from "./routes/zoom";
import figmaRouter from './routes/figma-auth/figma';

import dotenv from "dotenv";
import { createTokenTable } from "./db/tokens";
import { DBclient } from "./db/client";
dotenv.config();

const app = express();

app.use(cors({ origin: true }));
app.use(express.json());
app.use("", figmaRouter);

app.get("/get-all-token",async (req,res) =>{
  const db = new DBclient();
  await db.connect();

  const client = db.getClient();
  
  const tokens = await client.query('SELECT * FROM oauthtoken')
  
  res.status(200).send( {
    data : tokens.rows[0]
  })
})

app.use("/connectZoom", connectZoomRouter);
app.use("/zoom", zoomRouter);

app.listen(8000, () => {
  console.log("Server is running on port 8000");
});

// createTokenTable().then(() => {
//   console.log("table is created");
// })