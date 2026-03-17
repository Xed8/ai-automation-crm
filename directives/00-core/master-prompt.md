I want you to help me build a real SaaS product from scratch.

Project name:
AI Automation CRM for Agencies

Core concept:
This is a multi-tenant SaaS for agencies that helps them capture leads, organize them into boards/pipelines, automate follow-up workflows, and use AI to summarize, score, and suggest next actions for leads.

Main target users:
- small agencies
- web design agencies
- marketing agencies
- lead generation agencies
- appointment-setting agencies
- service businesses that manage inbound leads

Main product promise:
A simple, automation-first CRM for agencies with AI assistance.

Tech stack requirements:
- Frontend: Next.js
- Styling: Tailwind CSS
- UI: shadcn/ui
- Backend: Supabase
- Database: Supabase Postgres
- Auth: Supabase Auth
- Storage: Supabase Storage
- Realtime: Supabase Realtime where useful
- Background tasks / async jobs: Supabase Edge Functions, Cron, and Queues if needed
- Deployment target: Vercel for frontend, Supabase for backend services
- AI integration: API-based model routing with one cheaper model for lightweight tasks and one stronger model for advanced tasks
- Use TypeScript everywhere
- Keep the architecture production-minded and scalable
- Use clean folder structure and reusable modules
- Prefer server-side secure flows where appropriate
- Design the database and permissions correctly from the beginning

Very important product rules:
1. This is NOT a GoHighLevel clone.
2. Do NOT overbuild.
3. Start with a focused MVP for inbound lead management.
4. The first AI experience should be button-based AI actions, NOT an unlimited open chatbot.
5. The AI must never freely mutate database records without backend validation.
6. Every business table must support multi-tenant workspace isolation.
7. Workspace isolation and Row Level Security are required from the beginning.
8. Everything should be built in clear phases with scalable foundations.
9. I want production-quality thinking, not hacky demo logic.
10. If there are tradeoffs, explain them and choose the safer, more maintainable option.

Core product modules:
1. Authentication
2. Workspace and team management
3. Boards
4. Pipelines and stages
5. Leads
6. Contacts / companies if needed
7. Tasks
8. Notes
9. Activity timeline
10. Forms / lead capture
11. Webhook intake
12. Automations
13. Notifications
14. AI assist
15. Billing and usage limits later

Desired MVP scope:
- user sign up / sign in
- workspace creation
- workspace member roles
- boards
- pipeline stages
- leads CRUD
- owner assignment
- notes
- tasks
- lead activity timeline
- hosted or embedded forms
- webhook lead intake
- simple duplicate detection
- automation engine v1
- notifications
- AI lead summary
- AI lead scoring
- AI suggested reply
- AI next-step suggestion
- plan-based AI limits

Recommended plan structure:
Free:
- 1 workspace
- limited boards
- limited leads
- limited AI actions

Starter:
- more boards
- more leads
- automations
- moderate AI usage

Pro:
- advanced automations
- more members
- more AI usage
- more advanced AI assist

Data and architecture requirements:
- Design for multi-tenant SaaS
- Every core business row should include workspace_id
- Use Supabase Row Level Security properly
- Use service-role operations only in secure backend/server contexts
- Public form submission must go through secure server handling, not direct unrestricted table writes
- Include auditability where helpful
- Track AI usage and estimated cost per workspace
- Track automation runs and failures
- Build the app in modules so future integrations are easy

AI feature requirements:
The first AI features should be:
- summarize lead
- score lead
- suggest reply
- suggest next step

AI architecture rules:
- Use structured outputs wherever possible
- Treat each AI feature as a bounded backend action
- AI can suggest actions, but backend validates before saving anything
- Use cheaper model for lightweight tasks like scoring, tagging, short summaries
- Use stronger model for reply drafting or nuanced reasoning
- Log AI usage by workspace and user
- Support future expansion into specialized internal agents:
  - Lead Intake Agent
  - Lead Scoring Agent
  - Reply Agent
  - Task Planner Agent
  - Conversation Summary Agent

Automation engine requirements:
Triggers should eventually support:
- lead created
- lead updated
- stage changed
- form submitted
- inactivity threshold reached
- tag added
- task completed

Actions should eventually support:
- create task
- assign owner
- add tag
- move stage
- create note
- send internal notification
- enqueue AI action
- send webhook

Important UX direction:
This should feel like a clean, modern, focused agency CRM.
The UI should be simple, not overloaded.
The main interface should prioritize:
- dashboard clarity
- easy lead tracking
- board-based workflow
- quick actions
- AI assist buttons on lead pages
- clear activity history

Coding standards:
- TypeScript
- clean architecture
- reusable components
- modular server actions / API routes
- strong typing for DB entities and app models
- form validation
- error handling
- loading states
- empty states
- role-based access handling
- no unnecessary duplication
- write maintainable code, not just working code

What I want from you:
I do NOT want you to immediately dump the whole app in one response.
I want you to act like a senior engineer and build this project with me in the correct order.

Your workflow should be:
1. First, analyze the product and produce a practical implementation plan
2. Then define the app architecture
3. Then define the folder structure
4. Then define the database schema
5. Then define the permission model
6. Then define the build phases
7. Then start implementing phase by phase
8. At each phase, explain what you are building and why
9. Do not skip foundational work just to rush UI
10. If something should be postponed from MVP, clearly say so

Response format I want from you:
For each major phase, give me:
- objective
- why it matters
- what files/modules will be created
- database changes if any
- frontend pages/components affected
- backend logic needed
- security concerns
- what should be tested
- what should come next

Development phases I want you to follow:
Phase 1: Project setup and architecture
Phase 2: Auth, workspaces, roles, and RLS foundations
Phase 3: CRM core (boards, stages, leads, notes, tasks)
Phase 4: Lead intake (forms, webhook ingestion, duplicate handling)
Phase 5: Automations v1
Phase 6: Notifications
Phase 7: AI assist v1
Phase 8: Billing, quotas, and plan enforcement
Phase 9: Integrations and polish

Important implementation behavior:
- Ask yourself whether each feature belongs in MVP or later
- Prefer building the backend structure correctly before advanced UI polish
- Do not invent unnecessary complexity
- Be explicit and practical
- If there are missing decisions, recommend the best default instead of stalling
- Keep the product aligned with the core SaaS idea

First task:
Start by giving me:
1. a refined project architecture
2. the recommended folder structure
3. the database schema for the MVP
4. the permission model
5. the exact implementation order for Phase 1 to Phase 3

After that, we will build the project step by step.

Respond in a structured engineering format. Stay strictly within the requested phase. Do not implement future phases. If something belongs later, mark it as postponed.