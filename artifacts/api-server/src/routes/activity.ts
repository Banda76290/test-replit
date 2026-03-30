import { Router, type IRouter } from "express";
import { mockActivities } from "../mocks/activities";

const router: IRouter = Router();

router.get("/activity", (_req, res) => {
  res.json(mockActivities);
});

export default router;
