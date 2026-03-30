import { Router, type IRouter } from "express";
import { mockClients } from "../mocks/clients";
import { mockProjects } from "../mocks/projects";
import { mockAnalyses } from "../mocks/analyses";
import { mockActivities } from "../mocks/activities";

const router: IRouter = Router();

router.get("/dashboard/summary", (_req, res) => {
  res.json({
    welcomeMessage: "Welcome back, Alexandre",
    totalClients: mockClients.length,
    totalProjects: mockProjects.length,
    totalAnalyses: mockAnalyses.length,
    recentClients: mockClients.slice(0, 3),
    recentProjects: mockProjects.slice(0, 4),
    recentAnalyses: mockAnalyses.slice(0, 3),
    recentActivities: mockActivities.slice(0, 5),
    suggestedActions: [
      {
        label: "Review critical checkout fix",
        description: "NeoShop checkout crash requires immediate attention",
        link: "/workspace/prj-004",
      },
      {
        label: "Complete Apple Pay analysis",
        description: "Maison Éclat checkout redesign — finalize payment integration plan",
        link: "/workspace/prj-001",
      },
      {
        label: "Check shipping connector progress",
        description: "TechFlow Distribution — carrier integration update",
        link: "/workspace/prj-003",
      },
    ],
  });
});

export default router;
