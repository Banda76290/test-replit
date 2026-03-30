import {
  LayoutDashboard,
  Users,
  FolderKanban,
  History,
  Settings,
  FileText,
  ScrollText,
  BarChart3,
  Ticket,
  MessageSquare,
  UserCheck,
  BookOpen,
  Calendar,
  Users2,
  TrendingUp,
  Headphones,
  Building2,
  Code2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type ServiceId = "dev" | "commercial" | "client" | "projet" | "direction";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  startsWith?: boolean;
  isPlaceholder?: boolean;
  placeholderDesc?: string;
}

export interface ServiceConfig {
  id: ServiceId;
  label: string;
  shortLabel: string;
  description: string;
  icon: LucideIcon;
  accentColor: string;
  badgeClass: string;
  nav: NavItem[];
  defaultHref: string;
}

export const SERVICES: Record<ServiceId, ServiceConfig> = {
  dev: {
    id: "dev",
    label: "Développement Web",
    shortLabel: "Dev",
    description: "Analyse IA, gestion du code source et revues techniques",
    icon: Code2,
    accentColor: "text-primary",
    badgeClass: "bg-primary/10 text-primary border-primary/20",
    defaultHref: "/",
    nav: [
      { href: "/", label: "Tableau de bord", icon: LayoutDashboard },
      { href: "/clients", label: "Clients", icon: Users },
      { href: "/workspace", label: "Espace de travail", icon: FolderKanban, startsWith: true },
      { href: "/history", label: "Historique", icon: History },
      { href: "/admin", label: "Admin & Profil", icon: Settings },
    ],
  },

  commercial: {
    id: "commercial",
    label: "Service Commercial",
    shortLabel: "Commercial",
    description: "Suivi des opportunités, propositions et contrats clients",
    icon: TrendingUp,
    accentColor: "text-emerald-600",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800",
    defaultHref: "/",
    nav: [
      { href: "/", label: "Tableau de bord", icon: LayoutDashboard },
      { href: "/clients", label: "Clients", icon: Users },
      {
        href: "/commercial/propositions",
        label: "Propositions",
        icon: FileText,
        isPlaceholder: true,
        placeholderDesc: "Créez, gérez et suivez vos propositions commerciales avec des modèles personnalisés et des outils de collaboration.",
      },
      {
        href: "/commercial/contrats",
        label: "Contrats",
        icon: ScrollText,
        isPlaceholder: true,
        placeholderDesc: "Centralisez la gestion des contrats, des renouvellements et des alertes d'échéance en un seul endroit.",
      },
      {
        href: "/commercial/rapports",
        label: "Rapports",
        icon: BarChart3,
        isPlaceholder: true,
        placeholderDesc: "Visualisez vos performances commerciales, taux de conversion et chiffre d'affaires en temps réel.",
      },
      { href: "/admin", label: "Admin & Profil", icon: Settings },
    ],
  },

  client: {
    id: "client",
    label: "Service Client",
    shortLabel: "Service Client",
    description: "Gestion des tickets, communications et satisfaction client",
    icon: Headphones,
    accentColor: "text-violet-600",
    badgeClass: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950 dark:text-violet-400 dark:border-violet-800",
    defaultHref: "/",
    nav: [
      { href: "/", label: "Tableau de bord", icon: LayoutDashboard },
      {
        href: "/client/tickets",
        label: "Tickets",
        icon: Ticket,
        isPlaceholder: true,
        placeholderDesc: "Gérez tous les tickets de support, assignez-les aux agents et suivez leur résolution en temps réel.",
      },
      {
        href: "/client/communications",
        label: "Communications",
        icon: MessageSquare,
        isPlaceholder: true,
        placeholderDesc: "Centralisez toutes les interactions client : e-mails, chats, appels et notifications en un espace unifié.",
      },
      {
        href: "/client/suivi",
        label: "Suivi client",
        icon: UserCheck,
        isPlaceholder: true,
        placeholderDesc: "Consultez l'historique complet de chaque client, ses préférences et ses indicateurs de satisfaction.",
      },
      {
        href: "/client/base-connaissance",
        label: "Base de connaissances",
        icon: BookOpen,
        isPlaceholder: true,
        placeholderDesc: "Construisez et partagez une base documentaire interne pour accélérer la résolution des problèmes récurrents.",
      },
      { href: "/admin", label: "Admin & Profil", icon: Settings },
    ],
  },

  projet: {
    id: "projet",
    label: "Chefferie de Projet",
    shortLabel: "Projets",
    description: "Planification, ressources et pilotage des projets clients",
    icon: FolderKanban,
    accentColor: "text-amber-600",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800",
    defaultHref: "/",
    nav: [
      { href: "/", label: "Tableau de bord", icon: LayoutDashboard },
      { href: "/clients", label: "Clients", icon: Users },
      {
        href: "/projet/projets",
        label: "Projets",
        icon: FolderKanban,
        isPlaceholder: true,
        placeholderDesc: "Vue d'ensemble de tous les projets actifs : avancement, livrables, jalons et alertes de dérive.",
      },
      {
        href: "/projet/planning",
        label: "Planning",
        icon: Calendar,
        isPlaceholder: true,
        placeholderDesc: "Planifiez les sprints, les phases de projet et les dépendances avec un outil de Gantt interactif.",
      },
      {
        href: "/projet/ressources",
        label: "Ressources",
        icon: Users2,
        isPlaceholder: true,
        placeholderDesc: "Gérez la capacité de vos équipes, l'affectation aux projets et anticipez les surcharges ou sous-utilisations.",
      },
      {
        href: "/projet/rapports",
        label: "Rapports",
        icon: BarChart3,
        isPlaceholder: true,
        placeholderDesc: "Générez des rapports d'avancement, de budget et de satisfaction pour vos clients et la direction.",
      },
      { href: "/admin", label: "Admin & Profil", icon: Settings },
    ],
  },

  direction: {
    id: "direction",
    label: "Direction",
    shortLabel: "Direction",
    description: "Vue consolidée de toute l'activité OASIS Projet",
    icon: Building2,
    accentColor: "text-primary",
    badgeClass: "bg-primary/10 text-primary border-primary/20",
    defaultHref: "/",
    nav: [
      { href: "/", label: "Tableau de bord", icon: LayoutDashboard },
      { href: "/clients", label: "Clients", icon: Users },
      { href: "/workspace", label: "Espace de travail", icon: FolderKanban, startsWith: true },
      { href: "/history", label: "Historique", icon: History },
      {
        href: "/direction/synthese",
        label: "Synthèse globale",
        icon: BarChart3,
        isPlaceholder: true,
        placeholderDesc: "Consolidez les KPIs de tous les services en un tableau de bord exécutif avec alertes et tendances.",
      },
      { href: "/admin", label: "Admin & Profil", icon: Settings },
    ],
  },
};

export const SERVICE_ORDER: ServiceId[] = ["dev", "commercial", "client", "projet", "direction"];

export function getServiceConfig(id: ServiceId): ServiceConfig {
  return SERVICES[id];
}

export function findNavItem(serviceId: ServiceId, pathname: string): NavItem | undefined {
  const config = SERVICES[serviceId];
  return config.nav.find((item) =>
    item.startsWith ? pathname.startsWith(item.href) : pathname === item.href
  );
}
