# Phase 2: Auth and Workspaces Testing Checklist

This document details the practical validation steps to ensure that Phase 1 & 2 security guarantees hold up before implementing any CRM feature logic (Phase 3).

## 1. Authentication Flow
- [ ] **Sign Up:** Navigate to `/register`. Submit form. 
  - *Expectation:* Account created, row auto-inserted into `public.profiles` via Postgres Trigger, and user is redirected to `/workspaces`.
- [ ] **Sign In:** Navigate to `/login`.
  - *Expectation:* Successful login redirects to `/workspaces`.
- [ ] **Sign Out:** Click `Sign out` from an active `/w/slug` dashboard.
  - *Expectation:* Session destroyed, user kicked to `/login`.

## 2. Protected Routes
- [ ] **Anonymous Access Attempt:** In an incognito window, attempt to hit `/workspaces` or `/w/test`.
  - *Expectation:* Instant redirect to `/login` via `middleware.ts`.
- [ ] **Logged-In Access Attempt:** While logged in, attempt to hit `/login`.
  - *Expectation:* Redirected back into the app (`/workspaces`).

## 3. Workspace Creation & Isolation
- [ ] **Create Flow:** Log in as User A. Click `Create a Workspace`. Submit name "Alpha" and slug `alpha`.
  - *Expectation:* Workspace `alpha` is created, User A is assigned 'owner' inside `workspace_members`, and redirected to `/w/alpha`.
- [ ] **Cross-Tenant Access Prevention:** Create a second account (User B). Log in as User B. Attempt to navigate manually to `http://localhost:3000/w/alpha`.
  - *Expectation:* Since User B is not in the `workspace_members` linking table for Alpha, the `requireWorkspaceScope` server utility and RLS will both reject the request and kick User B back to `/workspaces` with an "access denied" error.

## 4. RLS Database Level Testing
*(Execute these queries from the Supabase SQL Editor via an active authenticated user token)*
- [ ] **Profiles Check:** `SELECT * FROM public.profiles;`
  - *Expectation:* User only sees their own row.
- [ ] **Workspaces Check:** `UPDATE public.workspaces SET name = 'Hacked' WHERE slug = 'alpha';`
  - *Expectation:* If User B executes this, 0 rows affected (RLS silent drop). If User A (owner) executes this, 1 row affected.

If all the scenarios above hold true, the core multi-tenant foundation is fully secured and we can proceed to Phase 3.
