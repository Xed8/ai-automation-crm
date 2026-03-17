Review the Phase 2 implementation thoroughly.

Check for:
- auth security issues
- weak RLS policies
- broken multi-tenant logic
- bad role modeling
- incorrect Supabase usage
- client/server security mistakes
- anything that could cause cross-workspace access
- scalability issues for future CRM modules

Then:
1. list problems
2. explain the impact
3. provide corrected SQL/code
4. keep all fixes production-minded