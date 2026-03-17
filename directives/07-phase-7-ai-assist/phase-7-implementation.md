Now start Phase 7 only: AI assist v1.

Goal:
Add bounded, useful AI features inside the CRM without creating an uncontrolled chatbot.

Scope:
- AI lead summary
- AI lead scoring
- AI suggested reply
- AI next-step suggestion
- AI usage logging
- AI action limits by workspace/plan foundation
- structured AI outputs
- backend-controlled AI execution

Requirements:
- no unlimited freeform AI chat
- each AI feature should be a bounded action
- AI can suggest, but backend validates before saving anything
- use model routing strategy:
  - cheaper model for scoring, tagging, short summary
  - stronger model for reply drafting and nuanced reasoning
- log usage and estimated cost per workspace and user
- keep prompts modular and reusable
- keep the architecture ready for future specialized internal agents

What I want:
1. objective
2. schema additions
3. AI service architecture
4. model routing logic
5. structured output shapes
6. UI integration on lead pages
7. usage tracking design
8. implementation order
9. generate code for this phase only