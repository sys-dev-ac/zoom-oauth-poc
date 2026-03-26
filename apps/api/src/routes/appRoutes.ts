import { Router } from "express";
import envatoappRoutes from './envato/application/app';

const router = Router();

router.use("/envato", envatoappRoutes);

export default router;