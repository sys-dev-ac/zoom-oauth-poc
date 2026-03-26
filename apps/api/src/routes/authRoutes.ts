import { Router } from "express";
import figmaAuthRouter from './figma/application/app';
import envatoRouter from './envato/envatoApi';
const router = Router();

router.use("",envatoRouter)
router.use("", figmaAuthRouter);

export default router;
