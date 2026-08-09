import { Router, type IRouter } from "express";
import healthRouter from "./health";
import occupationsRouter from "./occupations";
import injuriesRouter from "./injuries";

const router: IRouter = Router();

router.use(healthRouter);
router.use(occupationsRouter);
router.use(injuriesRouter);

export default router;
