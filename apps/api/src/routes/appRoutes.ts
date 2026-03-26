import { Router } from "express";
import envatoappRoutes from './envato/application/app';
import figmaApprouter from './figma/figmaApi';

const router = Router();

router.use("/envato", envatoappRoutes);
router.use("/figma", figmaApprouter)

export default router;