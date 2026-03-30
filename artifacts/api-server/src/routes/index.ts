import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import dashboardRouter from "./dashboard";
import clientsRouter from "./clients";
import projectsRouter from "./projects";
import prestationsRouter from "./prestations";
import analysisRouter from "./analysis";
import sourcesRouter from "./sources";
import diffRouter from "./diff";
import activityRouter from "./activity";
import preferencesRouter from "./preferences";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(dashboardRouter);
router.use(clientsRouter);
router.use(projectsRouter);
router.use(prestationsRouter);
router.use(analysisRouter);
router.use(sourcesRouter);
router.use(diffRouter);
router.use(activityRouter);
router.use(preferencesRouter);
router.use(adminRouter);

export default router;
