import express from "express";
import cors from "cors";
import connectZoomRouter from "./routes/connectZoom";
import zoomRouter from "./routes/zoom";
import dotenv from "dotenv";
dotenv.config();

const app = express();

app.use(cors({ origin: true }));
app.use(express.json());

app.use("/connectZoom", connectZoomRouter);
app.use("/zoom", zoomRouter);

app.listen(8000, () => {
  console.log("Server is running on port 8000");
});
