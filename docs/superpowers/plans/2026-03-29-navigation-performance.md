# Navigation Performance Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make navigation between pages fast by adding static generation and ISR caching

**Architecture:** Add `dynamic = 'force-static'` to public pages, `revalidate = 60` to dashboard pages, lazy load heavy components

**Tech Stack:** Next.js 15 (App Router), React Server Components

---

## File Structure

| File | Change |
|------|--------|
| `app/page.tsx` | Add static export |
| `app/(auth)/login/page.tsx` | Add static export |
| `app/(auth)/register/page.tsx` | Add static export |
| `app/(auth)/forgot-password/page.tsx` | Add static export |
| `app/(auth)/reset-password/page.tsx` | Add static export |
| `app/(auth)/layout.tsx` | Add static export |
| `app/(dashboard)/layout.tsx` | Add revalidate |
| `app/f/[form_id]/page.tsx` | Add static export |
| `components/leads/kanban-board.tsx` | Lazy load |
| `components/automations/rule-builder.tsx` | Lazy load |
| `components/leads/ai-actions.tsx` | Lazy load |

---

### Task 1: Make Landing Page Static

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Add static export to landing page**

Add at the top of `app/page.tsx` (after 'use client'):
```typescript
export const dynamic = 'force-static'
```

- [ ] **Step 2: Verify**

Run: `npm run build 2>&1 | grep "○ /"`
Expected: `○ /` should appear (static)

---

### Task 2: Make Auth Pages Static

**Files:**
- Modify: `app/(auth)/layout.tsx`
- Modify: `app/(auth)/login/page.tsx`
- Modify: `app/(auth)/register/page.tsx`
- Modify: `app/(auth)/forgot-password/page.tsx`
- Modify: `app/(auth)/reset-password/page.tsx`

- [ ] **Step 1: Add static export to auth layout**

Create or modify `app/(auth)/layout.tsx`:
```typescript
import { Suspense } from 'react'

export const dynamic = 'force-static'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Suspense fallback={null}>
        {children}
      </Suspense>
    </div>
  )
}
```

- [ ] **Step 2: Add static to individual auth pages**

For each auth page, add at the top (after imports):
```typescript
export const dynamic = 'force-static'
```

Files to update:
- `app/(auth)/login/page.tsx`
- `app/(auth)/register/page.tsx`
- `app/(auth)/forgot-password/page.tsx`
- `app/(auth)/reset-password/page.tsx`

- [ ] **Step 3: Verify**

Run: `npm run build 2>&1 | grep -E "○ /(login|register|forgot-password|reset-password)"`
Expected: All auth routes should show `○` (static)

---

### Task 3: Add ISR Revalidation to Dashboard Pages

**Files:**
- Modify: `app/(dashboard)/layout.tsx`
- Modify: `app/dashboard/page.tsx`
- Modify: `app/(dashboard)/workspaces/page.tsx`
- Modify: `app/(dashboard)/workspaces/create/page.tsx`
- Modify: `app/(dashboard)/w/[workspace_slug]/page.tsx`
- Modify: `app/(dashboard)/w/[workspace_slug]/boards/page.tsx`
- Modify: `app/(dashboard)/w/[workspace_slug]/leads/page.tsx`
- Modify: `app/(dashboard)/w/[workspace_slug]/automations/page.tsx`
- Modify: `app/(dashboard)/w/[workspace_slug]/forms/page.tsx`
- Modify: `app/(dashboard)/w/[workspace_slug]/team/page.tsx`
- Modify: `app/(dashboard)/w/[workspace_slug]/settings/page.tsx`

- [ ] **Step 1: Add revalidate to dashboard layout**

Modify `app/(dashboard)/layout.tsx`:
```typescript
import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { WorkspaceNav } from '@/components/shared/workspace-nav'

export const dynamic = 'force-dynamic' // Keep dynamic - auth required

export const revalidate = 60 // Cache for 60 seconds

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-background">
      <WorkspaceNav />
      <main className="p-6">
        {children}
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Add revalidate to dashboard index**

Modify `app/dashboard/page.tsx`:
```typescript
export const revalidate = 60
```

- [ ] **Step 3: Add revalidate to workspaces**

Modify:
- `app/(dashboard)/workspaces/page.tsx` - add `export const revalidate = 60`
- `app/(dashboard)/workspaces/create/page.tsx` - add `export const revalidate = 60`

- [ ] **Step 4: Add revalidate to workspace pages**

For each workspace route page, add at top:
```typescript
export const revalidate = 60
```

Files:
- `app/(dashboard)/w/[workspace_slug]/page.tsx`
- `app/(dashboard)/w/[workspace_slug]/boards/page.tsx`
- `app/(dashboard)/w/[workspace_slug]/leads/page.tsx`
- `app/(dashboard)/w/[workspace_slug]/automations/page.tsx`
- `app/(dashboard)/w/[workspace_slug]/forms/page.tsx`
- `app/(dashboard)/w/[workspace_slug]/team/page.tsx`
- `app/(dashboard)/w/[workspace_slug]/settings/page.tsx`

- [ ] **Step 5: Verify**

Run: `npm run build 2>&1 | grep "/w/"`
Expected: Routes should show `○` or `℞` (cached)

---

### Task 4: Make Public Form Page Static

**Files:**
- Modify: `app/f/[form_id]/page.tsx`

- [ ] **Step 1: Add static export**

Add at top of `app/f/[form_id]/page.tsx`:
```typescript
export const dynamic = 'force-static'
```

- [ ] **Step 2: Verify**

Run: `npm run build 2>&1 | grep "/f/"`
Expected: `○ /f/[form_id]` (static)

---

### Task 5: Lazy Load Heavy Components

**Files:**
- Modify: `app/(dashboard)/w/[workspace_slug]/boards/[board_id]/page.tsx`
- Modify: `app/(dashboard)/w/[workspace_slug]/automations/page.tsx`
- Modify: `app/(dashboard)/w/[workspace_slug]/leads/[lead_id]/page.tsx`

- [ ] **Step 1: Lazy load KanbanBoard**

Modify `app/(dashboard)/w/[workspace_slug]/boards/[board_id]/page.tsx`:

Replace import:
```typescript
// Before
import { KanbanBoard } from '@/components/leads/kanban-board'

// After
import dynamic from 'next/dynamic'

const KanbanBoard = dynamic(
  () => import('@/components/leads/kanban-board').then(m => ({ default: m.KanbanBoard })),
  { 
    ssr: false,
    loading: () => <div className="h-96 animate-pulse bg-muted rounded-lg" />
  }
)
```

- [ ] **Step 2: Lazy load Automation components**

Modify `app/(dashboard)/w/[workspace_slug]/automations/page.tsx`:

```typescript
import dynamic from 'next/dynamic'

const AutomationCreateForm = dynamic(
  () => import('@/components/automations/automation-create-form').then(m => ({ default: m.AutomationCreateForm })),
  { 
    ssr: false,
    loading: () => <div className="h-32 animate-pulse bg-muted rounded-lg" />
  }
)

const RuleBuilder = dynamic(
  () => import('@/components/automations/rule-builder').then(m => ({ default: m.RuleBuilder })),
  { 
    ssr: false,
    loading: () => <div className="h-64 animate-pulse bg-muted rounded-lg" />
  }
)
```

- [ ] **Step 3: Lazy load AI Actions**

Modify `app/(dashboard)/w/[workspace_slug]/leads/[lead_id]/page.tsx`:

```typescript
import dynamic from 'next/dynamic'

const AIActions = dynamic(
  () => import('@/components/leads/ai-actions').then(m => ({ default: m.AIActions })),
  { 
    ssr: false,
    loading: () => <div className="h-16 animate-pulse bg-muted rounded-lg" />
  }
)
```

- [ ] **Step 4: Verify**

Run: `npm run build`
Expected: Build succeeds with no errors

---

### Task 6: Verify & Test

- [ ] **Step 1: Full build verification**

Run: `npm run build 2>&1 | tail -30`
Expected: All routes compile successfully

- [ ] **Step 2: Check route types**

Run: `npm run build 2>&1 | grep -E "○ |ƒ |℞ "`
Expected:
- `○ /` - static
- `○ /login` - static
- `○ /register` - static
- `○ /f/[form_id]` - static
- `℞` routes for dashboard (cached)

- [ ] **Step 3: Commit changes**

```bash
git add -A
git commit -m "perf: add static generation and ISR for faster navigation"
```

---

## Summary

| Task | Description | Expected Impact |
|------|-------------|-----------------|
| 1 | Landing page static | Instant load |
| 2 | Auth pages static | Instant load |
| 3 | Dashboard ISR (60s) | <1s load (cached) |
| 4 | Form page static | Instant load |
| 5 | Lazy load components | Reduced bundle size |

After deployment to Vercel, navigation should be significantly faster.
