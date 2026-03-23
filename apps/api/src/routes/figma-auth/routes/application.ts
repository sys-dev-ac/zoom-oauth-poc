import { Router } from "express";
import { DBclient } from "../../../db/client";

const router: Router = Router();

router.get("/files/:key", async (req, res) => {
  const db = new DBclient();
  

});


export {
  router as figmaApprouter 
}