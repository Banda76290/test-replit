import { SERVICES, SERVICE_ORDER } from "./service-config";
import type { ServiceId } from "./service-config";

// ── Rôles utilisateur ─────────────────────────────────────────────────────
// Source de vérité pour les types d'utilisateurs OASIS.
// Ajouter un rôle ici le fait apparaître automatiquement dans l'admin.

export const USER_ROLES = [
  { id: "dev", label: "Développeur" },
  { id: "commercial", label: "Commercial" },
  { id: "chef-projet", label: "Chef de projet" },
  { id: "service-client", label: "Service Client" },
  { id: "direction", label: "Direction" },
  { id: "admin", label: "Administrateur" },
] as const;

export type UserRoleId = typeof USER_ROLES[number]["id"];

// ── Structure du config ────────────────────────────────────────────────────
// { serviceId → { roleId → { navItemHref → visible } } }
// Valeur absente = visible par défaut (opt-out).

export type NavConfigMap = Partial<
  Record<ServiceId, Partial<Record<UserRoleId, Record<string, boolean>>>>
>;

const STORAGE_KEY = "oasis_nav_config_v1";

export function loadNavConfig(): NavConfigMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as NavConfigMap) : {};
  } catch {
    return {};
  }
}

export function saveNavConfig(config: NavConfigMap): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {}
}

export function isNavItemVisible(
  config: NavConfigMap,
  serviceId: ServiceId,
  roleId: UserRoleId,
  href: string
): boolean {
  const val = config[serviceId]?.[roleId]?.[href];
  return val === undefined ? true : val;
}

// ── Mapping rôle utilisateur (string libre) → UserRoleId ─────────────────
// Utilisé dans le layout pour identifier le rôle de l'utilisateur courant.

const ROLE_MAP: Record<string, UserRoleId> = {
  "développeur": "dev",
  "developer": "dev",
  "dev": "dev",
  "commercial": "commercial",
  "chef de projet": "chef-projet",
  "chef-projet": "chef-projet",
  "project manager": "chef-projet",
  "service client": "service-client",
  "service-client": "service-client",
  "support": "service-client",
  "direction": "direction",
  "directeur": "direction",
  "manager": "direction",
  "administrateur": "admin",
  "admin": "admin",
};

export function resolveUserRoleId(roleLabel: string | undefined): UserRoleId {
  if (!roleLabel) return "dev";
  const key = roleLabel.toLowerCase().trim();
  return ROLE_MAP[key] ?? "dev";
}

// ── Utilitaire : compter les items masqués (pour badges dans l'UI) ────────
export function countHiddenItems(
  config: NavConfigMap,
  serviceId: ServiceId,
  roleId: UserRoleId
): number {
  const service = SERVICES[serviceId];
  return service.nav.filter(
    (item) => !isNavItemVisible(config, serviceId, roleId, item.href)
  ).length;
}

export { SERVICE_ORDER, SERVICES };
