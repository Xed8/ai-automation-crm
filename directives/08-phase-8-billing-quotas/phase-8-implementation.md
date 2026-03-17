Now start Phase 8 only: Billing, quotas, and plan enforcement.

Goal:
Turn the app into a real SaaS with enforceable product limits.

Scope:
- plan model
- workspace usage tracking
- feature gating
- quota checks
- soft limit warnings
- hard blocks at limits
- AI usage quotas
- board/lead/member limits
- automation usage limits if appropriate

Requirements:
- enforce limits server-side
- make the plan system easy to extend
- keep the first version practical
- do not build a huge billing system if not necessary yet
- if payment provider integration should be postponed, say so clearly and still build the internal quota system correctly

What I want:
1. objective
2. schema additions
3. quota model
4. enforcement architecture
5. UI states for upgrades/limit warnings
6. implementation order
7. generate code and SQL for this phase only