Now start Phase 5 only: Automations v1.

Goal:
Turn the CRM into an automation-first workflow system.

Scope for this phase:
- automation rules
- trigger definitions
- action definitions
- automation execution logic
- automation run logs
- basic retry/failure handling
- support for a practical MVP set of triggers and actions

Initial trigger scope:
- lead created
- lead updated
- stage changed
- form submitted
- inactivity threshold reached

Initial action scope:
- create task
- assign owner
- add tag if tags exist, otherwise postpone cleanly
- move stage
- create note
- send internal notification placeholder or hook
- enqueue AI action placeholder for future phase

Requirements:
- build a safe event-driven foundation
- avoid infinite loops
- log every automation run
- keep the implementation understandable
- do not jump to AI execution yet
- align the system with future async/background jobs

What I want:
1. objective
2. schema additions
3. trigger/action model
4. execution architecture
5. anti-loop strategy
6. implementation order
7. generate code and SQL for this phase only