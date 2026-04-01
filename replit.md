# OASIS Projet — Plateforme Meta SaaS Interne

## Langue

**IMPORTANT : L'intégralité de l'application est en français.** Toute nouvelle fonctionnalité, texte, label, message d'erreur, placeholder, données mock, etc. doit être rédigé en français. La langue HTML est `lang="fr"`. Les dates utilisent le locale `fr` (date-fns).

## Overview

pnpm workspace monorepo containing OASIS Projet, a premium internal B2B Meta SaaS application for developers. The platform serves as the user-facing interface layer for an enterprise AI infrastructure, providing analysis, planning, and code review capabilities.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Frontend**: React + Vite + Tailwind CSS v4
- **UI Library**: shadcn/ui components
- **Routing**: Wouter
- **State management**: React Query (TanStack Query)
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (server), Vite (frontend)
- **Font**: Montserrat (Google Fonts)
- **Primary color**: #0096C3 (OASIS blue)

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/            # Express API server (BFF + mock data)
│   │   ├── src/routes/        # API route handlers
│   │   └── src/mocks/         # Mock data (users, clients, projects, analyses)
│   ├── oasis-app/             # React + Vite frontend
│   │   ├── src/pages/         # Page components (login, dashboard, clients, workspace, etc.)
│   │   ├── src/components/    # Shared components (layout, logo, protected-route)
│   │   └── src/hooks/         # Custom hooks (auth)
│   └── mockup-sandbox/        # Design sandbox
├── lib/
│   ├── api-spec/              # OpenAPI spec + Orval codegen config
│   ├── api-client-react/      # Generated React Query hooks
│   ├── api-zod/               # Generated Zod schemas
│   └── db/                    # Drizzle ORM schema (not used — all data is mocked)
├── scripts/                   # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Brand & Design System

- **Brand**: OASIS Projet
- **Baseline**: "Solutions digitales"
- **Primary accent**: #0096C3 (HSL 194 100% 38%)
- **Font**: Montserrat (light through bold weights)
- **Visual tone**: Premium, restrained, enterprise-grade
- **Logo**: Text-based placeholder with blue dot accent, no shadows/transforms

## Hiérarchie des données

La société utilise une hiérarchie à 5 niveaux :
- **Client** (réf. `CLI45872`) — Le client final
- **Projet** (réf. `PR95721`) — Le projet global d'un client (rare d'en avoir plusieurs par client)
- **Prestation** (réf. `PRE14602`) — Une prestation spécifique dans un projet. Contient une URL de production + des URL "save" (URL de travail)
- **Tâche** (réf. `TC00148`) — Tâche dans une prestation (non implémenté)
- **Checklist** (réf. `CHK98035`) — Checklist dans une tâche (non implémenté)

Parcours utilisateur classique : Clients → Projets → Prestations → Espace de travail (workspace)

## Pages

1. **Login** (`/login`) — SSO entreprise simulé avec branding OASIS
2. **Dashboard** (`/`) — Accueil, statistiques, activité récente, actions suggérées
3. **Clients** (`/clients`) — Portefeuille clients avec recherche/filtres
4. **Projets du client** (`/clients/:id/projects`) — Liste des projets d'un client (Projet = niveau PR)
5. **Prestations du projet** (`/projects/:id/prestations`) — Liste des prestations d'un projet (avec URLs du site)
6. **Workspace** (`/workspace/:prestationId`) — Cockpit d'analyse IA (page principale)
7. **Historique** (`/history`) — Tableau des analyses avec filtres
8. **Admin** (`/admin`) — Profil, préférences, connexions récentes, export ZIP, Git push (admin uniquement)

## API Endpoints

All mock data served from `artifacts/api-server/src/mocks/`:

- `GET /api/me` — Current user (requires session cookie)
- `POST /api/auth/login` — Simulate SSO login (sets session cookie)
- `POST /api/auth/logout` — Clear session
- `GET /api/dashboard/summary` — Dashboard data
- `GET /api/clients` — Client list (supports search, sector, status params)
- `GET /api/clients/:id/projects` — Projets for a client (returns Projet[])
- `GET /api/projects/:id` — Single Projet
- `GET /api/projects/:id/prestations` — Prestations for a project (returns Prestation[])
- `GET /api/prestations/:id` — Single Prestation (includes productionUrl + saveUrls)
- `POST /api/analysis/run` — Run AI analysis (accepts prestationId + projectId)
- `GET /api/analysis/history` — Analysis history
- `GET /api/analysis/:id` — Single analysis
- `GET /api/sources/:analysisId` — Sources for analysis
- `GET /api/diff/:analysisId` — Diff for analysis
- `GET /api/activity` — Activity feed
- `GET /api/preferences` — User preferences
- `PUT /api/preferences` — Update preferences
- `GET /api/admin/profile` — Admin profile
- `GET /api/admin/export` — Download ZIP archive of project (admin-only)
- `POST /api/admin/git-push` — Push code to remote Git repo (admin-only, accepts remoteUrl/branch/token)
- `POST /api/analysis/:id/feedback` — Submit feedback

## Authentication

Simple cookie-based session. Login creates a session cookie; `/api/me` validates it. The frontend `AuthProvider` manages auth state and redirects unauthenticated users to `/login`. Mock user has `isAdmin: true`; admin-only features (ZIP export, Git push) are protected by `requireAdmin` middleware and conditionally rendered on the frontend.

## Key Commands

- `pnpm --filter @workspace/api-spec run codegen` — Regenerate API client
- `pnpm --filter @workspace/api-server run dev` — Start API server
- `pnpm --filter @workspace/oasis-app run dev` — Start frontend
- `pnpm run typecheck` — Full type check

## Mock Data

- 6 realistic clients (fashion, B2B distribution, high-tech ecommerce, etc.)
- 10 projects with varied statuses and tech stacks
- 4 detailed analysis scenarios with full technical plans
- Rich source data categorized by type (source code, tickets, commercial, etc.)
- Diff viewer data with before/after code snippets
- Activity feed and admin profile data

## Docker / Coolify Deployment

The project includes Docker configuration for deployment to Coolify (Kubernetes) or any Docker-compatible platform.

### Files

- `Dockerfile` — Multi-stage build: `node:20-slim` (build) → `node:20-alpine` (runtime). Installs pnpm, builds frontend (Vite) + API (esbuild), copies bundles to minimal runtime image with git.
- `docker-compose.yml` — Single `app` service on port 5000 with healthcheck (`/api/healthz`). Uses `.env` file for configuration.
- `entrypoint.sh` — Starts `node dist/index.mjs`.
- `.dockerignore` — Excludes `node_modules`, `dist`, `.git`, Replit-specific files.

### Production Architecture

In production (`NODE_ENV=production`), the API server serves both:
1. **API routes** at `/api/*` — all existing endpoints
2. **Frontend static files** — Vite build output served via `express.static`, with SPA fallback to `index.html`

The API bundle (`dist/index.mjs`) is fully self-contained (esbuild `bundle: true`) — no `node_modules` needed at runtime.

### Environment Variables (Docker)

- `PORT` — Server port (default: 5000)
- `NODE_ENV` — Set to `production`
- `CORS_ORIGIN` — Allowed CORS origin (optional, defaults to allow all in dev)
- `OASIS_PROJECT_ROOT` — Root path for git export feature (defaults to `../..` from cwd)
- `SESSION_SECRET` — Session cookie secret

### Build Commands

```bash
docker compose build
docker compose up -d
```

### Admin Git Export

The admin export (`GET /api/admin/export`) uses `git archive HEAD --format=zip` to create a clean ZIP. The runtime image includes `git` for this purpose. The admin Git push (`POST /api/admin/git-push`) pushes to a remote repository for Coolify deployment.
