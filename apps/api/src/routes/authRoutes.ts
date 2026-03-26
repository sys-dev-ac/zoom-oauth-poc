import { Router } from "express";
import envatoRoutes from './envato/envato';

const router = Router();

router.use("", envatoRoutes);

export default router;