import { Router, type IRouter } from "express";
import { mockClients } from "../mocks/clients";
import { mockPrestations } from "../mocks/projects";
import { mockAnalyses } from "../mocks/analyses";
import { mockActivities } from "../mocks/activities";

const router: IRouter = Router();

router.get("/dashboard/summary", (_req, res) => {
  res.json({
    welcomeMessage: "Bon retour, Alexandre",
    totalClients: mockClients.length,
    totalProjects: mockPrestations.length,
    totalAnalyses: mockAnalyses.length,
    recentClients: mockClients.slice(0, 3),
    recentProjects: mockPrestations.slice(0, 4),
    recentAnalyses: mockAnalyses.slice(0, 3),
    recentActivities: mockActivities.slice(0, 5),
    suggestedActions: [
      {
        label: "Examiner le correctif checkout critique",
        description: "Le crash checkout NeoShop nécessite une attention immédiate",
        link: "/workspace/pre-004",
      },
      {
        label: "Finaliser l'analyse Apple Pay",
        description: "Refonte checkout Maison Éclat — finaliser le plan d'intégration paiement",
        link: "/workspace/pre-001",
      },
      {
        label: "Vérifier l'avancement du connecteur d'expédition",
        description: "TechFlow Distribution — mise à jour de l'intégration transporteurs",
        link: "/workspace/pre-003",
      },
    ],
  });
});

export default router;
