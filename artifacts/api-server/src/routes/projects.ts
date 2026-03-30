import { Router, type IRouter } from "express";
import { mockProjects } from "../mocks/projects";

const router: IRouter = Router();

router.get("/projects/:id", (req, res) => {
  const project = mockProjects.find((p) => p.id === req.params.id);
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  res.json(project);
});

export default router;
