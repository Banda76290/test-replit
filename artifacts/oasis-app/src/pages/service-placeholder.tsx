import { useLocation } from "wouter";
import { AppLayout } from "@/components/layout";
import { useService } from "@/hooks/use-service";
import { SERVICES } from "@/lib/service-config";
import { Button } from "@/components/ui/button";
import { Clock, ArrowLeft, Sparkles } from "lucide-react";
import { Link } from "wouter";

export default function ServicePlaceholderPage() {
  const [location] = useLocation();
  const { activeService } = useService();

  const navItem = activeService.nav.find((item) =>
    item.startsWith
      ? location.startsWith(item.href)
      : location === item.href
  );

  const ServiceIcon = activeService.icon;
  const ModuleIcon = navItem?.icon;

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto py-16 flex flex-col items-center text-center">
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border mb-8 ${activeService.badgeClass}`}>
          <ServiceIcon className="h-3.5 w-3.5" />
          {activeService.label}
        </div>

        <div className="w-20 h-20 rounded-2xl bg-muted/40 border border-border flex items-center justify-center mb-6 relative">
          {ModuleIcon && <ModuleIcon className="h-9 w-9 text-muted-foreground" />}
          <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-amber-400 flex items-center justify-center shadow-sm">
            <Clock className="h-3.5 w-3.5 text-white" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-3">
          {navItem?.label ?? "Module"}
        </h1>

        <div className="flex items-center gap-2 mb-6">
          <span className="px-2.5 py-1 rounded-full bg-amber-400/15 text-amber-600 dark:text-amber-400 text-xs font-semibold border border-amber-400/30">
            Bientôt disponible
          </span>
        </div>

        {navItem?.placeholderDesc ? (
          <p className="text-muted-foreground leading-relaxed mb-10 max-w-md">
            {navItem.placeholderDesc}
          </p>
        ) : (
          <p className="text-muted-foreground leading-relaxed mb-10 max-w-md">
            Ce module est en cours de développement. Il sera disponible dans une prochaine version d'OASIS Projet.
          </p>
        )}

        <div className="w-full max-w-sm bg-card border border-border rounded-xl p-5 text-left mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Au programme</span>
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {getComingSoonFeatures(navItem?.href ?? "").map((f, i) => (
              <li key={i} className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        <Link href="/">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Retour au tableau de bord
          </Button>
        </Link>
      </div>
    </AppLayout>
  );
}

function getComingSoonFeatures(href: string): string[] {
  const features: Record<string, string[]> = {
    "/commercial/propositions": [
      "Éditeur de propositions avec modèles OASIS",
      "Suivi des statuts (brouillon, envoyée, acceptée, refusée)",
      "Génération PDF avec signature électronique",
    ],
    "/commercial/contrats": [
      "Bibliothèque de modèles contractuels",
      "Alertes d'échéance et de renouvellement automatiques",
      "Historique des versions et piste d'audit",
    ],
    "/commercial/rapports": [
      "Tableau de bord du pipeline commercial",
      "Évolution du CA mensuel et par commercial",
      "Export vers Excel et intégration CRM",
    ],
    "/service-client/tickets": [
      "Création et attribution automatique des tickets",
      "Niveaux de priorité et SLA configurables",
      "Historique et fil de discussion par ticket",
    ],
    "/service-client/communications": [
      "Boîte de réception unifiée multi-canal",
      "Réponses automatiques et modèles de messages",
      "Indicateurs de délai de réponse moyen",
    ],
    "/service-client/suivi": [
      "Fiche client avec historique 360°",
      "Score NPS et indicateurs de satisfaction",
      "Alertes sur clients à risque",
    ],
    "/service-client/base-connaissance": [
      "Articles classés par thématique et service",
      "Recherche plein texte avec IA",
      "Contributions et revue par les équipes",
    ],
    "/projet/projets": [
      "Vue kanban et liste des projets actifs",
      "Suivi des livrables et jalons clés",
      "Alertes de dérive de planning et de budget",
    ],
    "/projet/planning": [
      "Diagramme de Gantt interactif",
      "Gestion des dépendances entre tâches",
      "Synchronisation avec les outils externes (Jira, Linear)",
    ],
    "/projet/ressources": [
      "Tableau de charge par membre d'équipe",
      "Affectation glisser-déposer aux projets",
      "Prévisions de capacité sur 3 mois glissants",
    ],
    "/projet/rapports": [
      "Rapport d'avancement hebdomadaire automatisé",
      "Suivi budgétaire et estimation à terminaison",
      "Export client en PDF ou PowerPoint",
    ],
    "/direction/synthese": [
      "KPIs consolidés de tous les services en temps réel",
      "Comparaison mensuelle et tendances",
      "Alertes intelligentes sur les écarts significatifs",
    ],
  };
  return features[href] ?? [
    "Interface adaptée aux besoins du service",
    "Intégration avec les autres modules OASIS",
    "Tableaux de bord et rapports personnalisables",
  ];
}
