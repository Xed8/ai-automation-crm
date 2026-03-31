# Navigation Performance Optimization Spec

**Date:** 2026-03-29
**Status:** Approved
**Approach:** Option A - Full Static + ISR

## Problem
- Navigation between all pages takes 2+ seconds every time on Vercel production
- "Rendering" spinner shows on every navigation
- All routes are dynamic (ƒ) - server-rendered on every request

## Solution

### 1. Static Pages (No User Data)

Make these pages fully static (`export const dynamic = 'force-static'`):
- `/` (landing page)
- `/login`
- `/register`
- `/forgot-password`
- `/reset-password`
- `/f/[form_id]` (public lead intake forms)

**Rationale:** These pages don't require auth, content is the same for all users.

### 2. ISR Pages (Dashboard - Cached)

Add `export const revalidate = 60` to dashboard routes:
- `/dashboard`
- `/workspaces`
- `/w/[workspace_slug]` (dashboard home)
- `/w/[workspace_slug]/boards`
- `/w/[workspace_slug]/leads`
- `/w/[workspace_slug]/automations`
- `/w/[workspace_slug]/forms`
- `/w/[workspace_slug]/team`
- `/w/[workspace_slug]/settings`

**Rationale:** These pages have user-specific data but can be cached for 60 seconds. Server actions handle mutations and trigger revalidation.

### 3. Dynamic Pages (Real-Time Required)

Keep these dynamic (no caching):
- `/w/[workspace_slug]/leads/[lead_id]` (lead detail - real-time updates)
- `/w/[workspace_slug]/boards/[board_id]` (kanban - real-time updates)
- `/api/*` (webhooks, auth callbacks)

### 4. Component Lazy Loading

Lazy load heavy interactive components:
- KanbanBoard
- AutomationRuleBuilder
- AI Actions component

### 5. Ensure Proper Link Usage

- All navigation uses Next.js `<Link>` component
- No `<a>` tags for internal navigation
- Default prefetch behavior is correct

## Files to Modify

1. `app/page.tsx` - add `dynamic = 'force-static'`
2. `app/(auth)/layout.tsx` - add static for auth group
3. `app/(dashboard)/layout.tsx` - add revalidate
4. `app/f/[form_id]/page.tsx` - add static
5. `components/leads/kanban-board.tsx` - lazy load
6. `components/automations/rule-builder.tsx` - lazy load
7. `components/leads/ai-actions.tsx` - lazy load

## Expected Outcome

- Public pages: Instant load (static)
- Dashboard pages: < 1s load (cached, revalidates every 60s)
- Real-time pages: Same as now (dynamic)
- Navigation: Should feel snappy with prefetching
