# Phase 1: Setup & Architecture Testing Checklist

This document serves as the final validation layer for Phase 1. Before moving to Phase 2, verify that all foundational elements of the SaaS are configured correctly.

## 1. Setup Verification Steps
- [ ] **Next.js Boot:** Run `npm run dev` and ensure the server starts on `localhost:3000` without throwing any React hydration or routing errors.
- [ ] **Default Route Navigation:** Navigate to `/` and verify the basic "Agency CRM" page renders correctly.
- [ ] **Dark Mode Toggle:** Modify `app/layout.tsx` temporarily to set `defaultTheme="dark"` and verify the background and text colors invert properly.

## 2. Configuration Verification Steps
- [ ] **Tailwind Configuration:** Inspect `tailwind.config.ts`. Ensure `darkMode: ["class"]` is set and the `content` array includes `./app/**/*.{ts,tsx}` and `./components/**/*.{ts,tsx}`.
- [ ] **shadcn/ui Configuration:** Inspect `components.json`. Ensure the aliases point to `@/components` and `@/lib/utils`.
- [ ] **TypeScript Configuration:** Inspect `tsconfig.json`. Ensure `strict: true` and `paths` are correctly mapped to `@/*`.

## 3. Environment Variable Checks
- [ ] Verify `.env.local` exists in the project root.
- [ ] Ensure `NEXT_PUBLIC_SUPABASE_URL` is defined.
- [ ] Ensure `NEXT_PUBLIC_SUPABASE_ANON_KEY` is defined.

## 4. Lint & Type-Check Expectations
- [ ] **Type Check:** Run `npx tsc --noEmit`. Expectation: 0 typescript errors.
- [ ] **Lint Check:** Run `npm run lint`. Expectation: 0 ESLint warnings or errors regarding imports or strict types.
- [ ] **Build Check:** Run `npm run build`. Expectation: Next.js successfully creates an optimized production build (`.next/` folder generated).

## 5. Folder Structure Verification
Ensure the following exact structure exists to prevent architectural drift in later phases:
- [ ] `app/(auth)/layout.tsx`
- [ ] `app/(dashboard)/layout.tsx`
- [ ] `app/layout.tsx`
- [ ] `app/page.tsx`
- [ ] `components/ui/`
- [ ] `components/shared/`
- [ ] `lib/supabase/client.ts`
- [ ] `lib/supabase/server.ts`
- [ ] `lib/supabase/middleware.ts`
- [ ] `middleware.ts` (Root)
- [ ] `types/supabase.ts`

## 6. Architecture Sanity Checks
- [ ] **Is the layout nested correctly?** The Dashboard should have its own shell (Sidebar placeholder) independent of the Auth layer.
- [ ] **Is SSR Authentication wired properly?** `middleware.ts` must call `updateSession` from `lib/supabase/middleware.ts` to guarantee cookie refreshes across all server requests.
- [ ] **Are UI Providers global?** `ThemeProvider` must wrap `{children}` inside the `<body>` element of the root `layout.tsx`.

> *If all checks pass, Phase 1 is officially complete and the foundation is secure for Phase 2 (Authentication & RLS).*
