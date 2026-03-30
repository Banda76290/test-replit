# OASIS Projet — Internal Meta SaaS Platform

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

## Pages

1. **Login** (`/login`) — Enterprise SSO simulation with OASIS branding
2. **Dashboard** (`/`) — Welcome, stats, recent activity, suggested actions
3. **Clients** (`/clients`) — Client portfolio with search/filters
4. **Client Projects** (`/clients/:id/projects`) — Project list for selected client
5. **Workspace** (`/workspace/:projectId`) — AI analysis cockpit (strongest page)
6. **History** (`/history`) — Analysis history table with filters
7. **Admin** (`/admin`) — Profile, preferences, recent logins

## API Endpoints

All mock data served from `artifacts/api-server/src/mocks/`:

- `GET /api/me` — Current user (requires session cookie)
- `POST /api/auth/login` — Simulate SSO login (sets session cookie)
- `POST /api/auth/logout` — Clear session
- `GET /api/dashboard/summary` — Dashboard data
- `GET /api/clients` — Client list (supports search, sector, status params)
- `GET /api/clients/:id/projects` — Projects for a client
- `GET /api/projects/:id` — Single project
- `POST /api/analysis/run` — Run AI analysis (simulated)
- `GET /api/analysis/history` — Analysis history
- `GET /api/analysis/:id` — Single analysis
- `GET /api/sources/:analysisId` — Sources for analysis
- `GET /api/diff/:analysisId` — Diff for analysis
- `GET /api/activity` — Activity feed
- `GET /api/preferences` — User preferences
- `PUT /api/preferences` — Update preferences
- `GET /api/admin/profile` — Admin profile
- `POST /api/analysis/:id/feedback` — Submit feedback

## Authentication

Simple cookie-based session. Login creates a session cookie; `/api/me` validates it. The frontend `AuthProvider` manages auth state and redirects unauthenticated users to `/login`.

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
