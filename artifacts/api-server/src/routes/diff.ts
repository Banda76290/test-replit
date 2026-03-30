import { Router, type IRouter } from "express";
import { getDiffForAnalysis } from "../mocks/diffs";

const router: IRouter = Router();

router.get("/diff/:analysisId", (req, res) => {
  const diff = getDiffForAnalysis(req.params.analysisId);
  res.json(diff);
});

export default router;
