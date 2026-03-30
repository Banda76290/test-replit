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
      category: "Source Code",
      title: "CheckoutPaymentStep.tsx",
      date: "2026-03-15",
      origin: "GitLab — maison-eclat/checkout",
      excerpt: "Current payment step component handles card-only payments via Stripe Elements. Payment Request API is imported but not yet initialized.",
      relevanceScore: 0.95,
    },
    {
      id: "src-002",
      analysisId: "ana-001",
      type: "ticket",
      category: "Support Tickets",
      title: "ECLAT-1892: Mobile users requesting Apple Pay",
      date: "2026-03-10",
      origin: "Jira — Support Queue",
      excerpt: "Multiple customer feedback entries requesting Apple Pay support. 23% of mobile visitors abandon checkout when Apple Pay is unavailable.",
      relevanceScore: 0.88,
    },
    {
      id: "src-003",
      analysisId: "ana-001",
      type: "commercial",
      category: "Commercial Data",
      title: "Q1 2026 Mobile Conversion Report",
      date: "2026-03-20",
      origin: "Analytics Dashboard",
      excerpt: "Mobile conversion rate is 2.1% vs desktop 4.8%. Apple Pay-enabled competitors show 3.5% mobile conversion. Gap represents €45K monthly revenue opportunity.",
      relevanceScore: 0.82,
    },
    {
      id: "src-004",
      analysisId: "ana-001",
      type: "reporting",
      category: "Reporting History",
      title: "Payment Methods Benchmark 2026",
      date: "2026-02-28",
      origin: "Internal Research",
      excerpt: "Industry benchmark shows 35% of premium fashion mobile transactions use Apple Pay in France. Google Pay adoption at 12% and growing.",
      relevanceScore: 0.76,
    },
    {
      id: "src-005",
      analysisId: "ana-001",
      type: "checklist",
      category: "Project Checklists",
      title: "Checkout Redesign Technical Checklist",
      date: "2026-03-01",
      origin: "Confluence",
      excerpt: "Item 14: Digital wallet integration (Apple Pay, Google Pay) — Status: Pending — Priority: High — Dependencies: Stripe SDK update.",
      relevanceScore: 0.91,
    },
    {
      id: "src-006",
      analysisId: "ana-001",
      type: "intervention",
      category: "Past Interventions",
      title: "Stripe SDK Migration (v12 → v14)",
      date: "2026-01-15",
      origin: "Deployment Log",
      excerpt: "Stripe SDK was migrated to v14 which includes Payment Request API support. Migration completed successfully with no breaking changes.",
      relevanceScore: 0.85,
    },
  ],
  "ana-002": [
    {
      id: "src-007",
      analysisId: "ana-002",
      type: "source-code",
      category: "Source Code",
      title: "PaymentFormValidator.tsx",
      date: "2026-03-28",
      origin: "GitLab — neoshop/checkout",
      excerpt: "Uses IntersectionObserver to detect when payment form fields enter viewport for progressive validation. Observer options use rootMargin with viewport-relative units.",
      relevanceScore: 0.97,
    },
    {
      id: "src-008",
      analysisId: "ana-002",
      type: "ticket",
      category: "Support Tickets",
      title: "NST-2341: Checkout crash on iPhone 15",
      date: "2026-03-29",
      origin: "Jira — Critical Bugs",
      excerpt: "100+ reports of checkout page crashing on iPhone 15 with Safari 17.4. Error: TypeError: undefined is not an object (evaluating 'e.isIntersecting').",
      relevanceScore: 0.98,
    },
    {
      id: "src-009",
      analysisId: "ana-002",
      type: "reporting",
      category: "Reporting History",
      title: "Error Rate Spike Report — March 29",
      date: "2026-03-29",
      origin: "Sentry Dashboard",
      excerpt: "Error rate spiked 340% on mobile Safari. 89% of errors originate from PaymentFormValidator.tsx line 47. Affected sessions: 2,847 in last 24 hours.",
      relevanceScore: 0.96,
    },
  ],
  "ana-003": [
    {
      id: "src-010",
      analysisId: "ana-003",
      type: "source-code",
      category: "Source Code",
      title: "ProductService.ts",
      date: "2026-03-20",
      origin: "GitLab — neoshop/catalog",
      excerpt: "Current product service returns static catalog data. No personalization logic exists. GraphQL resolvers support custom sorting but not ML-based ranking.",
      relevanceScore: 0.88,
    },
    {
      id: "src-011",
      analysisId: "ana-003",
      type: "commercial",
      category: "Commercial Data",
      title: "User Behavior Analytics — March 2026",
      date: "2026-03-25",
      origin: "Mixpanel",
      excerpt: "Average session: 4.2 pages viewed. Product discovery primarily through search (62%) and category navigation (31%). Only 7% use 'recommended for you' section.",
      relevanceScore: 0.84,
    },
  ],
  "ana-004": [
    {
      id: "src-012",
      analysisId: "ana-004",
      type: "source-code",
      category: "Source Code",
      title: "CarrierAdapter.ts",
      date: "2026-03-22",
      origin: "GitLab — techflow/shipping",
      excerpt: "Abstract carrier adapter with methods: getRates(), generateLabel(), getTracking(). Currently implements DHL, UPS, and FedEx adapters.",
      relevanceScore: 0.93,
    },
    {
      id: "src-013",
      analysisId: "ana-004",
      type: "intervention",
      category: "Past Interventions",
      title: "FedEx Integration Deployment",
      date: "2026-02-10",
      origin: "Deployment Log",
      excerpt: "FedEx adapter implemented and deployed in 4 dev days. Used same adapter pattern. Rate calculation accuracy: 99.2%. Zero post-deployment incidents.",
      relevanceScore: 0.87,
    },
  ],
};

export function getSourcesForAnalysis(analysisId: string) {
  return mockSources[analysisId] || mockSources["ana-001"];
}
