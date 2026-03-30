import { Router, type IRouter } from "express";
import { getSourcesForAnalysis } from "../mocks/sources";

const router: IRouter = Router();

router.get("/sources/:analysisId", (req, res) => {
  const sources = getSourcesForAnalysis(req.params.analysisId);
  res.json(sources);
});

export default router;
