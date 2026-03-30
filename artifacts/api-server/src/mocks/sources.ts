export const mockSources: Record<string, Array<{
  id: string;
  analysisId: string;
  type: string;
  category: string;
  title: string;
  date: string;
  origin: string;
  excerpt: string;
  relevanceScore: number;
}>> = {
  "ana-001": [
    {
      id: "src-001",
      analysisId: "ana-001",
      type: "source-code",
      category: "Code source",
      title: "CheckoutPaymentStep.tsx",
      date: "2026-03-15",
      origin: "GitLab — maison-eclat/checkout",
      excerpt: "Le composant actuel du step de paiement gère uniquement les paiements par carte via Stripe Elements. L'API Payment Request est importée mais pas encore initialisée.",
      relevanceScore: 0.95,
    },
    {
      id: "src-002",
      analysisId: "ana-001",
      type: "ticket",
      category: "Tickets support",
      title: "ECLAT-1892 : Utilisateurs mobiles demandant Apple Pay",
      date: "2026-03-10",
      origin: "Jira — File d'attente support",
      excerpt: "Plusieurs retours clients demandant le support Apple Pay. 23% des visiteurs mobiles abandonnent le checkout quand Apple Pay n'est pas disponible.",
      relevanceScore: 0.88,
    },
    {
      id: "src-003",
      analysisId: "ana-001",
      type: "commercial",
      category: "Données commerciales",
      title: "Rapport de conversion mobile T1 2026",
      date: "2026-03-20",
      origin: "Tableau de bord Analytics",
      excerpt: "Taux de conversion mobile à 2,1% contre 4,8% sur desktop. Les concurrents avec Apple Pay affichent 3,5% en mobile. L'écart représente une opportunité de 45 000 € de CA mensuel.",
      relevanceScore: 0.82,
    },
    {
      id: "src-004",
      analysisId: "ana-001",
      type: "reporting",
      category: "Historique des rapports",
      title: "Benchmark moyens de paiement 2026",
      date: "2026-02-28",
      origin: "Recherche interne",
      excerpt: "Le benchmark sectoriel montre que 35% des transactions mobiles de mode premium utilisent Apple Pay en France. L'adoption de Google Pay est à 12% et en croissance.",
      relevanceScore: 0.76,
    },
    {
      id: "src-005",
      analysisId: "ana-001",
      type: "checklist",
      category: "Checklists projet",
      title: "Checklist technique refonte checkout",
      date: "2026-03-01",
      origin: "Confluence",
      excerpt: "Point 14 : Intégration portefeuille numérique (Apple Pay, Google Pay) — Statut : En attente — Priorité : Haute — Dépendances : Mise à jour SDK Stripe.",
      relevanceScore: 0.91,
    },
    {
      id: "src-006",
      analysisId: "ana-001",
      type: "intervention",
      category: "Interventions passées",
      title: "Migration SDK Stripe (v12 → v14)",
      date: "2026-01-15",
      origin: "Journal de déploiement",
      excerpt: "Le SDK Stripe a été migré vers la v14 qui inclut le support de l'API Payment Request. La migration s'est terminée avec succès sans changements cassants.",
      relevanceScore: 0.85,
    },
  ],
  "ana-002": [
    {
      id: "src-007",
      analysisId: "ana-002",
      type: "source-code",
      category: "Code source",
      title: "PaymentFormValidator.tsx",
      date: "2026-03-28",
      origin: "GitLab — neoshop/checkout",
      excerpt: "Utilise IntersectionObserver pour détecter quand les champs du formulaire de paiement entrent dans le viewport pour une validation progressive. Les options de l'observer utilisent rootMargin avec des unités relatives au viewport.",
      relevanceScore: 0.97,
    },
    {
      id: "src-008",
      analysisId: "ana-002",
      type: "ticket",
      category: "Tickets support",
      title: "NST-2341 : Crash du checkout sur iPhone 15",
      date: "2026-03-29",
      origin: "Jira — Bugs critiques",
      excerpt: "Plus de 100 signalements de crash de la page checkout sur iPhone 15 avec Safari 17.4. Erreur : TypeError: undefined is not an object (evaluating 'e.isIntersecting').",
      relevanceScore: 0.98,
    },
    {
      id: "src-009",
      analysisId: "ana-002",
      type: "reporting",
      category: "Historique des rapports",
      title: "Rapport pic de taux d'erreur — 29 mars",
      date: "2026-03-29",
      origin: "Tableau de bord Sentry",
      excerpt: "Le taux d'erreur a bondi de 340% sur Safari mobile. 89% des erreurs proviennent de PaymentFormValidator.tsx ligne 47. Sessions affectées : 2 847 dans les dernières 24 heures.",
      relevanceScore: 0.96,
    },
  ],
  "ana-003": [
    {
      id: "src-010",
      analysisId: "ana-003",
      type: "source-code",
      category: "Code source",
      title: "ProductService.ts",
      date: "2026-03-20",
      origin: "GitLab — neoshop/catalog",
      excerpt: "Le service produit actuel retourne des données de catalogue statiques. Aucune logique de personnalisation n'existe. Les résolveurs GraphQL supportent le tri personnalisé mais pas le classement basé sur le ML.",
      relevanceScore: 0.88,
    },
    {
      id: "src-011",
      analysisId: "ana-003",
      type: "commercial",
      category: "Données commerciales",
      title: "Analyse comportementale utilisateurs — Mars 2026",
      date: "2026-03-25",
      origin: "Mixpanel",
      excerpt: "Session moyenne : 4,2 pages consultées. La découverte produit se fait principalement via la recherche (62%) et la navigation par catégorie (31%). Seulement 7% utilisent la section « recommandé pour vous ».",
      relevanceScore: 0.84,
    },
  ],
  "ana-004": [
    {
      id: "src-012",
      analysisId: "ana-004",
      type: "source-code",
      category: "Code source",
      title: "CarrierAdapter.ts",
      date: "2026-03-22",
      origin: "GitLab — techflow/shipping",
      excerpt: "Adaptateur transporteur abstrait avec méthodes : getRates(), generateLabel(), getTracking(). Implémente actuellement les adaptateurs DHL, UPS et FedEx.",
      relevanceScore: 0.93,
    },
    {
      id: "src-013",
      analysisId: "ana-004",
      type: "intervention",
      category: "Interventions passées",
      title: "Déploiement de l'intégration FedEx",
      date: "2026-02-10",
      origin: "Journal de déploiement",
      excerpt: "L'adaptateur FedEx a été implémenté et déployé en 4 jours dev. Utilise le même pattern adaptateur. Précision du calcul tarifaire : 99,2%. Zéro incident post-déploiement.",
      relevanceScore: 0.87,
    },
  ],
};

export function getSourcesForAnalysis(analysisId: string) {
  return mockSources[analysisId] || mockSources["ana-001"];
}
