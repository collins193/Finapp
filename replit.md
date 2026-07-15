# FinTrack

A fintech web app combining investment portfolio management with project/task tracking. Used by investment teams to monitor portfolios, coordinate work, assign task owners, and track deadlines.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, proxied at `/api`)
- `pnpm --filter @workspace/fintrack run dev` — run the frontend (port 23162, proxied at `/`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, TanStack Query, Wouter, Tailwind CSS, Recharts, Framer Motion
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec in `lib/api-spec/openapi.yaml`)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — single source of truth for all API contracts
- `lib/db/src/schema/` — Drizzle table definitions (portfolios, holdings, transactions, projects, tasks, members)
- `artifacts/api-server/src/routes/` — Express route handlers (portfolios, holdings, transactions, projects, tasks, members, dashboard)
- `artifacts/fintrack/src/` — React frontend with pages for dashboard, portfolios, projects, tasks, members

## Architecture decisions

- Dashboard summary, recent activity, and task breakdown are computed server-side to avoid N+1 queries on the client.
- Portfolio totalValue/gainLoss/gainLossPercent are computed at query time from holdings (not stored), so they always reflect current prices.
- Project progress % is computed from done/total task counts.
- Task enrichment (ownerName, ownerInitials, projectName) is resolved in route handlers before responding.

## Product

- **Dashboard**: Portfolio total value + gain/loss, open/overdue task counts, task breakdown by status/priority, recent activity feed
- **Portfolios**: CRUD portfolios, manage holdings (ticker, quantity, cost basis, current price), log buy/sell/dividend transactions
- **Projects**: Track projects with status, progress bar, due dates, task counts
- **Tasks**: Full task management — assign owners, set deadlines, set priority (low/medium/high/urgent), update status (todo/in_progress/review/done), filterable across all projects
- **Members**: Team members with roles, assignable to tasks

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After changing `lib/db/src/schema/`, run `pnpm run typecheck:libs` before typechecking api-server, otherwise `@workspace/db` exports appear stale.
- After each OpenAPI spec change, re-run codegen before using the updated types.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
