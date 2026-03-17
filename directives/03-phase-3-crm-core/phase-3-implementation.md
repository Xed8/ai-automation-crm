Now start Phase 3 only: CRM core.

Goal:
Build the first usable CRM layer for the SaaS.

Scope for this phase:
- boards
- pipeline stages
- leads
- owner assignment
- notes
- tasks
- lead activity timeline
- lead list views
- lead detail page
- basic dashboard counts if needed
- filters/search only if they are simple and necessary

Requirements:
- keep it MVP-focused
- do not move to forms, webhooks, automations, notifications, or AI yet
- keep all data workspace-scoped
- use clean schema design
- use server-side safe mutation flows where appropriate
- include activity logging for important CRM actions

What I want from you:
1. objective
2. database schema additions
3. relationships between tables
4. frontend pages/components needed
5. backend logic needed
6. activity tracking design
7. implementation order
8. then generate the code and SQL for this phase only

Important:
- this is not a generic CRM, it is for agency lead tracking
- each workspace can have multiple boards
- leads move through stages
- keep the UI practical and clean
- do not overbuild contacts/companies if not necessary yet