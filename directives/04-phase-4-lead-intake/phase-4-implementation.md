Now start Phase 4 only: Lead intake.

Goal:
Allow the CRM to receive leads from outside the app.

Scope for this phase:
- form definitions
- hosted form submission
- embeddable form support architecture
- webhook lead intake
- server-side validation
- spam protection basics
- duplicate detection basics
- intake source tracking
- board/stage destination mapping
- activity log entries for inbound leads

Do NOT build automations yet.
Do NOT build notifications yet.
Do NOT build AI yet.

Requirements:
- public submission flows must be secure
- do not allow direct unrestricted writes from the client to business tables
- keep duplicate detection simple but useful
- align the schema and logic with future automation features

What I want from you:
1. objective
2. database additions
3. secure intake architecture
4. frontend pages/components needed
5. webhook endpoint design
6. duplicate detection approach
7. implementation order
8. then generate code and SQL for this phase only