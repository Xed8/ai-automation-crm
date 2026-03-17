Now start Phase 2 only: Auth, workspaces, roles, and RLS foundations.

Goal:
Build the secure multi-tenant foundation of the SaaS.

Scope for this phase:
- Supabase Auth integration
- sign up
- sign in
- sign out
- protected routes
- user profile setup
- workspace creation
- workspace membership model
- member roles
- workspace switch support if needed in the data model
- Row Level Security policies for core auth/workspace tables
- server-side permission foundations
- secure Supabase server/client usage patterns

Do NOT build CRM features yet.
Do NOT build leads, boards, or tasks yet.
This phase is only for identity, tenancy, permissions, and secure access foundations.

Requirements:
- use production-minded patterns
- use TypeScript
- use clean modular structure
- explain the database schema changes clearly
- explain the RLS logic clearly
- prefer secure server-side handling where appropriate
- avoid hacky auth examples

What I want from you:
1. objective
2. schema/tables needed for this phase
3. RLS policy plan
4. roles and permission model
5. frontend pages/components needed
6. backend/server logic needed
7. implementation order
8. then generate the code and SQL for this phase only

Important:
- every relevant table must support workspace isolation
- explain tradeoffs if you make assumptions
- keep it aligned with future CRM and automation features