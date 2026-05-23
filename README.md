# ChatApp — Real-Time Chat (Turborepo Monorepo)

Production-grade demo learning project. Built with Next.js 14, FastAPI, shadcn/ui, Drizzle ORM, WebSocket, and Docker.

## Quick Start

```bash
# 1. Clone and install
pnpm install

# 2. Set up environment
cp .env.example .env
# Edit .env and fill in your JWT_SECRET_KEY (openssl rand -hex 32)

# 3. Start PostgreSQL
docker-compose up -d postgres

# 4. Run migrations (after completing Prompt 2 — DB schema)
pnpm db:migrate

# 5. Seed with test data
pnpm db:seed

# 6. Start all apps
pnpm dev
```

Open:
- **Frontend**: http://localhost:3000
- **API docs**: http://localhost:8000/docs
- **API health**: http://localhost:8000/health

## Monorepo Structure

```
chatapp/
├── apps/
│   ├── web/          Next.js 14 + shadcn/ui (port 3000)
│   └── api/          FastAPI + Uvicorn (port 8000)
├── packages/
│   ├── db/           Drizzle ORM schema + migrations
│   └── shared-types/ Shared TypeScript types
├── docker-compose.yml
├── turbo.json
└── .env.example
```

## Build System (Turborepo)

| Command | Description |
|---|---|
| `pnpm dev` | Start all apps in parallel with hot-reload |
| `pnpm build` | Build all packages (respects dependency order) |
| `pnpm lint` | Lint all packages simultaneously |
| `pnpm db:generate` | Generate SQL migrations from schema.ts |
| `pnpm db:migrate` | Apply migrations to PostgreSQL |
| `pnpm db:seed` | Insert test data |

## Module Build Order

Follow the prompts in the SRS document in this order:

1. ✅ **Prompt 1** — Monorepo bootstrap *(this file)*
2. ⬜ **Prompt 2** — Database schema (Drizzle)
3. ⬜ **Prompt 3** — FastAPI scaffold + security
4. ⬜ **Prompt 4** — Auth API
5. ⬜ **Prompt 5** — Rooms API
6. ⬜ **Prompt 6** — WebSocket server
7. ⬜ **Prompt 7** — Next.js + shadcn/ui foundation
8. ⬜ **Prompt 8** — Auth UI
9. ⬜ **Prompt 9** — Chat UI
10. ⬜ **Prompt 10** — Polish
11. ⬜ **Prompt 11** — Agno AI agent (stretch)

## Tech Stack

| Layer | Technology |
|---|---|
| Monorepo | Turborepo + pnpm workspaces |
| Frontend | Next.js 14 (App Router) |
| UI Components | shadcn/ui (Radix UI + Tailwind) |
| Backend | FastAPI + Uvicorn (Python) |
| Database | PostgreSQL 15 (Docker) |
| ORM | Drizzle ORM (TypeScript) |
| Real-time | WebSocket (FastAPI native) |
| Auth | JWT + httpOnly refresh cookies |
| Rate limiting | SlowAPI (BE) + upstash/ratelimit (FE) |
| Input sanitization | Pydantic v2 + bleach (BE) / Zod + DOMPurify (FE) |
