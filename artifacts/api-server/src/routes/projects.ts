import { Router, type IRouter } from "express";
import { mockProjets } from "../mocks/projets";
import { mockPrestations } from "../mocks/projects";

const router: IRouter = Router();

router.get("/projects/:id/prestations", (req, res) => {
  const prestations = mockPrestations.filter((p) => p.projectId === req.params.id);
  res.json(prestations);
});

router.get("/projects/:id", (req, res) => {
  const projet = mockProjets.find((p) => p.id === req.params.id);
  if (!projet) {
    res.status(404).json({ error: "Projet not found" });
    return;
  }
  res.json(projet);
});

export default router;
