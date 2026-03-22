# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Agency CRM** — a multi-tenant SaaS CRM with kanban pipelines, lead intake webhooks, automation rules, and AI-powered lead summaries. Built for agencies to manage client leads.

## Commands

```bash
npm run dev      # Start dev server (Turbopack)
npm run build    # Production build
npm run lint     # ESLint
npm run start    # Production server
```

No test runner configured — no test files exist in the codebase.

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GROQ_API_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

## Architecture

### Tech Stack
- **Next.js 15** (App Router) + **React 19** + **TypeScript** (strict)
- **Supabase** — PostgreSQL + Auth + RLS (the entire backend)
- **Groq API** (`llama-3.3-70b`) for AI features
- **shadcn/ui** + **Radix UI** + **Tailwind CSS**
- **React Hook Form** for forms, **Sonner** for toasts

### Route Groups

```
app/(auth)/           → login, register (public)
app/(dashboard)/w/[workspace_slug]/  → all CRM pages (protected)
app/actions/          → ALL mutations as Server Actions
app/api/webhooks/intake/  → lead intake webhook (POST, Bearer token)
app/auth/callback/    → Supabase OAuth code exchange
```

There are no internal REST API routes — all data mutations go through **Server Actions** in `app/actions/`.

### Supabase Client Hierarchy

Four clients — use the right one:

| Client | File | RLS | Use when |
|--------|------|-----|----------|
| Server | `lib/supabase/server.ts` | Enforced | Server components, Server Actions (user context) |
| Browser | `lib/supabase/client.ts` | Enforced | Client components |
| Admin | `lib/supabase/admin.ts` | **Bypassed** | Automation engine, cross-workspace ops |
| Privileged | `lib/supabase/privileged.ts` | **Bypassed** | Team invites, privileged mutations |

Only use admin/privileged when RLS cannot satisfy the operation.

### Auth & Workspace Authorization

- Every protected Server Action calls `requireWorkspaceScope(supabase, workspaceSlug)` first — it validates membership, returns `{ user, workspace, member }`, and redirects to `/workspaces` if access is denied.
- Roles: `owner > admin > member`. Enforced in both Server Actions and DB RLS policies.
- RLS helper functions in DB: `is_workspace_member()`, `has_workspace_role()`.
- Auth flow: email/password → Supabase JWT → cookies via `@supabase/ssr` middleware.

### Database Schema

Migrations in `supabase/migrations/`. Key tables:

- `workspaces` + `workspace_members` — multi-tenancy backbone
- `boards` → `stages` → `leads` — CRM hierarchy
- `leads` — core: `firm_name`, `contact_*`, `value`, `status` (active/won/lost), `stage_id`, `assigned_to`
- `notes`, `tasks`, `activity_logs` — lead sub-entities
- `automation_rules` + `automation_logs` — automation engine
- `lead_forms` — inbound webhook forms with `webhook_secret`
- `subscriptions`, `billing_usage_logs`, `workspace_quotas` — billing/quota

New boards are seeded with 7 default stages + 5 sample leads on workspace creation.

### Automation Engine

`lib/automations/engine.ts` — triggered by: `lead_created`, `stage_changed`, `form_submitted`

Action types: `create_task`, `move_stage`, `create_note`, `assign_owner`

Uses the **admin client** (bypasses RLS). Anti-loop: 5-minute debounce per rule+lead tracked in `automation_logs`.

### Lead Intake Webhook

`POST /api/webhooks/intake` — authenticated via `Authorization: Bearer <webhook_secret>`. Calls security-definer RPC `ingest_lead_from_form` which validates the secret and creates/updates leads without normal RLS.

### Billing / Quota System

`lib/billing/quotas.ts` — `checkQuota()` and `recordUsage()` called before lead creation and AI actions. Plan limits are hardcoded (Free: 50 leads/10k tokens; Pro: 999k/500k; Enterprise: unlimited).

**Stripe is NOT integrated.** The `stripe_customer_id`/`stripe_subscription_id` fields in `subscriptions` are unpopulated. The upgrade flow currently just flips a DB field — no real payment.

### AI Features

`app/actions/ai.ts` — two actions:
1. `summarizeLead()` — summarizes notes + activity via Groq, posts result as a note
2. `suggestNextStep()` — suggests one actionable task, posts as a task

Both check quota before executing and record token usage after.

### Known Gaps (do not assume these work)

- **Pagination** — all lists load all records
- **Workspace settings** — no rename workspace page
- **Email notifications** — not built

### Path Aliases

`@/*` → project root (`tsconfig.json`). Use `@/lib/...`, `@/components/...`, `@/app/...`.
