import { Router, type IRouter } from "express";
import { mockAnalyses, generateAnalysisResult } from "../mocks/analyses";

const router: IRouter = Router();

router.post("/analysis/run", (req, res) => {
  const { prestationId, projectId, taskType, prompt, documentName } = req.body;
  const result = generateAnalysisResult(taskType, prestationId || projectId, projectId, prompt);
  res.json(result);
});

router.get("/analysis/history", (req, res) => {
  let result = [...mockAnalyses];
  const clientId = req.query.clientId as string | undefined;
  const projectId = req.query.projectId as string | undefined;
  const taskType = req.query.taskType as string | undefined;
  const status = req.query.status as string | undefined;

  if (clientId) result = result.filter((a) => a.clientId === clientId);
  if (projectId) result = result.filter((a) => a.projectId === projectId);
  if (taskType) result = result.filter((a) => a.taskType === taskType);
  if (status) result = result.filter((a) => a.status === status);

  res.json(result);
});

router.get("/analysis/:id", (req, res) => {
  const analysis = mockAnalyses.find((a) => a.id === req.params.id);
  if (!analysis) {
    res.status(404).json({ error: "Analysis not found" });
    return;
  }
  res.json(analysis);
});

router.post("/analysis/:id/feedback", (req, res) => {
  res.json({ success: true });
});

export default router;
