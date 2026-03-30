import { Router, type IRouter } from "express";
import { mockClients } from "../mocks/clients";
import { mockProjects } from "../mocks/projects";

const router: IRouter = Router();

router.get("/clients", (req, res) => {
  let result = [...mockClients];
  const search = req.query.search as string | undefined;
  const sector = req.query.sector as string | undefined;
  const status = req.query.status as string | undefined;

  if (search) {
    const lower = search.toLowerCase();
    result = result.filter(
      (c) =>
        c.name.toLowerCase().includes(lower) ||
        c.sector.toLowerCase().includes(lower)
    );
  }
  if (sector) {
    result = result.filter((c) => c.sector.toLowerCase().includes(sector.toLowerCase()));
  }
  if (status) {
    result = result.filter((c) => c.contractStatus === status);
  }

  res.json(result);
});

router.get("/clients/:id/projects", (req, res) => {
  const projects = mockProjects.filter((p) => p.clientId === req.params.id);
  res.json(projects);
});

export default router;
