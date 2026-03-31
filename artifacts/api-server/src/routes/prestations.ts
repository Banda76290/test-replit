import { Router, type IRouter } from "express";
import { mockPrestations } from "../mocks/projects";

const router: IRouter = Router();

router.get("/prestations", (_req, res) => {
  res.json(mockPrestations);
});

router.get("/prestations/:id", (req, res) => {
  const prestation = mockPrestations.find((p) => p.id === req.params.id);
  if (!prestation) {
    res.status(404).json({ error: "Prestation not found" });
    return;
  }
  res.json(prestation);
});

export default router;
