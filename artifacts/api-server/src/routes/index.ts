import { Router, type IRouter } from "express";
import healthRouter from "./health";
import occupationsRouter from "./occupations";
import injuriesRouter from "./injuries";
import intelligenceRouter from "./intelligence";
import publicMedicalRouter from "./publicMedical";

const router: IRouter = Router();

router.use(healthRouter);
router.use(occupationsRouter);
router.use(injuriesRouter);
router.use(intelligenceRouter);
router.use(publicMedicalRouter);

export default router;
